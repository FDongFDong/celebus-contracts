// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721A} from "erc721a/contracts/ERC721A.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CelebusNFT
 * @notice Celebus NFT 시스템 - ERC721A 기반
 * @dev 데이터 구조만 정의, 기능 구현은 추후 진행
 *
 * NFT 등급: Event < Normal < Special < Wicked < Next < Final
 * Soft Burn: isLocked로 전송/합성/뽑기 차단
 */
contract CelebusNFT is ERC721A, Ownable {
    // ========================================
    // 데이터 구조
    // ========================================

    /**
     * @notice NFT 등급
     */
    enum Grade {
        Event,      // 0: 이벤트 NFT
        Normal,     // 1: 노멀 등급
        Special,    // 2: 스페셜 등급
        Wicked,     // 3: 위키드 등급
        Next,       // 4: 넥스트 등급
        Final       // 5: 파이널 등급
    }

    /**
     * @notice NFT 메타데이터 (온체인)
     * @param participantId 참가자 ID (1~50)
     * @param grade 등급
     * @param gradeNumber 등급 번호 (001~024)
     * @param edition 에디션 (1st, 2nd, ...)
     * @param isLocked Soft Burn 상태 (true = 전송/합성/뽑기 불가)
     */
    struct Metadata {
        uint256 participantId;    // 참가자 ID
        Grade grade;              // 등급
        uint256 gradeNumber;      // 등급 번호
        uint256 edition;          // 에디션
        bool isLocked;            // Soft Burn 상태
    }

    // ========================================
    // 저장소
    // ========================================

    /**
     * @notice 토큰 ID => NFT 메타데이터
     */
    mapping(uint256 => Metadata) public nftMetadata;

    /**
     * @notice 서명 재사용 방지
     */
    mapping(bytes32 => bool) public usedSignatures;

    /**
     * @notice 서비스 지갑 (미리 발행된 NFT 보관)
     */
    address public serviceWallet;

    /**
     * @notice 백엔드 서명자
     */
    address public backendSigner;

    // ========================================
    // 생성자
    // ========================================

    /**
     * @notice CelebusNFT 생성자
     * @param _serviceWallet 서비스 지갑 주소
     * @param _backendSigner 백엔드 서명자 주소
     */
    constructor(address _serviceWallet, address _backendSigner)
        ERC721A("Celebus NFT", "CNFT")
        Ownable(msg.sender)
    {
        require(_serviceWallet != address(0), "Invalid service wallet");
        require(_backendSigner != address(0), "Invalid backend signer");

        serviceWallet = _serviceWallet;
        backendSigner = _backendSigner;
    }
}
