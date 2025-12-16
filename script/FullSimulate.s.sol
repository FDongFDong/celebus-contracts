// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {Boosting} from "../src/vote/Boosting.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract FullSimulate is Script {
    Boosting boosting = Boosting(0x030E10eBEe7344289CDd755d5dda04e71F0220fC);
    
    bytes32 constant BATCH_TYPEHASH = keccak256("Batch(uint256 batchNonce)");
    
    function run() external {
        // Executor 계정 설정 (실제 테스트에서는 이 PK를 사용)
        uint256 executorPk = vm.envUint("PRIVATE_KEY");
        address executor = vm.addr(executorPk);
        
        console.log("Executor:", executor);
        
        // 배치 데이터 구성
        Boosting.BoostRecord memory record = Boosting.BoostRecord({
            recordId: 1,
            timestamp: 1765886395,
            missionId: 1,
            boostingId: 1765886395445549,
            userId: "test_user_0",
            optionId: 101,
            boostingWith: 0,
            amt: 100
        });
        
        Boosting.UserSig memory userSig = Boosting.UserSig({
            user: 0xF34a91e845babB6dB5B75a26aD7Ccd23eeDF1BAF,
            userNonce: 1765886395180,
            signature: hex"5273067307b70a1651a7d39a89d061c2aba2d093135e55645bae9e858d606de91623b5e6a95972019b427d01564d54da36d78ab570f6b260a05f1cf0fc0745521b"
        });
        
        Boosting.UserBoostBatch[] memory batches = new Boosting.UserBoostBatch[](1);
        batches[0] = Boosting.UserBoostBatch({
            record: record,
            userSig: userSig
        });
        
        // batchNonce 생성
        uint256 batchNonce = uint256(keccak256(abi.encode(block.timestamp, executor, "test")));
        console.log("BatchNonce:", batchNonce);
        
        // Executor 서명 생성
        bytes32 domainSeparator = boosting.domainSeparator();
        bytes32 structHash = keccak256(abi.encode(BATCH_TYPEHASH, batchNonce));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(executorPk, digest);
        bytes memory executorSig = abi.encodePacked(r, s, v);
        
        console.log("Executor sig created");
        
        // 시뮬레이션
        vm.prank(executor);
        try boosting.submitBoostBatch(batches, batchNonce, executorSig) {
            console.log("SUCCESS!");
        } catch Error(string memory reason) {
            console.log("FAILED with reason:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("FAILED with low-level error");
            console.logBytes(lowLevelData);
        }
    }
}
