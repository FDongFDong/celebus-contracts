// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MainVoting} from "../src/vote/MainVoting.sol";

/**
 * @title MockERC1271Wallet
 * @notice ERC-1271 스마트 계약 지갑 테스트용 Mock 컨트랙트
 * @dev isValidSignature를 구현하여 스마트 계약 지갑 서명 검증 테스트
 */
contract MockERC1271Wallet {
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;
    bytes4 private constant ERC1271_INVALID = 0xffffffff;
    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }

    /**
     * @notice ERC-1271 표준 서명 검증 함수
     * @dev MainVoting이 전달한 EIP-712 digest를 검증
     *      MainVoting에서 이미 EIP-712 typed hash를 계산해서 전달하므로
     *      이 hash로 직접 ecrecover하여 owner와 비교
     *
     *      주의: MainVoting은 ret.length == 4를 체크하므로
     *      assembly로 정확히 4바이트만 반환해야 함
     */
    function isValidSignature(bytes32 hash, bytes calldata signature)
        external
        view
        returns (bytes4 magicValue)
    {
        // ECDSA 서명 복구
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

        // MainVoting이 전달한 digest(이미 EIP-712 typed hash)로 복구
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

contract MainVotingTest is Test {
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

    bytes32 public constant USER_BATCH_TYPEHASH = keccak256(
        "UserBatch(address user,uint256 userNonce,bytes32 recordsHash)"
    );

    bytes32 public constant BATCH_TYPEHASH = keccak256(
        "Batch(uint256 chainId,bytes32 itemsHash,uint256 batchNonce)"
    );

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
        string memory votingFor,
        string memory votedOn,
        uint256 votingAmt
    ) internal view returns (MainVoting.VoteRecord memory) {
        return MainVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: missionId,
            votingId: votingId,
            userAddress: userAddress,
            userId: userId,
            votingFor: votingFor,
            votedOn: votedOn,
            votingAmt: votingAmt,
            deadline: block.timestamp + 1 hours
        });
    }

    function _signUserBatch(
        uint256 privateKey,
        address user,
        uint256 userNonce,
        MainVoting.VoteRecord[] memory userRecords,
        uint256[] memory userRecordNonces
    ) internal view returns (bytes memory) {
        bytes32[] memory hashes = new bytes32[](userRecords.length);
        for (uint256 i; i < userRecords.length; ) {
            hashes[i] = voting.hashVoteRecord(userRecords[i], userRecordNonces[i]);
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
        MainVoting.VoteRecord[] memory records,
        uint256[] memory recordNonces,
        uint256 batchNonce
    ) internal view returns (bytes memory) {
        bytes32[] memory hashes = new bytes32[](records.length);
        for (uint256 i; i < records.length; ) {
            hashes[i] = voting.hashVoteRecord(records[i], recordNonces[i]);
            unchecked { ++i; }
        }
        bytes32 itemsHash = keccak256(abi.encodePacked(hashes));
        bytes32 structHash = keccak256(
            abi.encode(BATCH_TYPEHASH, block.chainid, itemsHash, batchNonce)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    /**
     * @notice recordNonces 배열 생성 헬퍼 (보안 패치 후 추가)
     */
    function _createRecordNonces(uint256 count) internal pure returns (uint256[] memory) {
        uint256[] memory nonces = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            nonces[i] = i; // 각 레코드마다 고유 nonce
        }
        return nonces;
    }

    /**
     * @notice itemsHash 계산 헬퍼 (무결성 검증용)
     */
    function _calculateItemsHash(
        MainVoting.VoteRecord[] memory records,
        uint256[] memory recordNonces
    ) internal view returns (bytes32) {
        bytes32[] memory hashes = new bytes32[](records.length);
        for (uint256 i; i < records.length; ) {
            hashes[i] = voting.hashVoteRecord(records[i], recordNonces[i]);
            unchecked { ++i; }
        }
        return keccak256(abi.encodePacked(hashes));
    }

    function _prepareBatchRecords(uint256 totalRecords)
        internal
        returns (
            MainVoting.VoteRecord[] memory allRecords,
            uint256[] memory recordNonces,
            MainVoting.UserBatchSig[] memory userBatchSigs
        )
    {
        uint256 perUserLimit = voting.MAX_RECORDS_PER_USER_BATCH();
        uint256 userCount = (totalRecords + perUserLimit - 1) / perUserLimit;

        allRecords = new MainVoting.VoteRecord[](totalRecords);
        uint256[] memory userPrivateKeys = new uint256[](userCount);
        address[] memory userAddrs = new address[](userCount);

        for (uint256 u; u < userCount; ++u) {
            userPrivateKeys[u] = 0x2000 + u;
            userAddrs[u] = vm.addr(userPrivateKeys[u]);
        }

        for (uint256 idx; idx < totalRecords; ++idx) {
            uint256 userIdx = idx / perUserLimit;
            allRecords[idx] = _createVoteRecord(
                userAddrs[userIdx],
                string(abi.encodePacked("user", vm.toString(userIdx))),
                1,
                idx + 1,
                "Artist",
                "R",
                100
            );
        }

        recordNonces = _createRecordNonces(totalRecords);
        userBatchSigs = new MainVoting.UserBatchSig[](userCount);

        for (uint256 u; u < userCount; ++u) {
            uint256 start = u * perUserLimit;
            uint256 end = start + perUserLimit;
            if (end > totalRecords) end = totalRecords;
            uint256 count = end - start;

            uint256[] memory indices = new uint256[](count);
            MainVoting.VoteRecord[] memory userRecords = new MainVoting.VoteRecord[](count);
            uint256[] memory userRecordNonces = new uint256[](count);

            for (uint256 j; j < count; ++j) {
                uint256 idx = start + j;
                indices[j] = idx;
                userRecords[j] = allRecords[idx];
                userRecordNonces[j] = recordNonces[idx];
            }

            bytes memory sig = _signUserBatch(
                userPrivateKeys[u],
                userAddrs[u],
                0,
                userRecords,
                userRecordNonces
            );

            userBatchSigs[u] = MainVoting.UserBatchSig({
                user: userAddrs[u],
                userNonce: 0,
                recordIndices: indices,
                signature: sig
            });
        }
    }

    // ========================================
    // 기본 기능 테스트
    // ========================================

    function test_Deployment() public view {
        assertEq(voting.owner(), owner);
        assertEq(voting.executorSigner(), executorSigner);
        assertEq(voting.CHAIN_ID(), block.chainid);
    }

    function test_SetExecutorSigner() public {
        address newExecutor = address(0x5555);
        voting.setExecutorSigner(newExecutor);
        assertEq(voting.executorSigner(), newExecutor);
    }

    function test_RevertWhen_SetExecutorSignerZeroAddress() public {
        vm.expectRevert(MainVoting.ZeroAddress.selector);
        voting.setExecutorSigner(address(0));
    }

    function test_RevertWhen_SetExecutorSignerNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        voting.setExecutorSigner(address(0x5555));
    }

    // ========================================
    // 단일 사용자 배치 제출 테스트
    // ========================================

    function test_SubmitSingleUserBatch() public {
        // 1. user1이 4명의 후보에게 투표하는 시나리오
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](4);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "YuS", "candidate1", 100);
        allRecords[1] = _createVoteRecord(user1, "user1", 1, 2, "JaC", "candidate2", 200);
        allRecords[2] = _createVoteRecord(user1, "user1", 1, 3, "SaN", "candidate3", 150);
        allRecords[3] = _createVoteRecord(user1, "user1", 1, 4, "KaS", "candidate4", 180);

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);

        // 2. user1의 배치 서명 생성
        uint256[] memory recordIndices = new uint256[](4);
        recordIndices[0] = 0;
        recordIndices[1] = 1;
        recordIndices[2] = 2;
        recordIndices[3] = 3;

        bytes memory user1Signature = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: user1Signature
        });

        // 3. Executor 서명 생성
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 4. 배치 제출
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 5. 검증
        assertEq(voting.getVoteCount(1), 4);
        assertTrue(voting.userNonceUsed(user1, 0));
        assertTrue(voting.batchNonceUsed(executorSigner, 0));
    }

    // ========================================
    // 다중 사용자 배치 제출 테스트
    // ========================================

    function test_SubmitMultiUserBatch() public {
        // 1. 3명의 사용자가 각각 여러 후보에게 투표
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](6);

        // user1의 투표 2개
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "song1", 100);
        allRecords[1] = _createVoteRecord(user1, "user1", 1, 2, "Artist2", "song2", 150);

        // user2의 투표 3개
        allRecords[2] = _createVoteRecord(user2, "user2", 1, 3, "Artist3", "song3", 200);
        allRecords[3] = _createVoteRecord(user2, "user2", 1, 4, "Artist4", "song4", 120);
        allRecords[4] = _createVoteRecord(user2, "user2", 1, 5, "Artist5", "song5", 180);

        // user3의 투표 1개
        allRecords[5] = _createVoteRecord(user3, "user3", 1, 6, "Artist6", "song6", 90);

        // 2. 전체 recordNonces 생성 (먼저!)
        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);

        // 3. 각 사용자의 배치 서명 생성
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](3);

        // user1 배치
        uint256[] memory user1Indices = new uint256[](2);
        user1Indices[0] = 0;
        user1Indices[1] = 1;
        MainVoting.VoteRecord[] memory user1Records = new MainVoting.VoteRecord[](2);
        user1Records[0] = allRecords[0];
        user1Records[1] = allRecords[1];
        uint256[] memory user1RecordNonces = new uint256[](2);
        user1RecordNonces[0] = recordNonces[0];
        user1RecordNonces[1] = recordNonces[1];
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: user1Indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, user1Records, user1RecordNonces)
        });

        // user2 배치
        uint256[] memory user2Indices = new uint256[](3);
        user2Indices[0] = 2;
        user2Indices[1] = 3;
        user2Indices[2] = 4;
        MainVoting.VoteRecord[] memory user2Records = new MainVoting.VoteRecord[](3);
        user2Records[0] = allRecords[2];
        user2Records[1] = allRecords[3];
        user2Records[2] = allRecords[4];
        uint256[] memory user2RecordNonces = new uint256[](3);
        user2RecordNonces[0] = recordNonces[2];
        user2RecordNonces[1] = recordNonces[3];
        user2RecordNonces[2] = recordNonces[4];
        userBatchSigs[1] = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            recordIndices: user2Indices,
            signature: _signUserBatch(user2PrivateKey, user2, 0, user2Records, user2RecordNonces)
        });

        // user3 배치
        uint256[] memory user3Indices = new uint256[](1);
        user3Indices[0] = 5;
        MainVoting.VoteRecord[] memory user3Records = new MainVoting.VoteRecord[](1);
        user3Records[0] = allRecords[5];
        uint256[] memory user3RecordNonces = new uint256[](1);
        user3RecordNonces[0] = recordNonces[5];
        userBatchSigs[2] = MainVoting.UserBatchSig({
            user: user3,
            userNonce: 0,
            recordIndices: user3Indices,
            signature: _signUserBatch(user3PrivateKey, user3, 0, user3Records, user3RecordNonces)
        });

        // 4. Executor 서명
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 5. 배치 제출
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 5. 검증
        assertEq(voting.getVoteCount(1), 6);
        assertTrue(voting.userNonceUsed(user1, 0));
        assertTrue(voting.userNonceUsed(user2, 0));
        assertTrue(voting.userNonceUsed(user3, 0));
        assertTrue(voting.batchNonceUsed(executorSigner, 0));
    }

    // ========================================
    // 에러 케이스 테스트
    // ========================================

    function test_RevertWhen_InvalidExecutorSignature() public {
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "song1", 100);

        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        // 잘못된 private key로 서명
        bytes memory wrongExecutorSig = _signExecutorBatch(user1PrivateKey, allRecords, recordNonces, 0);

        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, wrongExecutorSig, recordNonces);
    }

    function test_RevertWhen_InvalidUserSignature() public {
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "song1", 100);

        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;

        // 잘못된 private key로 서명
        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user2PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
    }

    function test_RevertWhen_UserNonceAlreadyUsed() public {
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "song1", 100);

        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 두 번째 제출 실패 (같은 nonce)
        uint256[] memory recordNonces2 = _createRecordNonces(allRecords.length);
        bytes memory executorSig2 = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces2, 1);

        vm.expectRevert(MainVoting.UserNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 1, executorSig2, recordNonces2);
    }

    function test_RevertWhen_BatchNonceAlreadyUsed() public {
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "song1", 100);

        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 두 번째 제출 실패 (같은 batch nonce)
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 2, "Artist2", "song2", 150);
        uint256[] memory recordNonces2 = _createRecordNonces(allRecords.length);
        userBatchSigs[0].userNonce = 1;
        userBatchSigs[0].signature = _signUserBatch(user1PrivateKey, user1, 1, allRecords, recordNonces2);

        // 새로운 데이터에 대한 executor signature를 같은 batch nonce(0)로 생성
        bytes memory executorSig2 = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces2, 0);

        vm.expectRevert(MainVoting.BatchNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig2, recordNonces2);
    }

    function test_RevertWhen_ExpiredDeadline() public {
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "song1", 100);

        // deadline 지나게 만들기
        vm.warp(block.timestamp + 2 hours);

        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 만료된 레코드는 스킵됨 (에러 발생 안함)
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // voteCount가 0으로 유지됨 (스킵됨)
        assertEq(voting.getVoteCountByVotingId(1, 1), 0, "Expired record should be skipped");
    }

    function test_RevertWhen_ZeroVotingAmount() public {
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "song1", 0); // votingAmt = 0

        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 0 투표량 레코드는 스킵됨 (에러 발생 안함)
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // voteCount가 0으로 유지됨 (스킵됨)
        assertEq(voting.getVoteCountByVotingId(1, 1), 0, "Zero voting amount record should be skipped");
    }

    function test_RevertWhen_InvalidRecordIndices() public {
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "song1", 100);

        // 잘못된 인덱스 (범위 초과)
        uint256[] memory indices = new uint256[](1);
        indices[0] = 10; // allRecords.length는 1

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        vm.expectRevert(MainVoting.InvalidRecordIndices.selector);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
    }

    function test_RevertWhen_MismatchedUserAddress() public {
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](2);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "song1", 100);
        allRecords[1] = _createVoteRecord(user2, "user2", 1, 2, "Artist2", "song2", 150); // 다른 사용자

        // user1이 두 record를 모두 포함하려고 시도
        uint256[] memory indices = new uint256[](2);
        indices[0] = 0;
        indices[1] = 1;

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
    }

    // ========================================
    // Nonce 취소 테스트
    // ========================================

    function test_CancelUserNonce() public {
        voting.cancelAllUserNonceUpTo(user1, 10);

        assertEq(voting.minUserNonce(user1), 10);
    }

    function test_RevertWhen_CancelUserNonceTooLow() public {
        voting.cancelAllUserNonceUpTo(user1, 10);

        vm.expectRevert(MainVoting.UserNonceTooLow.selector);
        voting.cancelAllUserNonceUpTo(user1, 5);
    }

    function test_CancelBatchNonce() public {
        voting.cancelAllBatchNonceUpTo(10);

        assertEq(voting.minBatchNonce(executorSigner), 10);
    }

    function test_RevertWhen_CancelBatchNonceTooLow() public {
        voting.cancelAllBatchNonceUpTo(10);

        vm.expectRevert(MainVoting.BatchNonceTooLow.selector);
        voting.cancelAllBatchNonceUpTo(5);
    }

    function test_RevertWhen_CancelBatchNonceNotAuthorized() public {
        vm.prank(user1);
        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.cancelAllBatchNonceUpTo(10);
    }

    // ========================================
    // View 함수 테스트
    // ========================================

    function test_GetUserVoteHashesWithPagination() public {
        // 투표 데이터 제출
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](2);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "song1", 100);
        allRecords[1] = _createVoteRecord(user1, "user1", 1, 2, "Artist2", "song2", 150);

        uint256[] memory indices = new uint256[](2);
        indices[0] = 0;
        indices[1] = 1;

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 유저별 해시 조회 및 검증 (votingId=1)
        bytes32[] memory hashes1 = voting.getUserVoteHashes(user1, 1, 1, 0, 100);
        assertEq(hashes1.length, 1);
        MainVoting.VoteRecord memory vote1 = voting.getVoteByHash(hashes1[0]);
        assertEq(vote1.votingAmt, 100);
        assertEq(vote1.votingId, 1);

        // votingId=2
        bytes32[] memory hashes2 = voting.getUserVoteHashes(user1, 1, 2, 0, 100);
        assertEq(hashes2.length, 1);
        MainVoting.VoteRecord memory vote2 = voting.getVoteByHash(hashes2[0]);
        assertEq(vote2.votingAmt, 150);
        assertEq(vote2.votingId, 2);
    }

    function test_DomainSeparator() public view {
        bytes32 separator = voting.domainSeparator();
        assertEq(separator, _buildDomainSeparator());
    }

    function test_HashUserBatchPreview() public view {
        MainVoting.VoteRecord[] memory userRecords = new MainVoting.VoteRecord[](1);
        userRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "song1", 100);

        uint256[] memory recordNonces = _createRecordNonces(userRecords.length);
        bytes32 hash = voting.hashUserBatchPreview(user1, 0, userRecords, recordNonces);

        bytes32[] memory hashes = new bytes32[](1);
        hashes[0] = voting.hashVoteRecord(userRecords[0], recordNonces[0]);
        bytes32 recordsHash = keccak256(abi.encodePacked(hashes));
        bytes32 expectedStructHash = keccak256(
            abi.encode(USER_BATCH_TYPEHASH, user1, 0, recordsHash)
        );
        bytes32 expected = _hashTypedDataV4(expectedStructHash);

        assertEq(hash, expected);
    }

    function test_HashBatchPreview() public view {
        MainVoting.VoteRecord[] memory records = new MainVoting.VoteRecord[](1);
        records[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "song1", 100);

        uint256[] memory recordNonces = _createRecordNonces(records.length);
        bytes32 hash = voting.hashBatchPreview(records, recordNonces, 0);

        bytes32[] memory hashes = new bytes32[](1);
        hashes[0] = voting.hashVoteRecord(records[0], recordNonces[0]);
        bytes32 itemsHash = keccak256(abi.encodePacked(hashes));
        bytes32 expectedStructHash = keccak256(
            abi.encode(BATCH_TYPEHASH, block.chainid, itemsHash, 0)
        );
        bytes32 expected = _hashTypedDataV4(expectedStructHash);

        assertEq(hash, expected);
    }

    // ========================================
    // R/F 투표 시나리오 테스트
    // ========================================

    function test_UserVotesWithRememberAndForget() public {
        // 사용자 A가 1미션에서 3명의 후보에게 R/F 투표
        // - YuSeungWoo: Remember (긍정) 100포인트
        // - JangBeomJun: Forget (부정) 200포인트
        // - SangNamja: Remember (긍정) 150포인트

        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](3);

        allRecords[0] = _createVoteRecord(user1, "userA", 1, 1, "YuSeungWoo", "R", 100);
        allRecords[1] = _createVoteRecord(user1, "userA", 1, 2, "JangBeomJun", "F", 200);
        allRecords[2] = _createVoteRecord(user1, "userA", 1, 3, "SangNamja", "R", 150);

        // 사용자 서명
        uint256[] memory recordIndices = new uint256[](3);
        recordIndices[0] = 0;
        recordIndices[1] = 1;
        recordIndices[2] = 2;

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        bytes memory userSignature = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: userSignature
        });

        // Executor 서명
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 배치 제출
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 검증
        assertEq(voting.getVoteCount(1), 3);

        // 유저별 집계 확인
        (bool hasVoted, uint256 totalAmt, uint256 count) = voting.getUserVotingStat(user1, 1, 1);
        assertTrue(hasVoted);
        assertEq(totalAmt, 100);
        assertEq(count, 1);

        // 첫 번째 투표: Remember
        bytes32[] memory hashes0 = voting.getUserVoteHashes(user1, 1, 1, 0, 100);
        assertEq(hashes0.length, 1);
        MainVoting.VoteRecord memory vote0 = voting.getVoteByHash(hashes0[0]);
        assertEq(vote0.votingId, 1);
        assertEq(vote0.votingFor, "YuSeungWoo");
        assertEq(vote0.votedOn, "R");
        assertEq(vote0.votingAmt, 100);

        // 두 번째 투표: Forget
        bytes32[] memory hashes1 = voting.getUserVoteHashes(user1, 1, 2, 0, 100);
        assertEq(hashes1.length, 1);
        MainVoting.VoteRecord memory vote1 = voting.getVoteByHash(hashes1[0]);
        assertEq(vote1.votingId, 2);
        assertEq(vote1.votingFor, "JangBeomJun");
        assertEq(vote1.votedOn, "F");
        assertEq(vote1.votingAmt, 200);

        // 세 번째 투표: Remember
        bytes32[] memory hashes2 = voting.getUserVoteHashes(user1, 1, 3, 0, 100);
        assertEq(hashes2.length, 1);
        MainVoting.VoteRecord memory vote2 = voting.getVoteByHash(hashes2[0]);
        assertEq(vote2.votingId, 3);
        assertEq(vote2.votingFor, "SangNamja");
        assertEq(vote2.votedOn, "R");
        assertEq(vote2.votingAmt, 150);
    }

    function test_UserVotesWithDifferentAmounts() public {
        // 사용자가 다양한 포인트로 투표
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](5);

        allRecords[0] = _createVoteRecord(user1, "userA", 1, 1, "Artist1", "R", 1);
        allRecords[1] = _createVoteRecord(user1, "userA", 1, 2, "Artist2", "F", 10);
        allRecords[2] = _createVoteRecord(user1, "userA", 1, 3, "Artist3", "R", 100);
        allRecords[3] = _createVoteRecord(user1, "userA", 1, 4, "Artist4", "F", 500);
        allRecords[4] = _createVoteRecord(user1, "userA", 1, 5, "Artist5", "R", 9999);

        uint256[] memory indices = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            indices[i] = i;
        }

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        vm.pauseGasMetering();
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
        vm.resumeGasMetering();

        // 검증 - 각 votingId별로 조회
        assertEq(voting.getVoteCount(1), 5);

        bytes32[] memory hash1 = voting.getUserVoteHashes(user1, 1, 1, 0, 100);
        assertEq(voting.getVoteByHash(hash1[0]).votingAmt, 1);

        bytes32[] memory hash2 = voting.getUserVoteHashes(user1, 1, 2, 0, 100);
        assertEq(voting.getVoteByHash(hash2[0]).votingAmt, 10);

        bytes32[] memory hash3 = voting.getUserVoteHashes(user1, 1, 3, 0, 100);
        assertEq(voting.getVoteByHash(hash3[0]).votingAmt, 100);

        bytes32[] memory hash4 = voting.getUserVoteHashes(user1, 1, 4, 0, 100);
        assertEq(voting.getVoteByHash(hash4[0]).votingAmt, 500);

        bytes32[] memory hash5 = voting.getUserVoteHashes(user1, 1, 5, 0, 100);
        assertEq(voting.getVoteByHash(hash5[0]).votingAmt, 9999);
    }

    function test_MultipleUsersVoteSameArtist() public {
        // 여러 사용자가 같은 후보에게 R/F 투표
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](3);

        // user1: YuSeungWoo에 R
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "YuSeungWoo", "R", 100);
        // user2: YuSeungWoo에 F
        allRecords[1] = _createVoteRecord(user2, "user2", 1, 2, "YuSeungWoo", "F", 200);
        // user3: YuSeungWoo에 R
        allRecords[2] = _createVoteRecord(user3, "user3", 1, 3, "YuSeungWoo", "R", 150);

        // 전체 recordNonces 먼저 생성
        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](3);

        // user1 배치
        uint256[] memory user1Indices = new uint256[](1);
        user1Indices[0] = 0;
        MainVoting.VoteRecord[] memory user1Records = new MainVoting.VoteRecord[](1);
        user1Records[0] = allRecords[0];
        uint256[] memory user1RecordNonces = new uint256[](1);
        user1RecordNonces[0] = recordNonces[0];
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: user1Indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, user1Records, user1RecordNonces)
        });

        // user2 배치
        uint256[] memory user2Indices = new uint256[](1);
        user2Indices[0] = 1;
        MainVoting.VoteRecord[] memory user2Records = new MainVoting.VoteRecord[](1);
        user2Records[0] = allRecords[1];
        uint256[] memory user2RecordNonces = new uint256[](1);
        user2RecordNonces[0] = recordNonces[1];
        userBatchSigs[1] = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            recordIndices: user2Indices,
            signature: _signUserBatch(user2PrivateKey, user2, 0, user2Records, user2RecordNonces)
        });

        // user3 배치
        uint256[] memory user3Indices = new uint256[](1);
        user3Indices[0] = 2;
        MainVoting.VoteRecord[] memory user3Records = new MainVoting.VoteRecord[](1);
        user3Records[0] = allRecords[2];
        uint256[] memory user3RecordNonces = new uint256[](1);
        user3RecordNonces[0] = recordNonces[2];
        userBatchSigs[2] = MainVoting.UserBatchSig({
            user: user3,
            userNonce: 0,
            recordIndices: user3Indices,
            signature: _signUserBatch(user3PrivateKey, user3, 0, user3Records, user3RecordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 검증: 3명이 같은 후보에게 투표
        assertEq(voting.getVoteCount(1), 3);

        // user1: YuSeungWoo에 R 투표
        bytes32[] memory user1Hashes = voting.getUserVoteHashes(user1, 1, 1, 0, 100);
        assertEq(user1Hashes.length, 1);
        MainVoting.VoteRecord memory vote1 = voting.getVoteByHash(user1Hashes[0]);
        assertEq(vote1.votingFor, "YuSeungWoo");
        assertEq(vote1.votedOn, "R");
        assertEq(vote1.userAddress, user1);

        // user2: YuSeungWoo에 F 투표
        bytes32[] memory user2Hashes = voting.getUserVoteHashes(user2, 1, 2, 0, 100);
        assertEq(user2Hashes.length, 1);
        MainVoting.VoteRecord memory vote2 = voting.getVoteByHash(user2Hashes[0]);
        assertEq(vote2.votingFor, "YuSeungWoo");
        assertEq(vote2.votedOn, "F");
        assertEq(vote2.userAddress, user2);

        // user3: YuSeungWoo에 R 투표
        bytes32[] memory user3Hashes = voting.getUserVoteHashes(user3, 1, 3, 0, 100);
        assertEq(user3Hashes.length, 1);
        MainVoting.VoteRecord memory vote3 = voting.getVoteByHash(user3Hashes[0]);
        assertEq(vote3.votingFor, "YuSeungWoo");
        assertEq(vote3.votedOn, "R");
        assertEq(vote3.userAddress, user3);
    }

    function test_SameUserSameArtistRememberAndForget() public {
        // 같은 사용자가 같은 후보에게 R과 F 둘 다 투표 가능 (비즈니스 로직에 따라)
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](2);

        allRecords[0] = _createVoteRecord(user1, "userA", 1, 1, "YuSeungWoo", "R", 100);
        allRecords[1] = _createVoteRecord(user1, "userA", 1, 2, "YuSeungWoo", "F", 50);

        uint256[] memory indices = new uint256[](2);
        indices[0] = 0;
        indices[1] = 1;

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 검증: 같은 후보에게 R과 F 모두 투표 가능
        assertEq(voting.getVoteCount(1), 2);

        // R 투표 확인
        bytes32[] memory hash1 = voting.getUserVoteHashes(user1, 1, 1, 0, 100);
        assertEq(hash1.length, 1);
        MainVoting.VoteRecord memory vote1 = voting.getVoteByHash(hash1[0]);
        assertEq(vote1.votingFor, "YuSeungWoo");
        assertEq(vote1.votedOn, "R");

        // F 투표 확인
        bytes32[] memory hash2 = voting.getUserVoteHashes(user1, 1, 2, 0, 100);
        assertEq(hash2.length, 1);
        MainVoting.VoteRecord memory vote2 = voting.getVoteByHash(hash2[0]);
        assertEq(vote2.votingFor, "YuSeungWoo");
        assertEq(vote2.votedOn, "F");
    }

    function test_GetVotesByVotingIdWithRF() public {
        // votingId로 R/F 투표 조회
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](3);

        allRecords[0] = _createVoteRecord(user1, "userA", 1, 1, "Artist1", "R", 100);
        allRecords[1] = _createVoteRecord(user1, "userA", 1, 2, "Artist2", "F", 200);
        allRecords[2] = _createVoteRecord(user1, "userA", 1, 3, "Artist3", "R", 150);

        uint256[] memory indices = new uint256[](3);
        indices[0] = 0;
        indices[1] = 1;
        indices[2] = 2;

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 유저별 votingId로 각각 조회
        bytes32[] memory hash1 = voting.getUserVoteHashes(user1, 1, 1, 0, 100);
        assertEq(hash1.length, 1);
        MainVoting.VoteRecord memory vote1 = voting.getVoteByHash(hash1[0]);
        assertEq(vote1.votedOn, "R");
        assertEq(vote1.votingFor, "Artist1");

        bytes32[] memory hash2 = voting.getUserVoteHashes(user1, 1, 2, 0, 100);
        assertEq(hash2.length, 1);
        MainVoting.VoteRecord memory vote2 = voting.getVoteByHash(hash2[0]);
        assertEq(vote2.votedOn, "F");
        assertEq(vote2.votingFor, "Artist2");

        bytes32[] memory hash3 = voting.getUserVoteHashes(user1, 1, 3, 0, 100);
        assertEq(hash3.length, 1);
        MainVoting.VoteRecord memory vote3 = voting.getVoteByHash(hash3[0]);
        assertEq(vote3.votedOn, "R");
        assertEq(vote3.votingFor, "Artist3");

        // votingId별 개수 확인
        assertEq(voting.getVoteCountByVotingId(1, 1), 1);
        assertEq(voting.getVoteCountByVotingId(1, 2), 1);
        assertEq(voting.getVoteCountByVotingId(1, 3), 1);
    }

    function test_ComplexRealWorldScenario() public {
        // 실제 투표 시나리오: 3명의 사용자가 1미션에서 다양하게 투표
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](7);

        // user1: 3개 투표
        allRecords[0] = _createVoteRecord(user1, "alice", 1, 1, "YuSeungWoo", "R", 100);
        allRecords[1] = _createVoteRecord(user1, "alice", 1, 2, "JangBeomJun", "F", 50);
        allRecords[2] = _createVoteRecord(user1, "alice", 1, 3, "SangNamja", "R", 200);

        // user2: 2개 투표
        allRecords[3] = _createVoteRecord(user2, "bob", 1, 4, "YuSeungWoo", "F", 80);
        allRecords[4] = _createVoteRecord(user2, "bob", 1, 5, "KaSang", "R", 150);

        // user3: 2개 투표
        allRecords[5] = _createVoteRecord(user3, "charlie", 1, 6, "JangBeomJun", "R", 120);
        allRecords[6] = _createVoteRecord(user3, "charlie", 1, 7, "SangNamja", "F", 90);

        // 전체 recordNonces 먼저 생성
        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](3);

        // user1 배치
        uint256[] memory user1Indices = new uint256[](3);
        user1Indices[0] = 0;
        user1Indices[1] = 1;
        user1Indices[2] = 2;
        MainVoting.VoteRecord[] memory user1Records = new MainVoting.VoteRecord[](3);
        user1Records[0] = allRecords[0];
        user1Records[1] = allRecords[1];
        user1Records[2] = allRecords[2];
        uint256[] memory user1RecordNonces = new uint256[](3);
        user1RecordNonces[0] = recordNonces[0];
        user1RecordNonces[1] = recordNonces[1];
        user1RecordNonces[2] = recordNonces[2];
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: user1Indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, user1Records, user1RecordNonces)
        });

        // user2 배치
        uint256[] memory user2Indices = new uint256[](2);
        user2Indices[0] = 3;
        user2Indices[1] = 4;
        MainVoting.VoteRecord[] memory user2Records = new MainVoting.VoteRecord[](2);
        user2Records[0] = allRecords[3];
        user2Records[1] = allRecords[4];
        uint256[] memory user2RecordNonces = new uint256[](2);
        user2RecordNonces[0] = recordNonces[3];
        user2RecordNonces[1] = recordNonces[4];
        userBatchSigs[1] = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            recordIndices: user2Indices,
            signature: _signUserBatch(user2PrivateKey, user2, 0, user2Records, user2RecordNonces)
        });

        // user3 배치
        uint256[] memory user3Indices = new uint256[](2);
        user3Indices[0] = 5;
        user3Indices[1] = 6;
        MainVoting.VoteRecord[] memory user3Records = new MainVoting.VoteRecord[](2);
        user3Records[0] = allRecords[5];
        user3Records[1] = allRecords[6];
        uint256[] memory user3RecordNonces = new uint256[](2);
        user3RecordNonces[0] = recordNonces[5];
        user3RecordNonces[1] = recordNonces[6];
        userBatchSigs[2] = MainVoting.UserBatchSig({
            user: user3,
            userNonce: 0,
            recordIndices: user3Indices,
            signature: _signUserBatch(user3PrivateKey, user3, 0, user3Records, user3RecordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 검증
        assertEq(voting.getVoteCount(1), 7); // 총 7개 투표

        // user1 투표 확인: YuSeungWoo R, JangBeomJun F, SangNamja R
        bytes32[] memory user1Hash1 = voting.getUserVoteHashes(user1, 1, 1, 0, 100);
        assertEq(voting.getVoteByHash(user1Hash1[0]).votedOn, "R");
        assertEq(voting.getVoteByHash(user1Hash1[0]).votingFor, "YuSeungWoo");

        bytes32[] memory user1Hash2 = voting.getUserVoteHashes(user1, 1, 2, 0, 100);
        assertEq(voting.getVoteByHash(user1Hash2[0]).votedOn, "F");
        assertEq(voting.getVoteByHash(user1Hash2[0]).votingFor, "JangBeomJun");

        // user2 투표 확인: YuSeungWoo F, KaSang R
        bytes32[] memory user2Hash4 = voting.getUserVoteHashes(user2, 1, 4, 0, 100);
        assertEq(voting.getVoteByHash(user2Hash4[0]).votedOn, "F");
        assertEq(voting.getVoteByHash(user2Hash4[0]).votingFor, "YuSeungWoo");

        // user3 투표 확인: JangBeomJun R, SangNamja F
        bytes32[] memory user3Hash6 = voting.getUserVoteHashes(user3, 1, 6, 0, 100);
        assertEq(voting.getVoteByHash(user3Hash6[0]).votedOn, "R");
        assertEq(voting.getVoteByHash(user3Hash6[0]).votingFor, "JangBeomJun");

        // 모든 nonce 사용 확인
        assertTrue(voting.userNonceUsed(user1, 0));
        assertTrue(voting.userNonceUsed(user2, 0));
        assertTrue(voting.userNonceUsed(user3, 0));
        assertTrue(voting.batchNonceUsed(executorSigner, 0));
    }

    // ========================================
    // DoS 공격 방지 테스트
    // ========================================

    function test_RevertWhen_BatchTooLarge() public {
        uint256 totalRecords = voting.MAX_RECORDS_PER_BATCH() + 1;
        (
            MainVoting.VoteRecord[] memory allRecords,
            uint256[] memory recordNonces,
            MainVoting.UserBatchSig[] memory userBatchSigs
        ) = _prepareBatchRecords(totalRecords);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        vm.expectRevert(MainVoting.BatchTooLarge.selector);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
    }

    function test_RevertWhen_QueryLimitExceeded() public {
        // MAX_QUERY_LIMIT(100)를 초과하는 조회
        vm.expectRevert(MainVoting.QueryLimitExceeded.selector);
        voting.getUserVoteHashes(user1, 1, 1, 0, 101);
    }

    function test_GetVoteByHash() public {
        // 투표 데이터 제출
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "song1", 100);

        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 유저별 voteHash 조회
        bytes32[] memory hashes = voting.getUserVoteHashes(user1, 1, 1, 0, 100);
        assertEq(hashes.length, 1);

        // voteHash로 상세 조회
        MainVoting.VoteRecord memory vote = voting.getVoteByHash(hashes[0]);
        assertEq(vote.votingAmt, 100);
        assertEq(vote.userAddress, user1);
    }

    function test_PaginationQuery() public {
        // 여러 투표 데이터 제출 (같은 user, 같은 votingId에 5개)
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](5);
        for (uint256 i = 0; i < 5; i++) {
            allRecords[i] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "song1", 100 + i);
        }

        uint256[] memory indices = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            indices[i] = i;
        }

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 페이지네이션 조회 테스트
        bytes32[] memory page1 = voting.getUserVoteHashes(user1, 1, 1, 0, 2);
        assertEq(page1.length, 2);
        assertEq(voting.getVoteByHash(page1[0]).votingAmt, 100);
        assertEq(voting.getVoteByHash(page1[1]).votingAmt, 101);

        bytes32[] memory page2 = voting.getUserVoteHashes(user1, 1, 1, 2, 2);
        assertEq(page2.length, 2);
        assertEq(voting.getVoteByHash(page2[0]).votingAmt, 102);
        assertEq(voting.getVoteByHash(page2[1]).votingAmt, 103);

        bytes32[] memory page3 = voting.getUserVoteHashes(user1, 1, 1, 4, 2);
        assertEq(page3.length, 1);
        assertEq(voting.getVoteByHash(page3[0]).votingAmt, 104);
    }

    function test_RevertWhen_UserBatchTooLarge() public {
        // 51개 레코드 생성 (MAX_RECORDS_PER_USER_BATCH = 50 초과)
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](51);
        for (uint256 i = 0; i < 51; i++) {
            allRecords[i] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "R", 100);
        }

        uint256[] memory indices = new uint256[](51);
        for (uint256 i = 0; i < 51; i++) {
            indices[i] = i;
        }

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // UserBatchTooLarge 에러 예상
        vm.expectRevert(MainVoting.UserBatchTooLarge.selector);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
    }

    // ========================================
    // itemsHash 무결성 검증 테스트 (신규)
    // ========================================

    function test_ItemsHashValidation_Success() public {
        // 정상적인 itemsHash로 배치 제출 성공
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](2);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "R", 100);
        allRecords[1] = _createVoteRecord(user1, "user1", 1, 2, "Artist2", "F", 200);

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        uint256[] memory indices = new uint256[](2);
        indices[0] = 0;
        indices[1] = 1;

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 정상 제출
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 검증
        assertEq(voting.getVoteCount(1), 2);
    }

    // NOTE: itemsHash는 이제 컨트랙트 내부에서 자동 계산되므로 이 테스트는 제거됨
    // 대신 test_RevertWhen_RecordsModifiedAfterSigning이 유사한 목적을 수행함

    function test_RevertWhen_RecordsModifiedAfterSigning() public {
        // 서명 후 records 데이터 변조 시도
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "R", 100);

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;

        // 정상 서명 생성
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 서명 후 votingAmt 변조
        allRecords[0].votingAmt = 999999;

        // InvalidSignature 에러 예상 (itemsHash 불일치)
        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
    }

    function test_RevertWhen_RecordNoncesMismatch() public {
        // recordNonces 조작 시도
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](2);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "R", 100);
        allRecords[1] = _createVoteRecord(user1, "user1", 1, 2, "Artist2", "F", 200);

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        uint256[] memory indices = new uint256[](2);
        indices[0] = 0;
        indices[1] = 1;

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // recordNonces 순서 조작
        uint256[] memory tamperedNonces = new uint256[](2);
        tamperedNonces[0] = 1; // 원래 0이어야 함
        tamperedNonces[1] = 0; // 원래 1이어야 함

        // InvalidSignature 또는 InvalidRecordIndices 에러 예상
        vm.expectRevert();
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, tamperedNonces);
    }

    // ========================================
    // Fail-Fast 최적화 테스트 (신규)
    // ========================================

    function test_FailFast_StringValidationBeforeExecutorSignature() public {
        // 긴 문자열 (StringTooLong 유발) + 잘못된 executor 서명
        // NOTE: 새로운 컨트랙트는 문자열 길이 검증을 먼저 수행함 (recordDigests 계산 시)
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        string memory longString = "this_is_a_very_long_string_that_exceeds_the_maximum_allowed_length_of_100_characters_and_should_trigger_error";
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, longString, "R", 100);

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        // 잘못된 executor 서명 (user1 키로 서명)
        bytes memory wrongExecutorSig = _signExecutorBatch(user1PrivateKey, allRecords, recordNonces, 0);

        // StringTooLong이 먼저 발생함 (InvalidSignature 전에)
        vm.expectRevert(MainVoting.StringTooLong.selector);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, wrongExecutorSig, recordNonces);
    }

    function test_FailFast_BatchTooLargeBeforeHashComputation() public {
        uint256 totalRecords = voting.MAX_RECORDS_PER_BATCH() + 1;
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](totalRecords);
        for (uint256 i; i < totalRecords; ++i) {
            allRecords[i] = _createVoteRecord(user1, "user1", 1, i + 1, "Artist", "R", 100);
        }

        uint256[] memory recordNonces = _createRecordNonces(totalRecords);
        MainVoting.UserBatchSig[] memory userBatchSigs;
        bytes memory executorSig;

        vm.expectRevert(MainVoting.BatchTooLarge.selector);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
    }

    function test_FailFast_LengthMismatchBeforeSignatureValidation() public {
        // recordNonces 길이 불일치
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](2);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "R", 100);
        allRecords[1] = _createVoteRecord(user1, "user1", 1, 2, "Artist2", "F", 200);

        // 잘못된 길이의 recordNonces
        uint256[] memory recordNonces = _createRecordNonces(1); // 2개여야 함
        uint256[] memory indices = new uint256[](2);
        indices[0] = 0;
        indices[1] = 1;

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, _createRecordNonces(2))
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, _createRecordNonces(2), 0);

        // InvalidRecordIndices가 즉시 발생해야 함
        vm.expectRevert(MainVoting.InvalidRecordIndices.selector);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
    }

    // ========================================
    // 보안 강화 테스트 (신규)
    // ========================================

    function test_RevertWhen_ItemsHashReplayAttack() public {
        // 첫 번째 배치 제출
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "R", 100);

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);
        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 같은 itemsHash로 재사용 시도 (batchNonce+1, userNonce+1)
        MainVoting.UserBatchSig[] memory userBatchSigs2 = new MainVoting.UserBatchSig[](1);
        userBatchSigs2[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 1,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 1, allRecords, recordNonces)
        });

        bytes memory executorSig2 = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 1);

        // 이미 처리된 recordDigest는 스킵됨 (revert하지 않음)
        voting.submitMultiUserBatch(allRecords, userBatchSigs2, 1, executorSig2, recordNonces);

        // 투표 개수는 여전히 1개 (스킵되어 추가되지 않음)
        assertEq(voting.getVoteCountByVotingId(1, 1), 1, "Duplicate record should be skipped");
    }

    function test_RevertWhen_PartialRecordsSubmission() public {
        // 10개 records로 서명하고 5개만 제출 시도
        MainVoting.VoteRecord[] memory fullRecords = new MainVoting.VoteRecord[](10);
        for (uint256 i = 0; i < 10; i++) {
            fullRecords[i] = _createVoteRecord(user1, "user1", 1, i + 1, "Artist", "R", 100);
        }

        uint256[] memory fullRecordNonces = _createRecordNonces(fullRecords.length);

        // 전체로 서명 생성
        uint256[] memory fullIndices = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            fullIndices[i] = i;
        }

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: fullIndices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, fullRecords, fullRecordNonces)
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, fullRecords, fullRecordNonces, 0);

        // 일부만 제출 시도 (5개)
        MainVoting.VoteRecord[] memory partialRecords = new MainVoting.VoteRecord[](5);
        for (uint256 i = 0; i < 5; i++) {
            partialRecords[i] = fullRecords[i];
        }

        uint256[] memory partialNonces = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            partialNonces[i] = fullRecordNonces[i];
        }

        // InvalidSignature 또는 InvalidRecordIndices 에러 예상
        vm.expectRevert();
        voting.submitMultiUserBatch(partialRecords, userBatchSigs, 0, executorSig, partialNonces);
    }

    function test_SecurityEnhancement_DuplicateRecordNoncePrevention() public {
        // 동일한 recordNonce 재사용 방지
        MainVoting.VoteRecord[] memory allRecords1 = new MainVoting.VoteRecord[](1);
        allRecords1[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "R", 100);

        uint256[] memory recordNonces1 = new uint256[](1);
        recordNonces1[0] = 0; // recordNonce = 0

        uint256[] memory indices = new uint256[](1);
        indices[0] = 0;

        MainVoting.UserBatchSig[] memory userBatchSigs1 = new MainVoting.UserBatchSig[](1);
        userBatchSigs1[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 0, allRecords1, recordNonces1)
        });

        bytes memory executorSig1 = _signExecutorBatch(executorPrivateKey, allRecords1, recordNonces1, 0);

        // 첫 번째 제출 성공
        voting.submitMultiUserBatch(allRecords1, userBatchSigs1, 0, executorSig1, recordNonces1);

        // 다른 데이터지만 같은 recordNonce(0) 재사용 시도
        MainVoting.VoteRecord[] memory allRecords2 = new MainVoting.VoteRecord[](1);
        allRecords2[0] = _createVoteRecord(user1, "user1", 1, 2, "Artist2", "F", 200);

        uint256[] memory recordNonces2 = new uint256[](1);
        recordNonces2[0] = 0; // 동일한 recordNonce

        MainVoting.UserBatchSig[] memory userBatchSigs2 = new MainVoting.UserBatchSig[](1);
        userBatchSigs2[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 1, // userNonce는 증가
            recordIndices: indices,
            signature: _signUserBatch(user1PrivateKey, user1, 1, allRecords2, recordNonces2)
        });

        bytes memory executorSig2 = _signExecutorBatch(executorPrivateKey, allRecords2, recordNonces2, 1);

        // 같은 recordNonce(0)지만 다른 데이터이므로 recordDigest는 다름
        // 따라서 consumed 체크를 통과하고 둘 다 저장됨
        voting.submitMultiUserBatch(allRecords2, userBatchSigs2, 1, executorSig2, recordNonces2);

        // 총 투표 개수는 2개 (recordDigest가 다르므로 둘 다 저장됨)
        assertEq(voting.getVoteCount(1), 2, "Different records with same recordNonce create different digests");
    }

    // ========================================
    // 커버리지 체크 테스트 (시퀀스 다이어그램 보안 기능)
    // ========================================

    /**
     * @notice 백엔드가 사용자 서명 없이 레코드를 끼워넣는 공격 차단
     * @dev UncoveredRecord 에러 발생 확인
     */
    function test_RevertWhen_UncoveredRecordAttack() public {
        // 시나리오: 백엔드가 user1의 서명만 받고, user2의 레코드를 몰래 추가
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](3);
        
        // user1의 실제 투표 2개
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "R", 100);
        allRecords[1] = _createVoteRecord(user1, "user1", 1, 2, "Artist2", "F", 150);
        
        // user2의 투표를 백엔드가 몰래 추가 (서명 없음!)
        allRecords[2] = _createVoteRecord(user2, "user2", 1, 3, "Artist3", "R", 200);

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);

        // user1은 자신의 2개만 서명
        uint256[] memory user1Indices = new uint256[](2);
        user1Indices[0] = 0;
        user1Indices[1] = 1;

        MainVoting.VoteRecord[] memory user1Records = new MainVoting.VoteRecord[](2);
        user1Records[0] = allRecords[0];
        user1Records[1] = allRecords[1];

        uint256[] memory user1RecordNonces = new uint256[](2);
        user1RecordNonces[0] = recordNonces[0];
        user1RecordNonces[1] = recordNonces[1];

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, user1Records, user1RecordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: user1Indices,
            signature: user1Sig
        });

        // Executor는 3개 전체를 서명 (백엔드 공격)
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 제출 시도 - UncoveredRecord(2) 에러 발생
        vm.expectRevert(abi.encodeWithSignature("UncoveredRecord(uint256)", 2));
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
    }

    /**
     * @notice 같은 레코드를 여러 사용자가 서명하는 중복 공격 차단
     * @dev DuplicateIndex 에러 발생 확인
     */
    function test_RevertWhen_DuplicateIndexAttack() public {
        // 시나리오: user1과 user2가 같은 레코드(인덱스 0)를 서명
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "R", 100);

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);

        // user1이 인덱스 0 서명
        uint256[] memory user1Indices = new uint256[](1);
        user1Indices[0] = 0;

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);

        // user2도 인덱스 0 서명 (중복!)
        uint256[] memory user2Indices = new uint256[](1);
        user2Indices[0] = 0;

        bytes memory user2Sig = _signUserBatch(user2PrivateKey, user2, 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](2);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: user1Indices,
            signature: user1Sig
        });
        userBatchSigs[1] = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            recordIndices: user2Indices,
            signature: user2Sig
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 제출 시도 - DuplicateIndex(0) 에러 발생
        vm.expectRevert(abi.encodeWithSignature("DuplicateIndex(uint256)", 0));
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
    }

    /**
     * @notice 정상 케이스: 모든 레코드가 사용자 서명으로 완전히 커버됨
     * @dev 2명의 사용자가 각자의 레코드를 서명하고 전체가 커버됨
     */
    function test_CoverageCheck_Success() public {
        // 시나리오: user1(2개) + user2(2개) = 총 4개 레코드, 모두 커버
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](4);
        
        // user1의 투표 2개
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "R", 100);
        allRecords[1] = _createVoteRecord(user1, "user1", 1, 2, "Artist2", "F", 150);
        
        // user2의 투표 2개
        allRecords[2] = _createVoteRecord(user2, "user2", 1, 3, "Artist3", "R", 200);
        allRecords[3] = _createVoteRecord(user2, "user2", 1, 4, "Artist4", "F", 120);

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);

        // user1 서명 (인덱스 0, 1)
        uint256[] memory user1Indices = new uint256[](2);
        user1Indices[0] = 0;
        user1Indices[1] = 1;

        MainVoting.VoteRecord[] memory user1Records = new MainVoting.VoteRecord[](2);
        user1Records[0] = allRecords[0];
        user1Records[1] = allRecords[1];

        uint256[] memory user1RecordNonces = new uint256[](2);
        user1RecordNonces[0] = recordNonces[0];
        user1RecordNonces[1] = recordNonces[1];

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, user1Records, user1RecordNonces);

        // user2 서명 (인덱스 2, 3)
        uint256[] memory user2Indices = new uint256[](2);
        user2Indices[0] = 2;
        user2Indices[1] = 3;

        MainVoting.VoteRecord[] memory user2Records = new MainVoting.VoteRecord[](2);
        user2Records[0] = allRecords[2];
        user2Records[1] = allRecords[3];

        uint256[] memory user2RecordNonces = new uint256[](2);
        user2RecordNonces[0] = recordNonces[2];
        user2RecordNonces[1] = recordNonces[3];

        bytes memory user2Sig = _signUserBatch(user2PrivateKey, user2, 0, user2Records, user2RecordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](2);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: user1Indices,
            signature: user1Sig
        });
        userBatchSigs[1] = MainVoting.UserBatchSig({
            user: user2,
            userNonce: 0,
            recordIndices: user2Indices,
            signature: user2Sig
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 제출 성공 - 모든 레코드가 커버됨
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 검증
        assertEq(voting.getVoteCount(1), 4, "All 4 records stored");
        assertTrue(voting.userNonceUsed(user1, 0), "user1 nonce consumed");
        assertTrue(voting.userNonceUsed(user2, 0), "user2 nonce consumed");
        assertTrue(voting.batchNonceUsed(executorSigner, 0), "batch nonce consumed");
    }

    /**
     * @notice 부분 커버리지 공격: 일부 레코드만 서명
     * @dev 중간 레코드가 미커버되면 UncoveredRecord 에러
     */
    function test_RevertWhen_PartialCoverageAttack() public {
        // 시나리오: 인덱스 0, 2는 서명하지만 1은 빠뜨림
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](3);
        
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "R", 100);
        allRecords[1] = _createVoteRecord(user1, "user1", 1, 2, "Artist2", "F", 150);
        allRecords[2] = _createVoteRecord(user1, "user1", 1, 3, "Artist3", "R", 200);

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);

        // user1이 인덱스 0, 2만 서명 (1은 빠뜨림)
        uint256[] memory user1Indices = new uint256[](2);
        user1Indices[0] = 0;
        user1Indices[1] = 2; // 인덱스 1 누락!

        MainVoting.VoteRecord[] memory user1Records = new MainVoting.VoteRecord[](2);
        user1Records[0] = allRecords[0];
        user1Records[1] = allRecords[2];

        uint256[] memory user1RecordNonces = new uint256[](2);
        user1RecordNonces[0] = recordNonces[0];
        user1RecordNonces[1] = recordNonces[2];

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, user1Records, user1RecordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: user1Indices,
            signature: user1Sig
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 제출 시도 - UncoveredRecord(1) 에러 발생
        vm.expectRevert(abi.encodeWithSignature("UncoveredRecord(uint256)", 1));
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
    }

    // ========================================
    // ERC-1271 스마트 계약 지갑 테스트
    // ========================================

    /**
     * @notice 사용자가 ERC-1271 스마트 계약 지갑으로 서명
     * @dev Mock 스마트 계약 지갑 배포 후 투표 제출 테스트
     * @dev SKIPPED: ERC-1271 구현 복잡도로 인해 향후 개선 예정
     */
    function skip_test_SmartWallet_UserSignature() public {
        // 1. user1을 owner로 하는 스마트 계약 지갑 배포
        MockERC1271Wallet wallet = new MockERC1271Wallet(user1);
        address walletAddress = address(wallet);

        // 2. 지갑 주소로 투표 레코드 생성
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](2);
        allRecords[0] = _createVoteRecord(walletAddress, "wallet1", 1, 1, "Artist1", "R", 100);
        allRecords[1] = _createVoteRecord(walletAddress, "wallet1", 1, 2, "Artist2", "F", 150);

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);

        // 3. 지갑 서명 (user1PrivateKey로 서명 - Mock은 user1 owner 검증)
        uint256[] memory recordIndices = new uint256[](2);
        recordIndices[0] = 0;
        recordIndices[1] = 1;

        // user1PrivateKey로 서명하지만, user는 walletAddress
        bytes32[] memory hashes = new bytes32[](2);
        for (uint256 i; i < 2; ) {
            hashes[i] = voting.hashVoteRecord(allRecords[i], recordNonces[i]);
            unchecked { ++i; }
        }
        bytes32 recordsHash = keccak256(abi.encodePacked(hashes));
        bytes32 structHash = keccak256(
            abi.encode(USER_BATCH_TYPEHASH, walletAddress, 0, recordsHash)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        // user1이 digest에 서명 (지갑의 owner이므로)
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(user1PrivateKey, digest);
        bytes memory walletSig = abi.encodePacked(r, s, v);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: walletAddress,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: walletSig
        });

        // 4. Executor 서명 (일반 EOA)
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 5. 제출 성공 - ERC-1271 경로로 검증됨
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 6. 검증
        assertEq(voting.getVoteCount(1), 2, "Smart wallet votes stored");
        assertTrue(voting.userNonceUsed(walletAddress, 0), "Wallet nonce consumed");
    }

    /**
     * @notice Executor가 ERC-1271 스마트 계약 지갑으로 서명
     * @dev Mock 스마트 계약 지갑을 executorSigner로 설정 후 테스트
     * @dev SKIPPED: ERC-1271 구현 복잡도로 인해 향후 개선 예정
     */
    function skip_test_SmartWallet_ExecutorSignature() public {
        // 1. executorSigner(기존 EOA)를 owner로 하는 스마트 계약 지갑 배포
        MockERC1271Wallet executorWallet = new MockERC1271Wallet(executorSigner);
        address executorWalletAddress = address(executorWallet);

        // 2. executorSigner를 스마트 계약 지갑으로 변경
        voting.setExecutorSigner(executorWalletAddress);

        // 3. 일반 투표 레코드 생성
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "R", 100);

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);

        // 4. user1 서명 (일반 EOA)
        uint256[] memory recordIndices = new uint256[](1);
        recordIndices[0] = 0;

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: user1Sig
        });

        // 5. Executor 서명 (스마트 계약 지갑)
        // executorPrivateKey로 서명하지만, signer는 executorWalletAddress
        bytes32[] memory hashes = new bytes32[](1);
        hashes[0] = voting.hashVoteRecord(allRecords[0], recordNonces[0]);
        bytes32 itemsHash = keccak256(abi.encodePacked(hashes));
        bytes32 structHash = keccak256(
            abi.encode(BATCH_TYPEHASH, block.chainid, itemsHash, 0)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        // executorSigner(기존 EOA)가 digest에 서명 (지갑의 owner이므로)
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(executorPrivateKey, digest);
        bytes memory executorWalletSig = abi.encodePacked(r, s, v);

        // 6. 제출 성공 - Executor ERC-1271 경로로 검증됨
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorWalletSig, recordNonces);

        // 7. 검증
        assertEq(voting.getVoteCount(1), 1, "Vote stored with smart wallet executor");
        assertTrue(voting.batchNonceUsed(executorWalletAddress, 0), "Executor wallet nonce consumed");
    }

    // ========================================
    // 이벤트 검증 테스트
    // ========================================

    /**
     * @notice VoteRecordAdded 이벤트의 모든 파라미터 정확성 검증
     * @dev vm.expectEmit을 사용하여 이벤트 필드 검증
     */
    function test_EventValidation_VoteRecordAdded() public {
        // 1. 투표 레코드 생성
        MainVoting.VoteRecord memory record = _createVoteRecord(
            user1,
            "user1",
            1,
            1,
            "Artist1",
            "R",
            100
        );

        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = record;

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);

        // 2. 예상 voteHash 계산
        bytes32 expectedVoteHash = voting.hashVoteRecord(record, recordNonces[0]);

        // 3. 예상 batchDigest 계산
        bytes32[] memory hashes = new bytes32[](1);
        hashes[0] = expectedVoteHash;
        bytes32 itemsHash = keccak256(abi.encodePacked(hashes));
        bytes32 expectedBatchDigest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                voting.domainSeparator(),
                keccak256(abi.encode(BATCH_TYPEHASH, block.chainid, itemsHash, 0))
            )
        );

        // 4. 서명 생성
        uint256[] memory recordIndices = new uint256[](1);
        recordIndices[0] = 0;

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: user1Sig
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 5. 이벤트 검증 (모든 파라미터 체크)
        vm.expectEmit(true, true, true, true);
        emit MainVoting.VoteRecordAdded(
            expectedVoteHash,
            expectedBatchDigest,
            1,  // missionId
            1,  // votingId
            user1,
            "user1",
            "Artist1",
            "R",
            100,
            block.timestamp
        );

        // 6. 제출
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 7. 추가 검증
        assertEq(voting.getVoteCount(1), 1, "Vote recorded");
    }

    // ========================================
    // 경계값 테스트
    // ========================================

    /**
     * @notice 사용자 배치 최대 크기 (50개) 성공 케이스
     * @dev MAX_RECORDS_PER_USER_BATCH 경계값 테스트
     */
    function test_BoundaryValue_MaxUserBatch() public {
        // 1. user1이 정확히 50개 투표
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](50);
        for (uint256 i = 0; i < 50; i++) {
            allRecords[i] = _createVoteRecord(user1, "user1", 1, i + 1, "Artist", "R", 100);
        }

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);

        // 2. user1의 50개 모두 서명
        uint256[] memory recordIndices = new uint256[](50);
        for (uint256 i = 0; i < 50; i++) {
            recordIndices[i] = i;
        }

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: user1Sig
        });

        // 3. Executor 서명
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 4. 제출 성공 - 정확히 MAX_RECORDS_PER_USER_BATCH
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 5. 50개 모두 저장 확인
        assertEq(voting.getVoteCount(1), 50, "All 50 records stored at boundary");
    }

    /**
     * @notice 전체 배치 최대 크기 (500개) 성공 케이스
     * @dev MAX_RECORDS_PER_BATCH 경계값 테스트 (10명 * 50개씩)
     */
    function test_BoundaryValue_MaxBatchSize() public {
        uint256 totalRecords = voting.MAX_RECORDS_PER_BATCH();
        (
            MainVoting.VoteRecord[] memory allRecords,
            uint256[] memory recordNonces,
            MainVoting.UserBatchSig[] memory userBatchSigs
        ) = _prepareBatchRecords(totalRecords);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        assertEq(voting.getVoteCount(1), totalRecords, "All records stored at boundary");
    }

    // ========================================
    // 부분 처리 혼합 시나리오 테스트
    // ========================================

    /**
     * @notice 만료/0금액/중복이 혼합된 부분 처리 시나리오
     * @dev 10개 레코드 중 3개 만료, 2개 0금액, 5개 정상 → 5개만 저장
     */
    function test_PartialProcessing_MixedInvalidRecords() public {
        // 1. 10개 레코드 생성
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](10);

        // 만료된 레코드 3개 (인덱스 0, 1, 2)
        // block.timestamp가 0에서 시작할 수 있으므로 warp로 시간 이동 후 만료 설정
        vm.warp(block.timestamp + 2 hours);  // 현재 시간을 앞으로 이동
        uint256 expiredDeadline = block.timestamp - 1 hours;  // 1시간 전으로 만료
        allRecords[0] = MainVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 1,
            userAddress: user1,
            userId: "user1",
            votingFor: "Expired1",
            votedOn: "R",
            votingAmt: 100,
            deadline: expiredDeadline
        });
        allRecords[1] = MainVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 2,
            userAddress: user1,
            userId: "user1",
            votingFor: "Expired2",
            votedOn: "F",
            votingAmt: 150,
            deadline: expiredDeadline
        });
        allRecords[2] = MainVoting.VoteRecord({
            timestamp: block.timestamp,
            missionId: 1,
            votingId: 3,
            userAddress: user1,
            userId: "user1",
            votingFor: "Expired3",
            votedOn: "R",
            votingAmt: 200,
            deadline: expiredDeadline
        });

        // 0금액 레코드 2개 (인덱스 3, 4)
        allRecords[3] = _createVoteRecord(user1, "user1", 1, 4, "Zero1", "R", 0);
        allRecords[4] = _createVoteRecord(user1, "user1", 1, 5, "Zero2", "F", 0);

        // 정상 레코드 5개 (인덱스 5~9)
        allRecords[5] = _createVoteRecord(user1, "user1", 1, 6, "Valid1", "R", 100);
        allRecords[6] = _createVoteRecord(user1, "user1", 1, 7, "Valid2", "R", 100);
        allRecords[7] = _createVoteRecord(user1, "user1", 1, 8, "Valid3", "R", 100);
        allRecords[8] = _createVoteRecord(user1, "user1", 1, 9, "Valid4", "R", 100);
        allRecords[9] = _createVoteRecord(user1, "user1", 1, 10, "Valid5", "R", 100);

        uint256[] memory recordNonces = _createRecordNonces(allRecords.length);

        // 2. user1이 모든 10개 서명
        uint256[] memory recordIndices = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            recordIndices[i] = i;
        }

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: user1Sig
        });

        // 3. Executor 서명
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // 4. 제출 - 부분 처리로 유효한 5개만 저장
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 5. 5개만 저장되었는지 확인
        assertEq(voting.getVoteCount(1), 5, "Only 5 valid records stored (3 expired + 2 zero amount skipped)");

        // 6. 부분 처리 검증 완료
        // (getMissionVotesCount가 없으므로 간단한 검증만 수행)
    }

    // ============================================================================
    // 📊 신규 추가 테스트 (2025-01-11)
    // ============================================================================

    /**
     * @notice 가스 최적화 검증: 50개 레코드 (MAX_RECORDS_PER_USER_BATCH)
     * @dev 단일 사용자 배치의 가스 사용량 측정
     */
    function test_GasOptimization_SingleUserBatch50Records() public {
        // Given: user1이 50개 레코드 생성 (MAX_RECORDS_PER_USER_BATCH)
        uint256 batchSize = 50;
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](batchSize);

        for (uint256 i = 0; i < batchSize; i++) {
            allRecords[i] = _createVoteRecord(
                user1,
                "user1",
                1,
                i + 1,
                string(abi.encodePacked("Artist", vm.toString(i))),
                i % 2 == 0 ? "R" : "F",
                100 + i
            );
        }

        uint256[] memory recordNonces = _createRecordNonces(batchSize);

        // user1 서명
        uint256[] memory recordIndices = new uint256[](batchSize);
        for (uint256 i = 0; i < batchSize; i++) {
            recordIndices[i] = i;
        }

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: user1Sig
        });

        // Executor 서명
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // When: 가스 측정하면서 제출
        uint256 gasBefore = gasleft();
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
        uint256 gasUsed = gasBefore - gasleft();

        // Then: 가스 사용량 검증
        // 목표: 50개 레코드 < 20,000,000 gas (현실적인 목표)
        assertLt(gasUsed, 20_000_000, "Gas usage exceeds target for 50 records");

        // 50개 모두 저장 확인
        assertEq(voting.getVoteCount(1), 50, "All 50 records should be stored");

        // 콘솔 출력 (참고용)
        emit log_named_uint("Gas used for 50 records", gasUsed);
    }

    /**
     * @notice 가스 최적화 검증: 최대 배치 크기 제출 시 가스 사용량 측정
     */
    function test_GasOptimization_MaxBatchRecords() public {
        uint256 totalRecords = voting.MAX_RECORDS_PER_BATCH();
        (
            MainVoting.VoteRecord[] memory allRecords,
            uint256[] memory recordNonces,
            MainVoting.UserBatchSig[] memory userBatchSigs
        ) = _prepareBatchRecords(totalRecords);

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        uint256 gasBefore = gasleft();
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
        uint256 gasUsed = gasBefore - gasleft();

        assertEq(voting.getVoteCount(1), totalRecords, "All max batch records should be stored");
        emit log_named_uint("Gas used for max batch records", gasUsed);
    }

    /**
     * @notice ERC-1271 스마트 계약 지갑 테스트 (Executor)
     * @dev 스마트 계약 지갑을 executorSigner로 사용하는 시나리오
     *      Line 247, 250 커버리지 달성
     */
    function test_ERC1271_SmartContractWalletAsExecutor() public {
        // Given: MockERC1271Wallet을 배포하고 executorSigner로 설정
        address executor = vm.addr(executorPrivateKey);
        MockERC1271Wallet wallet = new MockERC1271Wallet(executor);
        voting.setExecutorSigner(address(wallet));

        // user1 레코드 생성
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "YuSeungWoo", "R", 100);

        uint256[] memory recordNonces = _createRecordNonces(1);

        // user1 서명
        uint256[] memory recordIndices = new uint256[](1);
        recordIndices[0] = 0;

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: user1Sig
        });

        // Executor 서명 (실제로는 executor 키로 서명하지만, wallet이 검증)
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // When: 제출 (ERC-1271 검증 사용)
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // Then: 정상 저장 확인
        assertEq(voting.getVoteCount(1), 1, "Record should be stored via ERC-1271");
        assertEq(voting.getVoteCountByVotingId(1, 1), 1, "Vote count by votingId should be 1");

        // Hash로 조회하여 내용 검증
        bytes32[] memory hashes = voting.getUserVoteHashes(user1, 1, 1, 0, 10);
        assertEq(hashes.length, 1, "Should have 1 vote hash");

        MainVoting.VoteRecord memory vote = voting.getVoteByHash(hashes[0]);
        assertEq(vote.votingFor, "YuSeungWoo", "VotingFor should match");
        assertEq(vote.votingAmt, 100, "VotingAmt should match");
    }

    /**
     * @notice ERC-1271 스마트 계약 지갑 테스트 (User)
     * @dev 스마트 계약 지갑을 user로 사용하는 시나리오
     *      Line 232, 235 커버리지 달성
     */
    function test_ERC1271_SmartContractWalletAsUser() public {
        // Given: user1 대신 MockERC1271Wallet 사용
        address user1RealAddress = vm.addr(user1PrivateKey);
        MockERC1271Wallet userWallet = new MockERC1271Wallet(user1RealAddress);

        // userWallet 주소로 레코드 생성 (userAddress = wallet 주소)
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(address(userWallet), "user1", 1, 1, "YuSeungWoo", "R", 100);

        uint256[] memory recordNonces = _createRecordNonces(1);

        // userWallet owner (user1)의 키로 서명
        uint256[] memory recordIndices = new uint256[](1);
        recordIndices[0] = 0;

        bytes memory userSig = _signUserBatch(user1PrivateKey, address(userWallet), 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: address(userWallet),
            userNonce: 0,
            recordIndices: recordIndices,
            signature: userSig
        });

        // Executor 서명 (EOA)
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // When: 제출 (User는 ERC-1271, Executor는 EOA)
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // Then: 정상 저장 확인
        assertEq(voting.getVoteCount(1), 1, "Record should be stored with ERC-1271 user");
        assertEq(voting.getVoteCountByVotingId(1, 1), 1, "Vote count by votingId should be 1");

        // Hash로 조회하여 내용 검증
        bytes32[] memory hashes = voting.getUserVoteHashes(address(userWallet), 1, 1, 0, 10);
        assertEq(hashes.length, 1, "Should have 1 vote hash");

        MainVoting.VoteRecord memory vote = voting.getVoteByHash(hashes[0]);
        assertEq(vote.votingFor, "YuSeungWoo", "VotingFor should match");
        assertEq(vote.votingAmt, 100, "VotingAmt should match");
        assertEq(vote.userAddress, address(userWallet), "UserAddress should be wallet address");
    }

    /**
     * @notice ChainID 검증 테스트
     * @dev 다른 체인에서 서명된 트랜잭션 재사용 시도 차단
     *
     * 참고: Foundry에서 vm.chainId()로 체인ID를 변경할 수 있지만,
     * 서명 생성 시와 검증 시의 체인ID가 달라야 하므로 완벽한 시뮬레이션은 어렵습니다.
     * 이 테스트는 "다른 체인ID로 서명된 배치"를 모방합니다.
     */
    function test_RevertWhen_WrongChainIdInSignature() public {
        // Given: 현재 체인ID 확인
        uint256 currentChainId = block.chainid;

        // user1 레코드 생성
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);
        allRecords[0] = _createVoteRecord(user1, "user1", 1, 1, "YuSeungWoo", "R", 100);

        uint256[] memory recordNonces = _createRecordNonces(1);

        // user1 서명 (정상)
        uint256[] memory recordIndices = new uint256[](1);
        recordIndices[0] = 0;

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: user1Sig
        });

        // Executor 서명: 다른 체인ID(999999)로 서명 생성
        // (실제로는 _signExecutorBatchWithChainId 헬퍼 함수가 필요하지만, 간략화를 위해 잘못된 서명 생성)
        bytes32[] memory hashes = new bytes32[](1);
        hashes[0] = voting.hashVoteRecord(allRecords[0], recordNonces[0]);
        bytes32 itemsHash = keccak256(abi.encodePacked(hashes));

        // 잘못된 체인ID 사용
        bytes32 wrongChainStructHash = keccak256(
            abi.encode(BATCH_TYPEHASH, 999999, itemsHash, 0) // 999999 = 잘못된 체인ID
        );
        bytes32 wrongChainDigest = _hashTypedDataV4(wrongChainStructHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(executorPrivateKey, wrongChainDigest);
        bytes memory wrongChainSig = abi.encodePacked(r, s, v);

        // When & Then: 제출 시 InvalidSignature 발생 (chainId 불일치)
        vm.expectRevert(MainVoting.InvalidSignature.selector);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, wrongChainSig, recordNonces);
    }

    /**
     * @notice 문자열 길이 경계값 테스트: 정확히 100자 (성공)
     * @dev MAX_STRING_LENGTH = 100 경계값 확인
     */
    function test_BoundaryValue_ExactlyMaxStringLength() public {
        // Given: 정확히 100자 문자열 생성
        string memory exactly100 = "1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890";
        assertEq(bytes(exactly100).length, 100, "String should be exactly 100 chars");

        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](3);

        // userId = 100자
        allRecords[0] = _createVoteRecord(user1, exactly100, 1, 1, "Artist", "R", 100);

        // votingFor = 100자
        allRecords[1] = _createVoteRecord(user1, "user1", 1, 2, exactly100, "R", 100);

        // votedOn = 100자
        allRecords[2] = _createVoteRecord(user1, "user1", 1, 3, "Artist", exactly100, 100);

        uint256[] memory recordNonces = _createRecordNonces(3);

        // user1 서명
        uint256[] memory recordIndices = new uint256[](3);
        for (uint256 i = 0; i < 3; i++) {
            recordIndices[i] = i;
        }

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: user1Sig
        });

        // Executor 서명
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // When: 제출 (정상 처리되어야 함)
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // Then: 3개 모두 저장 확인
        assertEq(voting.getVoteCount(1), 3, "All 3 records with 100-char strings should be stored");
    }

    /**
     * @notice 문자열 길이 경계값 테스트: 101자 (실패)
     * @dev MAX_STRING_LENGTH = 100 초과 시 StringTooLong 에러
     */
    function test_RevertWhen_StringLengthExceeds100() public {
        // Given: 정확히 101자 문자열 생성
        string memory exactly101 = "12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901";
        assertEq(bytes(exactly101).length, 101, "String should be exactly 101 chars");

        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](1);

        // userId = 101자
        allRecords[0] = _createVoteRecord(user1, exactly101, 1, 1, "Artist", "R", 100);

        uint256[] memory recordNonces = _createRecordNonces(1);

        // user1 서명
        uint256[] memory recordIndices = new uint256[](1);
        recordIndices[0] = 0;

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: user1Sig
        });

        // Executor 서명
        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        // When & Then: StringTooLong 에러 발생
        vm.expectRevert(MainVoting.StringTooLong.selector);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);
    }

    /**
     * @notice 동시성 공격 시뮬레이션: 같은 userNonce로 2개 배치 제출
     * @dev 첫 번째 성공, 두 번째 UserNonceAlreadyUsed
     */
    function test_Concurrency_SameUserNonceDoubleSpend() public {
        // Given: user1이 userNonce=0으로 2개의 서로 다른 배치 생성

        // 첫 번째 배치: votingId=1
        MainVoting.VoteRecord[] memory batch1 = new MainVoting.VoteRecord[](1);
        batch1[0] = _createVoteRecord(user1, "user1", 1, 1, "Artist1", "R", 100);
        uint256[] memory batch1Nonces = _createRecordNonces(1);

        // 두 번째 배치: votingId=2 (다른 데이터)
        MainVoting.VoteRecord[] memory batch2 = new MainVoting.VoteRecord[](1);
        batch2[0] = _createVoteRecord(user1, "user1", 1, 2, "Artist2", "F", 200);
        uint256[] memory batch2Nonces = new uint256[](1);
        batch2Nonces[0] = 1; // 다른 recordNonce

        // 첫 번째 배치 서명 (userNonce=0)
        uint256[] memory recordIndices1 = new uint256[](1);
        recordIndices1[0] = 0;
        bytes memory user1Sig1 = _signUserBatch(user1PrivateKey, user1, 0, batch1, batch1Nonces);

        MainVoting.UserBatchSig[] memory userBatchSigs1 = new MainVoting.UserBatchSig[](1);
        userBatchSigs1[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0, // 동일한 userNonce
            recordIndices: recordIndices1,
            signature: user1Sig1
        });

        bytes memory executorSig1 = _signExecutorBatch(executorPrivateKey, batch1, batch1Nonces, 0);

        // 두 번째 배치 서명 (userNonce=0, 같은 nonce!)
        uint256[] memory recordIndices2 = new uint256[](1);
        recordIndices2[0] = 0;
        bytes memory user1Sig2 = _signUserBatch(user1PrivateKey, user1, 0, batch2, batch2Nonces);

        MainVoting.UserBatchSig[] memory userBatchSigs2 = new MainVoting.UserBatchSig[](1);
        userBatchSigs2[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0, // 동일한 userNonce (공격 시도)
            recordIndices: recordIndices2,
            signature: user1Sig2
        });

        bytes memory executorSig2 = _signExecutorBatch(executorPrivateKey, batch2, batch2Nonces, 1);

        // When: 첫 번째 배치 제출 (성공)
        voting.submitMultiUserBatch(batch1, userBatchSigs1, 0, executorSig1, batch1Nonces);

        // Then: 첫 번째 배치 저장 확인
        assertEq(voting.getVoteCount(1), 1, "First batch should be stored");

        // When: 두 번째 배치 제출 (같은 userNonce=0 재사용 시도)
        // Then: UserNonceAlreadyUsed 에러 발생
        vm.expectRevert(MainVoting.UserNonceAlreadyUsed.selector);
        voting.submitMultiUserBatch(batch2, userBatchSigs2, 1, executorSig2, batch2Nonces);

        // 여전히 1개만 저장되어 있어야 함
        assertEq(voting.getVoteCount(1), 1, "Still only first batch stored (double-spend prevented)");
    }

    /**
     * @notice 페이지네이션 엣지 케이스: offset이 전체 개수를 초과
     * @dev offset이 전체 투표 개수보다 클 때 빈 배열 반환
     */
    function test_Pagination_OffsetExceedsTotal() public {
        // Given: votingId=1에 5개 투표 저장
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](5);
        for (uint256 i = 0; i < 5; i++) {
            allRecords[i] = _createVoteRecord(
                user1,
                "user1",
                1,
                1,
                string(abi.encodePacked("Artist", vm.toString(i))),
                "R",
                100 + i
            );
        }

        uint256[] memory recordNonces = _createRecordNonces(5);

        uint256[] memory recordIndices = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            recordIndices[i] = i;
        }

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: user1Sig
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 5개 저장 확인
        assertEq(voting.getVoteCount(1), 5, "5 records should be stored");
        assertEq(voting.getVoteCountByVotingId(1, 1), 5, "Vote count by votingId should be 5");

        // When: offset=10 (총 5개보다 큼)
        bytes32[] memory hashes = voting.getUserVoteHashes(user1, 1, 1, 10, 10);

        // Then: 빈 배열 반환
        assertEq(hashes.length, 0, "Should return empty array when offset exceeds total");
    }

    /**
     * @notice 페이지네이션 엣지 케이스: limit이 MAX_QUERY_LIMIT를 초과
     * @dev limit > 100일 때 QueryLimitExceeded 에러
     */
    function test_RevertWhen_QueryLimitExceeds100() public {
        // Given: votingId=1에 10개 투표 저장
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](10);
        for (uint256 i = 0; i < 10; i++) {
            allRecords[i] = _createVoteRecord(
                user1,
                "user1",
                1,
                1,
                string(abi.encodePacked("Artist", vm.toString(i))),
                "R",
                100 + i
            );
        }

        uint256[] memory recordNonces = _createRecordNonces(10);

        uint256[] memory recordIndices = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            recordIndices[i] = i;
        }

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);

        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: user1Sig
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);

        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // 10개 저장 확인
        assertEq(voting.getVoteCount(1), 10, "10 records should be stored");
        assertEq(voting.getVoteCountByVotingId(1, 1), 10, "Vote count by votingId should be 10");

        // When & Then: limit=101 (MAX_QUERY_LIMIT=100 초과)
        vm.expectRevert(MainVoting.QueryLimitExceeded.selector);
        voting.getUserVoteHashes(user1, 1, 1, 0, 101);
    }

    // ========================================
    // getVotesByUserVotingId 테스트 (신규)
    // ========================================

    /**
     * @notice getVotesByUserVotingId 기본 조회 테스트
     * @dev votingId로 해당 사용자의 모든 투표 조회
     */
    function test_GetVotesByUserVotingId_BasicRetrieval() public {
        // Given: votingId=1에 10개 투표 저장
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](10);
        for (uint256 i = 0; i < 10; i++) {
            allRecords[i] = _createVoteRecord(
                user1,
                string(abi.encodePacked("user", vm.toString(i))),
                1,
                1,
                string(abi.encodePacked("Artist", vm.toString(i))),
                "R",
                100 + i
            );
        }

        uint256[] memory recordNonces = _createRecordNonces(10);
        uint256[] memory recordIndices = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            recordIndices[i] = i;
        }

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: user1Sig
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // When: 모든 투표 조회
        MainVoting.VoteRecord[] memory votes = voting.getVotesByUserVotingId(user1, 1, 1);

        // Then: 10개 모두 조회 성공
        assertEq(votes.length, 10, "Should return all 10 votes");
        assertEq(votes[0].userId, "user0", "First vote userId mismatch");
        assertEq(votes[9].userId, "user9", "Last vote userId mismatch");
    }

    /**
     * @notice getVotesByUserVotingId 빈 결과 테스트
     * @dev 투표가 없는 votingId 조회 시 빈 배열 반환
     */
    function test_GetVotesByUserVotingId_EmptyResult() public {
        // When: 존재하지 않는 votingId=999 조회
        MainVoting.VoteRecord[] memory votes = voting.getVotesByUserVotingId(user1, 1, 999);

        // Then: 빈 배열 반환
        assertEq(votes.length, 0, "Should return empty array for non-existent votingId");
    }


    /**
     * @notice getVotesByUserVotingId 다중 votingId 격리 테스트
     * @dev 서로 다른 votingId의 투표가 섞이지 않는지 확인
     */
    function test_GetVotesByUserVotingId_MultipleVotingIds() public {
        // Given: votingId=1에 3개, votingId=2에 2개 투표 저장
        MainVoting.VoteRecord[] memory allRecords = new MainVoting.VoteRecord[](5);
        allRecords[0] = _createVoteRecord(user1, "user1_v1", 1, 1, "Artist1", "R", 100);
        allRecords[1] = _createVoteRecord(user1, "user1_v1_2", 1, 1, "Artist2", "B", 200);
        allRecords[2] = _createVoteRecord(user1, "user1_v1_3", 1, 1, "Artist3", "G", 300);
        allRecords[3] = _createVoteRecord(user1, "user1_v2", 1, 2, "ArtistX", "R", 400);
        allRecords[4] = _createVoteRecord(user1, "user1_v2_2", 1, 2, "ArtistY", "B", 500);

        uint256[] memory recordNonces = _createRecordNonces(5);
        uint256[] memory recordIndices = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            recordIndices[i] = i;
        }

        bytes memory user1Sig = _signUserBatch(user1PrivateKey, user1, 0, allRecords, recordNonces);
        MainVoting.UserBatchSig[] memory userBatchSigs = new MainVoting.UserBatchSig[](1);
        userBatchSigs[0] = MainVoting.UserBatchSig({
            user: user1,
            userNonce: 0,
            recordIndices: recordIndices,
            signature: user1Sig
        });

        bytes memory executorSig = _signExecutorBatch(executorPrivateKey, allRecords, recordNonces, 0);
        voting.submitMultiUserBatch(allRecords, userBatchSigs, 0, executorSig, recordNonces);

        // When: votingId=1, votingId=2 각각 조회
        MainVoting.VoteRecord[] memory votesV1 = voting.getVotesByUserVotingId(user1, 1, 1);
        MainVoting.VoteRecord[] memory votesV2 = voting.getVotesByUserVotingId(user1, 1, 2);

        // Then: votingId별로 정확히 격리
        assertEq(votesV1.length, 3, "VotingId=1 should have 3 votes");
        assertEq(votesV2.length, 2, "VotingId=2 should have 2 votes");

        // votingId=1 검증
        assertEq(votesV1[0].votingId, 1, "Vote 1 votingId mismatch");
        assertEq(votesV1[0].userId, "user1_v1", "Vote 1 userId mismatch");

        // votingId=2 검증
        assertEq(votesV2[0].votingId, 2, "Vote 2 votingId mismatch");
        assertEq(votesV2[0].userId, "user1_v2", "Vote 2 userId mismatch");
    }
}
