// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CelbToken
 * @notice Celebus 생태계의 유틸리티 토큰
 * @dev ERC20 + Permit (gasless approval 지원)
 *
 * 주의: 투표 시스템의 CELB(오프체인 포인트)와는 완전히 별개의 토큰
 */
contract CelbToken is ERC20, ERC20Permit, Ownable {
    // ========================================
    // 이벤트
    // ========================================

    /**
     * @notice 토큰 발행 이벤트
     */
    event TokensMinted(address indexed to, uint256 amount);

    /**
     * @notice 토큰 소각 이벤트
     */
    event TokensBurned(address indexed from, uint256 amount);

    // ========================================
    // 생성자
    // ========================================

    /**
     * @notice CelbToken 생성자
     */
    constructor()
        ERC20("Celeb Token", "CELB")
        ERC20Permit("Celeb Token")
        Ownable(msg.sender)
    {
        // 초기 공급량 설정 (필요시 주석 해제)
        // 예: 10억 CELB 발행
        // _mint(msg.sender, 1_000_000_000 * 10 ** decimals());
    }

    // ========================================
    // 외부 함수
    // ========================================

    /**
     * @notice 토큰 발행 (Owner만 가능)
     * @param to 받는 주소
     * @param amount 발행량
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @notice 토큰 소각 (Owner만 가능)
     * @param from 소각할 주소
     * @param amount 소각량
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
}
