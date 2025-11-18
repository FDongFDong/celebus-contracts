// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MainVoting} from "../src/vote/MainVoting.sol";

/**
 * @title MockERC1271Wallet
 * @notice ERC-1271 스마트 계약 지갑 테스트용 Mock 컨트랙트
 */
contract MockERC1271Wallet {
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;
    bytes4 private constant ERC1271_INVALID = 0xffffffff;
    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }

    function isValidSignature(bytes32 hash, bytes calldata signature)
        external
        view
        returns (bytes4 magicValue)
    {
        if (signature.length != 65) {
            assembly {
                mstore(0x00, 0xffffffff00000000000000000000000000000000000000000000000000000000)
                return(0x00, 0x04)
            }
        }

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        address recovered = ecrecover(hash, v, r, s);

        if (recovered == owner) {
            assembly {
                mstore(0x00, 0x1626ba7e00000000000000000000000000000000000000000000000000000000)
                return(0x00, 0x04)
            }
        } else {
            assembly {
                mstore(0x00, 0xffffffff00000000000000000000000000000000000000000000000000000000)
                return(0x00, 0x04)
            }
        }
    }
}

/**
 * @title MainVotingV1Test
 * @notice MainVoting V1 (단순화 설계) 포괄적 테스트
 * @dev 핵심 변경사항:
 *      - 문자열 제거 → candidateId + voteType (0/1)
 *      - Record Nonce 제거
 *      - Batch 서명 단순화 (batchNonce만)
 *      - 집계 기능 추가
 */
contract MainVotingV1Test is Test {
    MainVoting public voting;

    address public owner;
    address public executorSigner;
    address public user1;
    address public user2;
    address public user3;

    uint256 public user1PrivateKey;
    uint256 public user2PrivateKey;
    uint256 public user3PrivateKey;
    uint256 public executorPrivateKey;

    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    bytes32 public constant VOTE_RECORD_TYPEHASH = keccak256(
        "VoteRecord(uint256 timestamp,uint256 missionId,uint256 votingId,address userAddress,bytes32 userIdHash,uint256 candidateId,uint8 voteType,uint256 votingAmt)"
    );

    bytes32 public constant USER_BATCH_TYPEHASH = keccak256(
        "UserBatch(address user,uint256 userNonce,bytes32 recordsHash)"
    );

    bytes32 public constant BATCH_TYPEHASH = keccak256(
        "Batch(uint256 batchNonce)"
    );

    // 이벤트 (컨트랙트에서 emit되는 것과 동일하게 선언)
    event ExecutorSignerChanged(
        address indexed oldSigner,
        address indexed newSigner,
        uint256 oldMinNonce
    );
    event UserBatchProcessed(
        bytes32 indexed batchDigest,
        address indexed user,
        uint256 userNonce,
        uint256 recordCount,
        uint256 storedCount
    );
    event BatchProcessed(
        bytes32 indexed batchDigest,
        address indexed executorSigner,
        uint256 batchNonce,
        uint256 recordCount,
        uint256 userCount
    );
    event CandidateSet(
        uint256 indexed missionId,
        uint256 indexed candidateId,
        string name,
        bool allowed
    );
    event VoteTypeSet(uint8 indexed voteType, string name);

    function setUp() public {
        owner = address(this);

        user1PrivateKey = 0x1111;
        user2PrivateKey = 0x2222;
        user3PrivateKey = 0x3333;
        executorPrivateKey = 0x4444;

        user1 = vm.addr(user1PrivateKey);
        user2 = vm.addr(user2PrivateKey);
        user3 = vm.addr(user3PrivateKey);
        executorSigner = vm.addr(executorPrivateKey);

        voting = new MainVoting(owner);
        voting.setExecutorSigner(executorSigner);

        // 기본 후보 설정
        voting.setCandidate(1, 1, "Artist-1", true);
        voting.setCandidate(1, 2, "Artist-2", true);
        voting.setCandidate(1, 3, "Artist-3", true);

        // Vote Type 라벨 설정
        voting.setVoteTypeName(0, "Forget");
        voting.setVoteTypeName(1, "Remember");
    }

    function _buildDomainSeparator() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes("MainVoting")),
                keccak256(bytes("1")),
                block.chainid,
                address(voting)
            )
        );
    }

    function _hashTypedDataV4(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", _buildDomainSeparator(), structHash));
    }

    function _createVoteRecord(
        address userAddress,
        string memory userId,
        uint256 missionId,
        uint256 votingId,
        uint256 candidateId,
        uint8 voteType,
        uint256 votingAmt
    ) internal view returns (MainVoting.VoteRecord memory) {
        return MainVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: missionId,
            votingId: votingId,
            userAddress: userAddress,
            candidateId: candidateId,
            voteType: voteType,
            userId: userId,
            votingAmt: votingAmt
        });
    }

    function _signUserBatch(
        uint256 privateKey,
        address user,
        uint256 userNonce,
        MainVoting.VoteRecord[] memory userRecords
    ) internal view returns (bytes memory) {
        bytes32[] memory hashes = new bytes32[](userRecords.length);
        for (uint256 i; i < userRecords.length; ) {
            hashes[i] = voting.hashVoteRecord(userRecords[i]);
            unchecked { ++i; }
        }
        bytes32 recordsHash = keccak256(abi.encodePacked(hashes));
        bytes32 structHash = keccak256(
            abi.encode(USER_BATCH_TYPEHASH, user, userNonce, recordsHash)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _signExecutorBatch(
        uint256 privateKey,
        uint256 batchNonce
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(BATCH_TYPEHASH, batchNonce)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    // ========================================
    // 1. 기본 기능 테스트
    // ========================================

    function test_Constructor() public view {
        assertEq(voting.owner(), owner);
        assertEq(voting.CHAIN_ID(), block.chainid);
    }

    function test_SetExecutorSigner() public {
        address newExecutor = address(0x9999);
        
        vm.expectEmit(true, true, false, true);
        emit ExecutorSignerChanged(executorSigner, newExecutor, 0);
        
        voting.setExecutorSigner(newExecutor);
        assertEq(voting.executorSigner(), newExecutor);
    }

    function test_RevertWhen_SetExecutorSignerZeroAddress() public {
        vm.expectRevert(MainVoting.ZeroAddress.selector);
        voting.setExecutorSigner(address(0));
    }

    function test_SetCandidate() public {
        vm.expectEmit(true, true, false, true);
        emit CandidateSet(2, 10, "New-Artist", true);
        
        voting.setCandidate(2, 10, "New-Artist", true);
        
        assertEq(voting.candidateName(2, 10), "New-Artist");
        assertTrue(voting.allowedCandidate(2, 10));
    }

    function test_SetVoteTypeName() public {
        vm.expectEmit(true, false, false, true);
        emit VoteTypeSet(1, "Love");
        
        voting.setVoteTypeName(1, "Love");
        assertEq(voting.voteTypeName(1), "Love");
    }

    function test_RevertWhen_SetInvalidVoteType() public {
        vm.expectRevert(abi.encodeWithSelector(MainVoting.InvalidVoteType.selector, 2));
        voting.setVoteTypeName(2, "Invalid");
    }

    // ========================================
    // 2. 단일 사용자 배치 투표 테스트
    // ========================================

    function test_SubmitSingleUserBatch() public {
        // User1의 투표 레코드 생성
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](2);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100); // Remember
        records[1] = _createVoteRecord(user1, "user1", 1, 1, 2, 0, 50);  // Forget

        // User1 서명
        MainVoting.VoteRecord[] memory user1Records = new MainVoting.VoteRecord[](2);
        user1Records[0] = records[0];
        user1Records[1] = records[1];
        
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, user1Records);

        // UserBatchSig 생성
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](2);
        indices[0] = 0;
        indices[1] = 1;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: user1Sig
        });

        // Executor 서명 (batchNonce만)
        uint256 batchNonce = 0;
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, batchNonce);

        // 제출
        voting.submitMultiUserBatch(records, userBatchSigs, batchNonce, executorSig);

        // 검증
        assertEq(voting.getVoteCountByVotingId(1, 1), 2);
        
        // 집계 검증
        (uint256 remember, uint256 forget, uint256 total) = voting.getCandidateAggregates(1, 1);
        assertEq(remember, 100);
        assertEq(forget, 0);
        assertEq(total, 100);

        (remember, forget, total) = voting.getCandidateAggregates(1, 2);
        assertEq(remember, 0);
        assertEq(forget, 50);
        assertEq(total, 50);
    }

    // ========================================
    // 3. 다중 사용자 배치 투표 테스트
    // ========================================

    function test_SubmitMultiUserBatch() public {
        // 3명의 사용자, 각각 2개씩 투표
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](6);
        
        // User1 투표
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        records[1] = _createVoteRecord(user1, "user1", 1, 1, 2, 0, 50);
        
        // User2 투표
        records[2] = _createVoteRecord(user2, "user2", 1, 1, 1, 1, 200);
        records[3] = _createVoteRecord(user2, "user2", 1, 1, 3, 1, 75);
        
        // User3 투표
        records[4] = _createVoteRecord(user3, "user3", 1, 1, 2, 1, 150);
        records[5] = _createVoteRecord(user3, "user3", 1, 1, 3, 0, 25);

        // 각 사용자 서명
        MainVoting.VoteRecord[] memory user1Records = new MainVoting.VoteRecord[](2);
        user1Records[0] = records[0];
        user1Records[1] = records[1];
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, user1Records);

        MainVoting.VoteRecord[] memory user2Records = new MainVoting.VoteRecord[](2);
        user2Records[0] = records[2];
        user2Records[1] = records[3];
        bytes memory user2Sig = _signUserBatch(user2PrivateKey, user2, 0, user2Records);

        MainVoting.VoteRecord[] memory user3Records = new MainVoting.VoteRecord[](2);
        user3Records[0] = records[4];
        user3Records[1] = records[5];
        bytes memory user3Sig = _signUserBatch(user3PrivateKey, user3, 0, user3Records);

        // UserBatchSig 배열 생성
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](3);
        
        uint256[] memory indices1 = new uint256[](2);
        indices1[0] = 0; indices1[1] = 1;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices1,
            signature: user1Sig
        });

        uint256[] memory indices2 = new uint256[](2);
        indices2[0] = 2; indices2[1] = 3;
        userBatchSigs[1] = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            recordIndices: indices2,
            signature: user2Sig
        });

        uint256[] memory indices3 = new uint256[](2);
        indices3[0] = 4; indices3[1] = 5;
        userBatchSigs[2] = MainVoting.UserBatchSig({
            user: user3,
            userNonce: 0,
            recordIndices: indices3,
            signature: user3Sig
        });

        // Executor 서명
        uint256 batchNonce = 0;
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, batchNonce);

        // 제출
        voting.submitMultiUserBatch(records, userBatchSigs, batchNonce, executorSig);

        // 검증
        assertEq(voting.getVoteCountByVotingId(1, 1), 6);

        // Candidate 1 집계: Remember 300 (user1: 100 + user2: 200)
        (uint256 remember, uint256 forget, uint256 total) = voting.getCandidateAggregates(1, 1);
        assertEq(remember, 300);
        assertEq(forget, 0);
        assertEq(total, 300);

        // Candidate 2 집계: Forget 50 (user1), Remember 150 (user3)
        (remember, forget, total) = voting.getCandidateAggregates(1, 2);
        assertEq(remember, 150);
        assertEq(forget, 50);
        assertEq(total, 200);

        // Candidate 3 집계: Remember 75 (user2), Forget 25 (user3)
        (remember, forget, total) = voting.getCandidateAggregates(1, 3);
        assertEq(remember, 75);
        assertEq(forget, 25);
        assertEq(total, 100);
    }

    // ========================================
    // 4. Nonce 관리 테스트
    // ========================================

    function test_UserNonceIncrement() public {
        // 첫 번째 배치
        MainVoting.VoteRecord[] memory records1 = new MainVoting.VoteRecord[](1);
        records1[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        
        bytes memory user1Sig1 = _signUserBatch(user1PrivateKey, user1, 0, records1);
        
        MainVoting.UserBatchSig[] memory userBatchSigs1 = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices1 = new uint256[](1);
        indices1[0] = 0;
        userBatchSigs1[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices1,
            signature: user1Sig1
        });
        
        bytes memory executorSig1 = _signExecutorBatch(executorPrivateKey, 0);
        voting.submitMultiUserBatch(records1, userBatchSigs1, 0, executorSig1);

        // 두 번째 배치 (userNonce = 1)
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord(user1, "user1", 1, 1, 2, 1, 200);
        
        bytes memory user1Sig2 = _signUserBatch(user1PrivateKey, user1, 1, records2);
        
        MainVoting.UserBatchSig[] memory userBatchSigs2 = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices2 = new uint256[](1);
        indices2[0] = 0;
        userBatchSigs2[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 1,
            recordIndices: indices2,
            signature: user1Sig2
        });
        
        bytes memory executorSig2 = _signExecutorBatch(executorPrivateKey, 1);
        voting.submitMultiUserBatch(records2, userBatchSigs2, 1, executorSig2);

        // 검증
        assertTrue(voting.userNonceUsed(user1, 0));
        assertTrue(voting.userNonceUsed(user1, 1));
    }

    function test_RevertWhen_UserNonceReused() public {
        // 첫 번째 제출
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, records);
        
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: user1Sig
        });
        
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);

        // 같은 userNonce로 재시도
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord(user1, "user1", 1, 1, 2, 1, 200);
        
        bytes memory user1Sig2 = _signUserBatch(user1PrivateKey, user1, 0, records2);
        
        MainVoting.UserBatchSig[] memory userBatchSigs2 = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices2 = new uint256[](1);
        indices2[0] = 0;
        userBatchSigs2[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices2,
            signature: user1Sig2
        });
        
        bytes memory executorSig2 = _signExecutorBatch(executorPrivateKey, 1);
        
        vm.expectRevert(MainVoting.UserNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(records2, userBatchSigs2, 1, executorSig2);
    }

    function test_CancelAllUserNonceUpTo() public {
        voting.cancelAllUserNonceUpTo(user1, 100);
        assertEq(voting.minUserNonce(user1), 100);

        // userNonce < 100 사용 시도 → 실패
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 50, records);
        
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 50,
            recordIndices: indices,
            signature: user1Sig
        });
        
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        
        vm.expectRevert(MainVoting.UserNonceTooLow.selector);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
    }

    function test_RevertWhen_BatchNonceReused() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, records);
        
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: user1Sig
        });
        
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);

        // 같은 batchNonce로 재시도
        MainVoting.VoteRecord[] memory records2 = new MainVoting.VoteRecord[](1);
        records2[0] = _createVoteRecord(user2, "user2", 1, 1, 2, 1, 200);
        
        bytes memory user2Sig = _signUserBatch(user2PrivateKey, user2, 0, records2);
        
        MainVoting.UserBatchSig[] memory userBatchSigs2 = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices2 = new uint256[](1);
        indices2[0] = 0;
        userBatchSigs2[0] = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            recordIndices: indices2,
            signature: user2Sig
        });
        
        bytes memory executorSig2 = _signExecutorBatch(executorPrivateKey, 0);
        
        vm.expectRevert(MainVoting.BatchNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(records2, userBatchSigs2, 0, executorSig2);
    }

    // ========================================
    // 5. 서명 검증 테스트
    // ========================================

    function test_RevertWhen_InvalidUserSignature() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        
        // 잘못된 개인키로 서명
        bytes memory wrongSig = _signUserBatch(user2PrivateKey, user1, 0, records);
        
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: wrongSig
        });
        
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        
        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
    }

    function test_RevertWhen_InvalidExecutorSignature() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, records);
        
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: user1Sig
        });
        
        // 잘못된 개인키로 서명
        bytes memory wrongExecutorSig = _signExecutorBatch(user1PrivateKey, 0);
        
        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, wrongExecutorSig);
    }

    // ========================================
    // 6. ERC-1271 스마트 계약 지갑 테스트
    // ========================================

    function test_SmartContractWallet_UserSignature() public {
        // User1의 EOA로 제어되는 스마트 계약 지갑 생성
        MockERC1271Wallet wallet = new MockERC1271Wallet(user1);

        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(address(wallet), "wallet", 1, 1, 1, 1, 100);
        
        // User1 개인키로 서명 (지갑이 검증)
        bytes memory walletSig = _signUserBatch(user1PrivateKey, address(wallet), 0, records);
        
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: address(wallet),
            userNonce: 0,
            recordIndices: indices,
            signature: walletSig
        });
        
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
        
        assertEq(voting.getVoteCountByVotingId(1, 1), 1);
    }

    // ========================================
    // 7. 에러 케이스 테스트
    // ========================================

    function test_RevertWhen_UncoveredRecord() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](2);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        records[1] = _createVoteRecord(user1, "user1", 1, 1, 2, 0, 50);
        
        // indices[0]만 포함 (indices[1] 누락)
        MainVoting.VoteRecord[] memory partialRecords = new MainVoting.VoteRecord[](1);
        partialRecords[0] = records[0];
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, partialRecords);
        
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](1);
        indices[0] = 0; // indices[1] 누락!
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: user1Sig
        });
        
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        
        vm.expectRevert(abi.encodeWithSelector(MainVoting.UncoveredRecord.selector, 1));
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
    }

    function test_RevertWhen_DuplicateIndex() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](2);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        records[1] = _createVoteRecord(user1, "user1", 1, 1, 2, 0, 50);
        
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, records);
        
        // 중복 인덱스
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](3);
        indices[0] = 0;
        indices[1] = 1;
        indices[2] = 1; // 중복!
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: user1Sig
        });
        
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        
        vm.expectRevert(abi.encodeWithSelector(MainVoting.DuplicateIndex.selector, 1));
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
    }

    function test_RevertWhen_CandidateNotAllowed() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 999, 1, 100); // candidateId 999는 허용 안됨
        
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, records);
        
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: user1Sig
        });
        
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        
        vm.expectRevert(abi.encodeWithSelector(MainVoting.CandidateNotAllowed.selector, 1, 999));
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
    }

    function test_RevertWhen_InvalidVoteType() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 2, 100); // voteType 2는 유효하지 않음
        
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, records);
        
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: user1Sig
        });
        
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        
        vm.expectRevert(abi.encodeWithSelector(MainVoting.InvalidVoteType.selector, 2));
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
    }

    function test_RevertWhen_StringTooLong() public {
        string memory longUserId = new string(101); // MAX_STRING_LENGTH = 100
        
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, longUserId, 1, 1, 1, 1, 100);
        
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, records);
        
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: user1Sig
        });
        
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        
        vm.expectRevert(MainVoting.StringTooLong.selector);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
    }

    function test_RevertWhen_UserBatchTooLarge() public {
        // MAX_RECORDS_PER_USER_BATCH = 20
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](21);
        for (uint256 i; i < 21; i++) {
            records[i] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        }
        
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, records);
        
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](21);
        for (uint256 i; i < 21; i++) {
            indices[i] = i;
        }
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: user1Sig
        });
        
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        
        vm.expectRevert(MainVoting.UserBatchTooLarge.selector);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
    }

    // ========================================
    // 8. 조회 함수 테스트
    // ========================================

    function test_GetVoteSummariesByMissionVotingId() public {
        // 투표 제출
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](2);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        records[1] = _createVoteRecord(user1, "user1", 1, 1, 2, 0, 50);
        
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, records);
        
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](2);
        indices[0] = 0; indices[1] = 1;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: user1Sig
        });
        
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);

        // 조회
        MainVoting.VoteRecordSummary[] memory summaries = voting.getVoteSummariesByMissionVotingId(1, 1);
        
        assertEq(summaries.length, 2);
        assertEq(summaries[0].userId, "user1");
        assertEq(summaries[0].votingFor, "Artist-1");
        assertEq(summaries[0].votedOn, "Remember");
        assertEq(summaries[0].votingAmt, 100);
        
        assertEq(summaries[1].votingFor, "Artist-2");
        assertEq(summaries[1].votedOn, "Forget");
        assertEq(summaries[1].votingAmt, 50);
    }

    function test_GetCandidateAggregates() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](4);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100); // Remember
        records[1] = _createVoteRecord(user1, "user1", 1, 1, 1, 0, 30);  // Forget
        records[2] = _createVoteRecord(user2, "user2", 1, 1, 1, 1, 200); // Remember
        records[3] = _createVoteRecord(user2, "user2", 1, 1, 1, 1, 50);  // Remember
        
        MainVoting.VoteRecord[] memory user1Records = new MainVoting.VoteRecord[](2);
        user1Records[0] = records[0];
        user1Records[1] = records[1];
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, user1Records);

        MainVoting.VoteRecord[] memory user2Records = new MainVoting.VoteRecord[](2);
        user2Records[0] = records[2];
        user2Records[1] = records[3];
        bytes memory user2Sig = _signUserBatch(user2PrivateKey, user2, 0, user2Records);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](2);
        uint256[] memory indices1 = new uint256[](2);
        indices1[0] = 0; indices1[1] = 1;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices1,
            signature: user1Sig
        });

        uint256[] memory indices2 = new uint256[](2);
        indices2[0] = 2; indices2[1] = 3;
        userBatchSigs[1] = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            recordIndices: indices2,
            signature: user2Sig
        });
        
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);

        // 집계 조회
        (uint256 remember, uint256 forget, uint256 total) = voting.getCandidateAggregates(1, 1);
        assertEq(remember, 350); // 100 + 200 + 50
        assertEq(forget, 30);
        assertEq(total, 380);
    }

    // ========================================
    // 9. 해시 미리보기 함수 테스트
    // ========================================

    function test_HashVoteRecord() public view {
        MainVoting.VoteRecord memory record = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        bytes32 hash = voting.hashVoteRecord(record);
        assertTrue(hash != bytes32(0));
    }

    function test_HashUserBatchPreview() public view {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](2);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        records[1] = _createVoteRecord(user1, "user1", 1, 1, 2, 0, 50);
        
        bytes32 hash = voting.hashUserBatchPreview(user1, 0, records);
        assertTrue(hash != bytes32(0));
    }

    function test_HashBatchPreview() public view {
        bytes32 hash = voting.hashBatchPreview(0);
        assertTrue(hash != bytes32(0));
    }

    // ========================================
    // 10. 가스 최적화 테스트
    // ========================================

    function test_GasUsage_SingleUserBatch() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, records);
        
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: user1Sig
        });
        
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        
        uint256 gasBefore = gasleft();
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas used for single vote", gasUsed);
    }

    function test_GasUsage_MultiUserBatch() public {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](6);
        
        records[0] = _createVoteRecord(user1, "user1", 1, 1, 1, 1, 100);
        records[1] = _createVoteRecord(user1, "user1", 1, 1, 2, 0, 50);
        records[2] = _createVoteRecord(user2, "user2", 1, 1, 1, 1, 200);
        records[3] = _createVoteRecord(user2, "user2", 1, 1, 3, 1, 75);
        records[4] = _createVoteRecord(user3, "user3", 1, 1, 2, 1, 150);
        records[5] = _createVoteRecord(user3, "user3", 1, 1, 3, 0, 25);

        MainVoting.VoteRecord[] memory user1Records = new MainVoting.VoteRecord[](2);
        user1Records[0] = records[0];
        user1Records[1] = records[1];
        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, user1Records);

        MainVoting.VoteRecord[] memory user2Records = new MainVoting.VoteRecord[](2);
        user2Records[0] = records[2];
        user2Records[1] = records[3];
        bytes memory user2Sig = _signUserBatch(user2PrivateKey, user2, 0, user2Records);

        MainVoting.VoteRecord[] memory user3Records = new MainVoting.VoteRecord[](2);
        user3Records[0] = records[4];
        user3Records[1] = records[5];
        bytes memory user3Sig = _signUserBatch(user3PrivateKey, user3, 0, user3Records);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](3);
        
        uint256[] memory indices1 = new uint256[](2);
        indices1[0] = 0; indices1[1] = 1;
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices1,
            signature: user1Sig
        });

        uint256[] memory indices2 = new uint256[](2);
        indices2[0] = 2; indices2[1] = 3;
        userBatchSigs[1] = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            recordIndices: indices2,
            signature: user2Sig
        });

        uint256[] memory indices3 = new uint256[](2);
        indices3[0] = 4; indices3[1] = 5;
        userBatchSigs[2] = MainVoting.UserBatchSig({
            user: user3,
            userNonce: 0,
            recordIndices: indices3,
            signature: user3Sig
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, 0);
        
        uint256 gasBefore = gasleft();
        voting.submitMultiUserBatch(records, userBatchSigs, 0, executorSig);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas used for 6 votes (3 users)", gasUsed);
        emit log_named_uint("Average gas per vote", gasUsed / 6);
    }
}
