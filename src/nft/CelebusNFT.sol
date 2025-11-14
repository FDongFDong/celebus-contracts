// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.5.0
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {
    ERC721Burnable
} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {
    ERC721Pausable
} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CelebusNFT
 * @dev Celebus 플랫폼 NFT 컨트랙트
 *
 * 주요 기능:
 * - ERC721 표준 NFT 구현
 * - 일시정지 기능 (긴급 상황 시 모든 전송 차단)
 * - 토큰 잠금 기능 (개별 토큰 전송 차단)
 * - 배치 민팅 (가스 효율적인 대량 발행)
 * - Owner만 소각 가능 (사용자는 자신의 NFT도 소각 불가)
 *
 * 보안 특징:
 * - Owner만 민팅, 잠금, 일시정지, 소각 가능
 * - 잠긴 토큰은 Owner만 전송 가능
 */
contract CelebusNFT is ERC721, ERC721Pausable, Ownable, ERC721Burnable {
    // ============================================
    // 상태 변수
    // ============================================

    /// @dev 토큰별 잠금 상태 (true = 잠김, false = 잠금 해제)
    mapping(uint256 => bool) private _locked;

    // ============================================
    // 이벤트
    // ============================================

    /// @dev 토큰이 잠겼을 때 발생
    event TokenLocked(uint256 indexed tokenId);

    /// @dev 토큰 잠금이 해제되었을 때 발생
    event TokenUnlocked(uint256 indexed tokenId);

    // ============================================
    // 에러
    // ============================================

    /// @dev 잠긴 토큰을 전송하려 할 때 발생
    error TokenIsLocked(uint256 tokenId);

    /// @dev 존재하지 않는 토큰에 대한 작업 시도 시 발생
    error TokenDoesNotExist(uint256 tokenId);

    /// @dev Owner가 아닌 주소가 소각을 시도할 때 발생
    error OnlyOwnerCanBurn();

    /// @dev 배치 작업 시 빈 배열이 전달되었을 때 발생
    error EmptyBatch();

    // ============================================
    // 생성자
    // ============================================

    /**
     * @dev 컨트랙트 초기화
     * @param initialOwner 초기 소유자 주소 (민팅, 잠금, 일시정지 권한)
     */
    constructor(
        address initialOwner
    ) ERC721("CelebusNFT", "CELEB") Ownable(initialOwner) {}

    // ============================================
    // 일시정지 기능
    // ============================================

    /**
     * @dev 모든 NFT 전송을 일시정지 (긴급 상황용)
     * @notice Owner만 호출 가능
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev 일시정지 해제
     * @notice Owner만 호출 가능
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    // ============================================
    // 민팅 기능
    // ============================================

    /**
     * @dev 단일 NFT 안전 민팅
     * @param to 받을 주소
     * @param tokenId 토큰 ID
     * @notice Owner만 호출 가능
     */
    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }

    /**
     * @dev 연속된 토큰 ID로 여러 NFT를 배치 민팅
     * @param to 받을 주소
     * @param startTokenId 시작 토큰 ID
     * @param count 민팅할 개수
     * @notice Owner만 호출 가능
     * @notice 가스 효율을 위해 루프로 구현
     */
    function batchMint(
        address to,
        uint256 startTokenId,
        uint256 count
    ) external onlyOwner {
        for (uint256 i = 0; i < count; i++) {
            _safeMint(to, startTokenId + i);
        }
    }

    // ============================================
    // 토큰 잠금 기능
    // ============================================

    /**
     * @dev 토큰 잠금 (전송 차단)
     * @param tokenId 잠글 토큰 ID
     * @notice Owner만 호출 가능
     * @notice 잠긴 토큰은 Owner만 전송 가능
     */
    function lockToken(uint256 tokenId) external onlyOwner {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        _locked[tokenId] = true;
        emit TokenLocked(tokenId);
    }

    /**
     * @dev 토큰 잠금 해제
     * @param tokenId 잠금 해제할 토큰 ID
     * @notice Owner만 호출 가능
     */
    function unlockToken(uint256 tokenId) external onlyOwner {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        _locked[tokenId] = false;
        emit TokenUnlocked(tokenId);
    }

    /**
     * @dev 여러 토큰을 배치로 잠금
     * @param tokenIds 잠글 토큰 ID 배열
     * @notice Owner만 호출 가능
     * @notice 배치 크기 제한 없음 (가스 한도만 고려)
     */
    function batchLockTokens(uint256[] calldata tokenIds) external onlyOwner {
        if (tokenIds.length == 0) revert EmptyBatch();

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            if (_ownerOf(tokenId) == address(0))
                revert TokenDoesNotExist(tokenId);
            _locked[tokenId] = true;
            emit TokenLocked(tokenId);
        }
    }

    /**
     * @dev 여러 토큰의 잠금을 배치로 해제
     * @param tokenIds 잠금 해제할 토큰 ID 배열
     * @notice Owner만 호출 가능
     * @notice 배치 크기 제한 없음 (가스 한도만 고려)
     */
    function batchUnlockTokens(uint256[] calldata tokenIds) external onlyOwner {
        if (tokenIds.length == 0) revert EmptyBatch();

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            if (_ownerOf(tokenId) == address(0))
                revert TokenDoesNotExist(tokenId);
            _locked[tokenId] = false;
            emit TokenUnlocked(tokenId);
        }
    }

    // ============================================
    // 조회 기능
    // ============================================

    /**
     * @dev 토큰 잠금 상태 확인
     * @param tokenId 확인할 토큰 ID
     * @return 잠김(true) 또는 잠금 해제(false)
     */
    function isLocked(uint256 tokenId) public view returns (bool) {
        return _locked[tokenId];
    }

    // ============================================
    // 소각 기능
    // ============================================

    /**
     * @dev 토큰 소각 (Owner만 가능)
     * @param tokenId 소각할 토큰 ID
     * @notice Owner만 호출 가능
     * @notice 사용자는 자신의 NFT도 소각할 수 없음 (Owner 권한 필요)
     */
    function burn(uint256 tokenId) public override {
        if (msg.sender != owner()) revert OnlyOwnerCanBurn();
        // Owner는 approval 체크 없이 모든 토큰 소각 가능
        _burn(tokenId);
    }

    // ============================================
    // 내부 함수 오버라이드
    // ============================================

    /**
     * @dev ERC721 전송 로직 오버라이드
     * @param to 받을 주소
     * @param tokenId 토큰 ID
     * @param auth 권한 주소 (Owner면 잠금 무시)
     * @return 이전 소유자 주소
     *
     * 전송 차단 규칙:
     * - 민팅(from = 0x0): 허용
     * - 소각(to = 0x0): 허용
     * - 잠긴 토큰 전송: Owner만 허용, 일반 사용자는 차단
     * - 일시정지 상태: 모든 전송 차단
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Pausable) returns (address) {
        address from = _ownerOf(tokenId);

        // 민팅 허용 (from == address(0))
        // 소각 허용 (to == address(0))
        // 잠긴 토큰 전송은 Owner만 가능
        if (
            from != address(0) &&
            to != address(0) &&
            _locked[tokenId] &&
            auth != owner()
        ) {
            revert TokenIsLocked(tokenId);
        }

        return super._update(to, tokenId, auth);
    }
}
