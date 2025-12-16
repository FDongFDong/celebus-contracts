/**
 * SubVoting Demo Configuration
 * 컨트랙트 주소, ABI, 기본값 등을 관리합니다
 *
 * 최신 컨트랙트 변경 사항 (2024):
 * - Nonce 관리: usedUserNonces(address, uint256), usedBatchNonces(address, uint256) 사용
 * - 중복 체크 방식으로 변경 (순차 카운터 → mapping 기반)
 */

// SubVoting-abi.json에서 ABI를 동적으로 로드
let ABI_DATA = null;

async function loadABI() {
  if (ABI_DATA) return ABI_DATA;
  const candidates = [
    // index.html(=sub_demo/) 기준 경로
    './SubVoting-abi.json',
    './js/abi/SubVoting.json',
    // legacy fallbacks
    '../SubVoting-abi.json',
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      ABI_DATA = await response.json();
      // CONFIG.ABI를 동적으로 갱신 (다른 모듈의 호환성 유지)
      if (typeof CONFIG !== 'undefined' && CONFIG) {
        CONFIG.ABI = ABI_DATA;
      }
      return ABI_DATA;
    } catch (e) {
      // 다음 후보로 진행
    }
  }

  console.warn('ABI 파일 로드 실패, 내장 ABI 사용');
  return CONFIG.ABI;
}

export { loadABI };

export const CONFIG = {
  // Network Configuration
  CHAIN_ID: 5611,
  CHAIN_NAME: 'opBNB Testnet',
  RPC_URL: 'https://opbnb-testnet-rpc.bnbchain.org',

  // Contract Configuration
  VOTING_ADDRESS: 'NEW_CONTRACT_ADDRESS', // 새로 배포된 SubVoting 컨트랙트 주소

  // Contract ABI (UserVoteBatch[] 구조 - recordId 포함)
  // 최신 버전: usedUserNonces, usedBatchNonces 사용 (중복 체크 방식)
  ABI: [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "initialOwner",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "CHAIN_ID",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "MAX_RECORDS_PER_BATCH",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "MAX_RECORDS_PER_USER_BATCH",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "MAX_STRING_LENGTH",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "acceptOwnership",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "allowedOption",
      "inputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "allowedQuestion",
      "inputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "consumed",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "domainSeparator",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "eip712Domain",
      "inputs": [],
      "outputs": [
        {
          "name": "fields",
          "type": "bytes1",
          "internalType": "bytes1"
        },
        {
          "name": "name",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "version",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "chainId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "verifyingContract",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "salt",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "extensions",
          "type": "uint256[]",
          "internalType": "uint256[]"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "executorSigner",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getOptionVotes",
      "inputs": [
        {
          "name": "missionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "questionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "optionId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getQuestionAggregates",
      "inputs": [
        {
          "name": "missionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "questionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "optionIds",
          "type": "uint256[]",
          "internalType": "uint256[]"
        }
      ],
      "outputs": [
        {
          "name": "optionVotes",
          "type": "uint256[]",
          "internalType": "uint256[]"
        },
        {
          "name": "total",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getQuestionTotalVotes",
      "inputs": [
        {
          "name": "missionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "questionId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getVoteSummariesByMissionVotingId",
      "inputs": [
        {
          "name": "missionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "votingId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple[]",
          "internalType": "struct SubVoting.VoteRecordSummary[]",
          "components": [
            {
              "name": "timestamp",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "missionId",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "votingId",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "userId",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "questionText",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "optionText",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "votingAmt",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "optionName",
      "inputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "string",
          "internalType": "string"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "optionVotesByQuestion",
      "inputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "pendingOwner",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "questionName",
      "inputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "string",
          "internalType": "string"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "questionRegistered",
      "inputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "questionTotalVotes",
      "inputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "renounceOwnership",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setExecutorSigner",
      "inputs": [
        {
          "name": "s",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setOption",
      "inputs": [
        {
          "name": "missionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "questionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "optionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "text",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "allowed_",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setQuestion",
      "inputs": [
        {
          "name": "missionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "questionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "text",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "allowed_",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "submitMultiUserBatch",
      "inputs": [
        {
          "name": "batches",
          "type": "tuple[]",
          "internalType": "struct SubVoting.UserVoteBatch[]",
          "components": [
            {
              "name": "records",
              "type": "tuple[]",
              "internalType": "struct SubVoting.VoteRecord[]",
              "components": [
                {
                  "name": "recordId",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "timestamp",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "missionId",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "votingId",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "userId",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "questionId",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "optionId",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "votingAmt",
                  "type": "uint256",
                  "internalType": "uint256"
                }
              ]
            },
            {
              "name": "userBatchSig",
              "type": "tuple",
              "internalType": "struct SubVoting.UserBatchSig",
              "components": [
                {
                  "name": "user",
                  "type": "address",
                  "internalType": "address"
                },
                {
                  "name": "userNonce",
                  "type": "uint256",
                  "internalType": "uint256"
                },
                {
                  "name": "signature",
                  "type": "bytes",
                  "internalType": "bytes"
                }
              ]
            }
          ]
        },
        {
          "name": "batchNonce_",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "executorSig",
          "type": "bytes",
          "internalType": "bytes"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "transferOwnership",
      "inputs": [
        {
          "name": "newOwner",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "usedBatchNonces",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "usedUserNonces",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "votes",
      "inputs": [
        {
          "name": "",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ],
      "outputs": [
        {
          "name": "recordId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "timestamp",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "missionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "votingId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "userId",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "questionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "optionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "votingAmt",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "BatchProcessed",
      "inputs": [
        {
          "name": "batchDigest",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "executorSigner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "batchNonce",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "recordCount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "userCount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "failedUserCount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "EIP712DomainChanged",
      "inputs": [],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "ExecutorSignerChanged",
      "inputs": [
        {
          "name": "oldSigner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "newSigner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "OptionSet",
      "inputs": [
        {
          "name": "missionId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "questionId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "optionId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "text",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        },
        {
          "name": "allowed",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "OwnershipTransferStarted",
      "inputs": [
        {
          "name": "previousOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "newOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "OwnershipTransferred",
      "inputs": [
        {
          "name": "previousOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "newOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "QuestionSet",
      "inputs": [
        {
          "name": "missionId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "questionId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "text",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        },
        {
          "name": "allowed",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "UserBatchFailed",
      "inputs": [
        {
          "name": "batchDigest",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "userNonce",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "reasonCode",
          "type": "uint8",
          "indexed": false,
          "internalType": "uint8"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "UserBatchProcessed",
      "inputs": [
        {
          "name": "batchDigest",
          "type": "bytes32",
          "indexed": true,
          "internalType": "bytes32"
        },
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "userNonce",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "recordCount",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "UserMissionResult",
      "inputs": [
        {
          "name": "votingId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "success",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        },
        {
          "name": "failedRecordIds",
          "type": "uint256[]",
          "indexed": false,
          "internalType": "uint256[]"
        },
        {
          "name": "reasonCode",
          "type": "uint8",
          "indexed": false,
          "internalType": "uint8"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "VoteSkipped",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "votingId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "recordId",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "reason",
          "type": "uint8",
          "indexed": false,
          "internalType": "uint8"
        }
      ],
      "anonymous": false
    },
    {
      "type": "error",
      "name": "BadChain",
      "inputs": []
    },
    {
      "type": "error",
      "name": "BatchNonceAlreadyUsed",
      "inputs": []
    },
    {
      "type": "error",
      "name": "BatchTooLarge",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ECDSAInvalidSignature",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ECDSAInvalidSignatureLength",
      "inputs": [
        {
          "name": "length",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "ECDSAInvalidSignatureS",
      "inputs": [
        {
          "name": "s",
          "type": "bytes32",
          "internalType": "bytes32"
        }
      ]
    },
    {
      "type": "error",
      "name": "EmptyText",
      "inputs": []
    },
    {
      "type": "error",
      "name": "InvalidOptionId",
      "inputs": [
        {
          "name": "optionId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "InvalidRecordIndices",
      "inputs": []
    },
    {
      "type": "error",
      "name": "InvalidShortString",
      "inputs": []
    },
    {
      "type": "error",
      "name": "InvalidSignature",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NoSuccessfulUser",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NotOwnerOrExecutor",
      "inputs": []
    },
    {
      "type": "error",
      "name": "OptionNotAllowed",
      "inputs": [
        {
          "name": "missionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "optionId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "OwnableInvalidOwner",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "OwnableUnauthorizedAccount",
      "inputs": [
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "QuestionNotAllowed",
      "inputs": [
        {
          "name": "missionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "questionId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "QuestionNotRegistered",
      "inputs": [
        {
          "name": "missionId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "questionId",
          "type": "uint256",
          "internalType": "uint256"
        }
      ]
    },
    {
      "type": "error",
      "name": "StringTooLong",
      "inputs": [
        {
          "name": "str",
          "type": "string",
          "internalType": "string"
        }
      ]
    },
    {
      "type": "error",
      "name": "StringTooLong",
      "inputs": []
    },
    {
      "type": "error",
      "name": "UserBatchTooLarge",
      "inputs": []
    },
    {
      "type": "error",
      "name": "UserNonceAlreadyUsed",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ZeroAddress",
      "inputs": []
    }
  ],
  // 실패 사유 코드 (reasonCode) - 최신 SubVoting.sol 기준
  REASON_CODES: {
    0: { name: 'SUCCESS', message: '성공', alert: false },
    1: { name: 'USER_BATCH_TOO_LARGE', message: '배치 레코드 수 초과 (0개 또는 최대 20개 초과)', alert: true },
    2: { name: 'INVALID_USER_SIGNATURE', message: '서명 검증 실패 (EIP-712 서명 불일치)', alert: true },
    3: { name: 'USER_NONCE_INVALID', message: 'Nonce 중복 사용 (이미 사용된 nonce)', alert: true },
    4: { name: 'INVALID_OPTION_ID', message: 'optionId 오류 (0은 허용되지 않음)', alert: true },
    5: { name: 'QUESTION_NOT_ALLOWED', message: '허용되지 않은 질문 (비활성화된 질문)', alert: true },
    6: { name: 'OPTION_NOT_ALLOWED', message: '허용되지 않은 옵션 (비활성화된 선택지)', alert: true },
    7: { name: 'STRING_TOO_LONG', message: '문자열 길이 초과 (userId > 100자)', alert: true },
    8: { name: 'DUPLICATE_RECORD', message: '중복 레코드 (이미 처리된 레코드)', alert: true },
    9: { name: 'ZERO_AMOUNT', message: '투표 수량이 0입니다', alert: true },
    10: { name: 'VOTING_ID_MISMATCH', message: '유저 배치 내 votingId가 서로 다릅니다', alert: true }
  },

  // EIP-712 Domain Configuration
  DOMAIN: {
    name: 'SubVoting',
    version: '1',
    chainId: 5611,
    verifyingContract: 'NEW_CONTRACT_ADDRESS'
  },

  // Default Values for Testing
  DEFAULT_VALUES: {
    // User Private Keys (테스트용 - 각각 다른 비밀키 사용)
    user1PrivateKey: '0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef',
    user2PrivateKey: '0xb43112fd82593f95dea3ba1a25eed28a6a75d6763677a42560b5d7815fea7977',
    // Executor는 0x240eCdd1C5a7C30149D43987ce5A3Eb4e9E97897 (컨트랙트에 등록됨)
    executorPrivateKey: '0x94d26f9b25e16734a747e9f789d71082cb80155d11810ba99a12f9fd163397ef',

    // User IDs (데모용 - 실제로는 백엔드가 DB에서 조회)
    user1Id: '사용자A',
    user2Id: '사용자B',

    // Vote Record Defaults
    missionId: 1,
    votingId: 1,
    questionId: 1,  // SubVoting용 질문 ID
    optionId: 1,    // SubVoting용 옵션 ID (양의 정수)
    votingAmt: 100
  },

  // Limits
  MAX_RECORDS_PER_BATCH: 20,
  MAX_RECORDS_PER_USER: 20,
  // optionId는 양의 정수(0 불가)만 허용

  // UI Messages
  MESSAGES: {
    userIdNote: '[참고] 실제 환경에서는 백엔드가 지갑 주소로 DB에서 userId를 조회하여 자동 설정합니다',
    signatureExplanation: 'EIP-712 구조화된 데이터 서명을 사용합니다',
    backendNote: '[TIP] 백엔드는 모든 사용자의 서명을 수집한 후 배치로 컨트랙트에 제출합니다'
  }
};

// Utility function to get current contract instance
export async function getContractInstance(signer, contractAddress) {
  await loadABI();
  const address = contractAddress || CONFIG.VOTING_ADDRESS;
  return new ethers.Contract(address, CONFIG.ABI, signer);
}

// Utility function to get domain for EIP-712
export function getDomain(contractAddress) {
  return {
    name: CONFIG.DOMAIN.name,
    version: CONFIG.DOMAIN.version,
    chainId: CONFIG.DOMAIN.chainId,
    verifyingContract: contractAddress || CONFIG.DOMAIN.verifyingContract
  };
}

// SubVoting Contract Bytecode (embedded for file:/// protocol support)
// Dummy export for browser cache compatibility (MainVoting demo uses this)
export const MAINVOTING_BYTECODE = "";
export const SUBVOTING_BYTECODE = "0x61018080604052346101d857602081612b24803803809161002082856101dc565b8339810103126101d857516001600160a01b038116908190036101d8576040519061004c6040836101dc565b600982526020820168537562566f74696e6760b81b8152604051926100726040856101dc565b600184526020840192603160f81b845280156101c557600180546001600160a01b03199081169091555f8054918216831781556001600160a01b03909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a36100de81610213565b610120526100eb846103ae565b61014052519020918260e05251902080610100524660a0526040519060208201927f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f8452604083015260608201524660808201523060a082015260a0815261015460c0826101dc565b5190206080523060c052466101605260405161263d90816104e78239608051816121a0015260a0518161225d015260c0518161216a015260e051816121ef01526101005181612215015261012051816109df01526101405181610a0b0152610160518181816109a40152610fb50152f35b631e4fbdf760e01b5f525f60045260245ffd5b5f80fd5b601f909101601f19168101906001600160401b038211908210176101ff57604052565b634e487b7160e01b5f52604160045260245ffd5b908151602081105f1461028d575090601f81511161024d57602081519101516020821061023e571790565b5f198260200360031b1b161790565b604460209160405192839163305a27a960e01b83528160048401528051918291826024860152018484015e5f828201840152601f01601f19168101030190fd5b6001600160401b0381116101ff57600254600181811c911680156103a4575b602082101461039057601f811161035d575b50602092601f82116001146102fc57928192935f926102f1575b50508160011b915f199060031b1c19161760025560ff90565b015190505f806102d8565b601f1982169360025f52805f20915f5b868110610345575083600195961061032d575b505050811b0160025560ff90565b01515f1960f88460031b161c191690555f808061031f565b9192602060018192868501518155019401920161030c565b60025f52601f60205f20910160051c810190601f830160051c015b81811061038557506102be565b5f8155600101610378565b634e487b7160e01b5f52602260045260245ffd5b90607f16906102ac565b908151602081105f146103d9575090601f81511161024d57602081519101516020821061023e571790565b6001600160401b0381116101ff57600354600181811c911680156104dc575b602082101461039057601f81116104a9575b50602092601f821160011461044857928192935f9261043d575b50508160011b915f199060031b1c19161760035560ff90565b015190505f80610424565b601f1982169360035f52805f20915f5b8681106104915750836001959610610479575b505050811b0160035560ff90565b01515f1960f88460031b161c191690555f808061046b565b91926020600181928685015181550194019201610458565b60035f52601f60205f20910160051c810190601f830160051c015b8181106104d1575061040a565b5f81556001016104c4565b90607f16906103f856fe6080806040526004361015610012575f80fd5b5f3560e01c908163032e1a40146119bd575080630470ffc81461017157806306407d7214610ec85780630f70efa1146118fc57806316c9a20714610f305780631a30ffa114610ef75780632a08b5fe14610ec85780632b38cd9614610e3057806334ccc5ea14610e15578063574df93214610dcc57806360f57e8014610d8e578063715018a614610d2b57806379ba509714610ca65780637b1c83b314610a9457806384b0196e146109c757806385e1f4d01461098d5780638da5cb5b14610966578063b40f68ce14610705578063c00e0e2514610683578063caa7c2461461064f578063dc5d0379146103d6578063e29dfba81461038d578063e30c397814610365578063e3a9db3214610303578063f2fde38b14610291578063f698da251461026f578063f6de30b614610247578063f7feca8a146101fe578063faecef15146101ca578063fd81654e146101ae5763ffbfdbbf14610171575f80fd5b346101aa5761017f366119d6565b915f52600f60205260405f20905f5260205260405f20905f52602052602060405f2054604051908152f35b5f80fd5b346101aa575f3660031901126101aa5760206040516107d08152f35b346101aa576101d8366119f0565b905f52600c60205260405f20905f52602052602060ff60405f2054166040519015158152f35b346101aa5760403660031901126101aa576001600160a01b0361021f611baf565b165f52600660205260405f206024355f52602052602060ff60405f2054166040519015158152f35b346101aa575f3660031901126101aa576009546040516001600160a01b039091168152602090f35b346101aa575f3660031901126101aa576020610289612167565b604051908152f35b346101aa5760203660031901126101aa576102aa611baf565b6102b2612154565b60018060a01b0316806bffffffffffffffffffffffff60a01b600154161760015560018060a01b035f54167f38d16b8cac22d99fc7c124b9cd0de2d3fa1faef420bfe791d8c362d765e227005f80a3005b346101aa57610311366119d6565b915f52600d60205260405f20905f5260205260405f20905f5260205261036161034661034d60405f2060405192838092611ace565b0382611b6a565b604051918291602083526020830190611b8b565b0390f35b346101aa575f3660031901126101aa576001546040516001600160a01b039091168152602090f35b346101aa5760403660031901126101aa576001600160a01b036103ae611baf565b165f52600860205260405f206024355f52602052602060ff60405f2054166040519015158152f35b346101aa5760a03660031901126101aa576044356024356004356064356001600160401b0381116101aa5761040f903690600401611a69565b9060843580151581036101aa57610424612154565b835f52600c60205260405f20855f5260205260ff60405f2054161561063757821561062857851561061557835f52600d60205260405f20855f5260205260405f20865f5260205260405f206001600160401b038411610601576104878154611a96565b601f81116105bc575b505f601f8511600114610532579161052291857f85c66a91133fbeb8288b2279a45826b22de8a7146c961451a200ce916a1b3c509695945f91610527575b508560011b905f198760031b1c19161790555b855f52600e60205260405f20875f5260205260405f20885f526020526105168160405f209060ff801983541691151516179055565b60405193849384611ce3565b0390a4005b90508401358a6104ce565b601f19851690825f5260205f20915f5b8181106105a45750916105229391877f85c66a91133fbeb8288b2279a45826b22de8a7146c961451a200ce916a1b3c50989796941061058b575b5050600185811b0190556104e1565b8501355f19600388901b60f8161c19169055898061057c565b9192602060018192868a013581550194019201610542565b815f5260205f20601f860160051c810191602087106105f7575b601f0160051c01905b8181106105ec5750610490565b5f81556001016105df565b90915081906105d6565b634e487b7160e01b5f52604160045260245ffd5b8563768d03e960e11b5f5260045260245ffd5b63af943d0360e01b5f5260045ffd5b50505063276b620160e01b5f5260045260245260445ffd5b346101aa5761065d366119f0565b905f52600b60205260405f20905f52602052602060ff60405f2054166040519015158152f35b346101aa5760203660031901126101aa5761069c611baf565b6106a4612154565b6001600160a01b031680156106f657600980546001600160a01b0319811683179091556001600160a01b03167f7b430a84222a519230743a1a600e19cbaf3386e1074a55b0ae7bedf74419406c5f80a3005b63d92e233d60e01b5f5260045ffd5b346101aa57610713366119f0565b905f52600560205260405f20905f5260205260405f20805461073481611bc5565b916107426040519384611b6a565b818352601f1961075183611bc5565b015f5b8181106109235750505f5b82811061082857836040518091602082016020835281518091526040830190602060408260051b8601019301915f905b82821061079e57505050500390f35b919360019193955060208091603f198982030185528751908151815282820151838201526040820151604082015260c0806108126108006107ee606087015160e0606088015260e0870190611b8b565b60808701518682036080880152611b8b565b60a086015185820360a0870152611b8b565b930151910152960192019201859493919261078f565b8061083560019284611d04565b90549060031b1c5f5260046020526108bf60405f206103466108fd85830154926103466108ec60028301549260046108db600383015492865f52600a60205260405f2093600582015494855f5260205260405f2094885f52600d60205260405f20905f5260205260405f2060068301545f5260205260405f209760078301549b6040519d8e611b4f565b8d5260208d015260408c01526103466040518094819301611ace565b606089015260405192838092611ace565b608086015260405192838092611ace565b60a083015260c08201526109118287611c0e565b5261091c8186611c0e565b500161075f565b60209060405161093281611b4f565b5f81525f838201525f604082015260608082015260606080820152606060a08201525f60c082015282828801015201610754565b346101aa575f3660031901126101aa575f546040516001600160a01b039091168152602090f35b346101aa575f3660031901126101aa5760206040517f00000000000000000000000000000000000000000000000000000000000000008152f35b346101aa575f3660031901126101aa57610a66610a037f0000000000000000000000000000000000000000000000000000000000000000612419565b610361610a2f7f0000000000000000000000000000000000000000000000000000000000000000612475565b610a7460405191610a41602084611b6a565b5f83525f368137604051958695600f60f81b875260e0602088015260e0870190611b8b565b908582036040870152611b8b565b904660608501523060808501525f60a085015283820360c0850152611a36565b346101aa5760803660031901126101aa576004356024356044356001600160401b0381116101aa57610aca903690600401611a69565b606435939184151585036101aa57610ae0612154565b811561062857825f52600a60205260405f20845f5260205260405f20946001600160401b03831161060157610b158654611a96565b601f8111610c61575b505f95601f8411600114610bd85790610bc891847fc9c1ae0a6fb65b3fc44b61a6cc769977fca4a7e8543caa636a406f35d1efd4b39697985f91610bcd575b508560011b905f198760031b1c19161790555b855f52600b60205260405f20875f52602052610b9b8160405f209060ff801983541691151516179055565b855f52600c60205260405f20875f5260205260405f20600160ff1982541617905560405193849384611ce3565b0390a3005b905084013589610b5d565b601f198416815f5260205f20905f5b818110610c495750907fc9c1ae0a6fb65b3fc44b61a6cc769977fca4a7e8543caa636a406f35d1efd4b396979886610bc895949310610c30575b5050600185811b019055610b70565b8501355f19600388901b60f8161c191690558880610c21565b858a013583556020998a019960019093019201610be7565b865f5260205f20601f850160051c81019160208610610c9c575b601f0160051c01905b818110610c915750610b1e565b5f8155600101610c84565b9091508190610c7b565b346101aa575f3660031901126101aa57600154336001600160a01b0390911603610d1857600180546001600160a01b03199081169091555f805433928116831782556001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a3005b63118cdaa760e01b5f523360045260245ffd5b346101aa575f3660031901126101aa57610d43612154565b600180546001600160a01b03199081169091555f80549182168155906001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a3005b346101aa57610d9c366119d6565b915f52600e60205260405f20905f5260205260405f20905f52602052602060ff60405f2054166040519015158152f35b346101aa5760403660031901126101aa576001600160a01b03610ded611baf565b165f52600760205260405f206024355f52602052602060ff60405f2054166040519015158152f35b346101aa575f3660031901126101aa57602060405160648152f35b346101aa5760203660031901126101aa576004355f52600460205260405f2080546001820154916002810154600382015491610eb4604051610e79816103468160048701611ace565b600583015494600760068501549401549460405198899889526020890152604088015260608701526101006080870152610100860190611b8b565b9260a085015260c084015260e08301520390f35b346101aa57610ed6366119f0565b905f52601060205260405f20905f52602052602060405f2054604051908152f35b346101aa57610f05366119f0565b905f52600a60205260405f20905f5260205261036161034661034d60405f2060405192838092611ace565b346101aa5760603660031901126101aa576004356001600160401b0381116101aa57610f60903690600401611a06565b602435906044356001600160401b0381116101aa57610f83903690600401611a69565b82939193156118ed575f805b8482106118c9576107d09150116118ba576009546001600160a01b03169081156106f6577f000000000000000000000000000000000000000000000000000000000000000046036118ab576110319061102960405160208101907f9835e583e3f8f1e4dfc48fe02a92fdbd9a76bc16eec83f3b1f70df2ffbc3b84a825286604082015260408152611021606082611b6a565b519020612283565b958684611d34565b1561189c57805f52600760205260405f20825f5260205260ff60405f20541661188d575f52600760205260405f20815f5260205260405f20600160ff1982541617905561107d82611bc5565b9061108b6040519283611b6a565b828252601f1961109a84611bc5565b015f5b81811061187c5750506110af83611bc5565b916110bd6040519384611b6a565b838352601f196110cc85611bc5565b013660208501376110dc84611bc5565b956110ea6040519788611b6a565b848752601f196110f986611bc5565b013660208901375f805b8287898b8983871061166757505050505090501561119d575f968794859392915b8785106111ac575050505050811561119d576009546001600160a01b0316948303838111611189577fcc50d873aa0e0708c11584529c18af24497ac00018c76faf48cb7a4c3396718f93608093604051938452602084015260408301526060820152a3005b634e487b7160e01b5f52601160045260245ffd5b638894779f60e01b5f5260045ffd5b90919293986111bc8a8986611c36565b6111c68180611c58565b6111d38d87949394611c0e565b51156115be57908c92916111fc602083016111f66111f18286611c9a565b611caf565b93611c9a565b508015801593906115b45761122060606112168484611e80565b0135955b8b611c0e565b519161122b81611bdc565b5f5b8281106115945750611241848385886122a9565b9061153d57505f94919392916001600160a01b031690505b8385106112e257505050505091600192918392611281575b50019901925b9190939293611124565b7fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb901606060206112d36040516112b68382611b6a565b5f81525f3681376040519384938985528401526060830190611a36565b5f60408301520390a28c611271565b90919293809d6112fd6112f6838887611e9b565b9286611c0e565b5190835f52600860205260405f20825f5260205260405f20600160ff19825416179055815f52600460205260405f20833581556020840135600182015560408401358060028301556060850135806003840155600483016113616080880188611ebd565b906001600160401b0382116106015761137a8354611a96565b601f81116114f8575b505f90601f831160011461148e5760079695949392915f9183611483575b50508160011b915f199060031b1c19161790555b60a08701359283600582015560e060c08901359889600684015501359485910155815f52600560205260405f20905f5260205260405f20958654956801000000000000000087101561060157611413876001998a809a018155611d04565b819291549060031b91821b915f19901b1916179055815f52600f60205260405f20835f5260205260405f20905f5260205260405f20611453848254611c8d565b90555f52601060205260405f20905f5260205261147560405f20918254611c8d565b9055019d0193929190611259565b013590505f806113a1565b601f19831691845f5260205f20925f5b8181106114e0575091600193918560079a9998979694106114c7575b505050811b0190556113b5565b01355f19600384901b60f8161c191690555f80806114ba565b9193602060018192878701358155019501920161149e565b835f5260205f20601f840160051c81019160208510611533575b601f0160051c01905b8181106115285750611383565b5f815560010161151b565b9091508190611512565b9350935050506001949d9392611558575b5050500192611277565b7fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb901916115896040519283928361212d565b0390a28b808061154e565b806115a26001928587611e9b565b356115ad8285611c0e565b520161122d565b6112205f9561121a565b8091509b929b6115d4575b505060010192611277565b60606115e08284611e80565b0135916115ec82611bdc565b915f5b81811061164757505050907fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb901839260ff61162b60019688611c0e565b51169061163d6040519283928361212d565b0390a2908b6115c9565b806116556001928486611e9b565b356116608287611c0e565b52016115ef565b6116ba6116b46116ae8960206116a561169c838b6116966111f18f848461168d92611c36565b87810190611c9a565b9d611c36565b82810190611c9a565b0135978c611c36565b80611c58565b90611eef565b1561180657505050506116d16116ae848a87611c36565b916116db83611bdc565b926001600160a01b03909116905f5b81811061176657505050506116ff8386611c0e565b5261170a8285611c0e565b5061172b8861171a848a87611c36565b6117248588611c0e565b5190611f31565b929061174e575b6001919260ff611742838d611c0e565b91169052015b90611103565b600180928161175d848b611c0e565b52019150611732565b806117746001928487611e9b565b60405160e060208201927fa1d8d8a9fe7a1cd934efad85a30531d6a5706082c92aec323624ec869a921e8a845260208101356040840152604081013560608401526060810135608084015260a081013560a084015260c081013560c0840152013560e08201528561010082015261010081526117f261012082611b6a565b5190206117ff8288611c0e565b52016116ea565b86946007611833875f5160206125e85f395f51905f52955f61182d60019c9d604098611c0e565b52611c0e565b52815194855260076020860152868060a01b031693a360405160206118588183611b6a565b5f8252505f36813761186a8287611c0e565b526118758186611c0e565b5001611748565b80606060208093870101520161109d565b6301654bf760e61b5f5260045ffd5b638baa579f60e01b5f5260045ffd5b638325596360e01b5f5260045ffd5b6305beb17160e11b5f5260045ffd5b6118e56001916118dd6116ae85898c611c36565b919050611c8d565b910190610f8f565b63613f4a1360e11b5f5260045ffd5b346101aa5760603660031901126101aa576004356024356044356001600160401b0381116101aa57611932903690600401611a06565b919061193d83611bdc565b915f5b8481101561198357600190865f52600f60205260405f20835f5260205260405f208160051b8501355f5260205260405f205461197c8287611c0e565b5201611940565b6119b38483885f52601060205260405f20905f5260205260405f2054604051928392604084526040840190611a36565b9060208301520390f35b346101aa575f3660031901126101aa5780601460209252f35b60609060031901126101aa57600435906024359060443590565b60409060031901126101aa576004359060243590565b9181601f840112156101aa578235916001600160401b0383116101aa576020808501948460051b0101116101aa57565b90602080835192838152019201905f5b818110611a535750505090565b8251845260209384019390920191600101611a46565b9181601f840112156101aa578235916001600160401b0383116101aa57602083818601950101116101aa57565b90600182811c92168015611ac4575b6020831014611ab057565b634e487b7160e01b5f52602260045260245ffd5b91607f1691611aa5565b5f9291815491611add83611a96565b8083529260018116908115611b325750600114611af957505050565b5f9081526020812093945091925b838310611b18575060209250010190565b600181602092949394548385870101520191019190611b07565b915050602093945060ff929192191683830152151560051b010190565b60e081019081106001600160401b0382111761060157604052565b90601f801991011681019081106001600160401b0382111761060157604052565b805180835260209291819084018484015e5f828201840152601f01601f1916010190565b600435906001600160a01b03821682036101aa57565b6001600160401b0381116106015760051b60200190565b90611be682611bc5565b611bf36040519182611b6a565b8281528092611c04601f1991611bc5565b0190602036910137565b8051821015611c225760209160051b010190565b634e487b7160e01b5f52603260045260245ffd5b9190811015611c225760051b81013590603e19813603018212156101aa570190565b903590601e19813603018212156101aa57018035906001600160401b0382116101aa57602001918160051b360383136101aa57565b9190820180921161118957565b903590605e19813603018212156101aa570190565b356001600160a01b03811681036101aa5790565b908060209392818452848401375f828201840152601f01601f1916010190565b91602091611cfc91959495604085526040850191611cc3565b931515910152565b8054821015611c22575f5260205f2001905f90565b6001600160401b03811161060157601f01601f191660200190565b92919091833b15611e2857915f9391611d848594611d766040519384926020840196630b135d3f60e11b88526024850152604060448501526064840191611cc3565b03601f198101835282611b6a565b51915afa3d15611e21573d611d9881611d19565b90611da66040519283611b6a565b81523d5f602083013e5b81611e15575b81611dbf575090565b80516020909101516001600160e01b03198116925060048210611df5575b50506001600160e01b031916630b135d3f60e11b1490565b6001600160e01b031960049290920360031b82901b161690505f80611ddd565b80516004149150611db6565b6060611db0565b9291611e3384611d19565b90611e416040519283611b6a565b84825236858401116101aa575f602086611e6f97611e669683870137840101526124ac565b909391936124e6565b6001600160a01b0391821691161490565b9015611c225780359060fe19813603018212156101aa570190565b9190811015611c225760051b8101359060fe19813603018212156101aa570190565b903590601e19813603018212156101aa57018035906001600160401b0382116101aa576020019181360383136101aa57565b905f5b818110611f0157505050600190565b6064611f1b611f11838587611e9b565b6080810190611ebd565b905011611f2a57600101611ef2565b5050505f90565b9190611f4c611f408480611c58565b94602081019150611c9a565b92611f5684611caf565b9360208101359282158015612123575b6120ed5760405160208101918260208251919201905f5b8181106120d75750505090611fa08161201295949303601f198101835282611b6a565b5190209561200a611fff60405160208101907fffa38b52b3794fa160256e68781327917915a9d4bded223f53d0414603dd37b8825260018060a01b0385169a8b604083015289606083015260808201526080815261102160a082611b6a565b926040810190611ebd565b929091611d34565b156120b157835f52600660205260405f20825f5260205260ff60405f20541661208b577fde9782b6ede4a1d22e2929e1f7757daf3be1d657007a7f02d7d02050721cf47891604091855f526006602052825f20825f52602052825f20600160ff1982541617905582519182526020820152a36001905f90565b5060405f5160206125e85f395f51905f5291815190815260036020820152a35f90600390565b5060405f5160206125e85f395f51905f5291815190815260026020820152a35f90600290565b8251845260209384019390920191600101611f7d565b505060408051928352600160208401526001600160a01b03909416935f5160206125e85f395f51905f5292909150a35f90600190565b5060148311611f66565b9060ff61214d6040929594955f8552606060208601526060850190611a36565b9416910152565b5f546001600160a01b03163303610d1857565b307f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316148061225a575b156121c2577f000000000000000000000000000000000000000000000000000000000000000090565b60405160208101907f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f82527f000000000000000000000000000000000000000000000000000000000000000060408201527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a082015260a0815261225460c082611b6a565b51902090565b507f00000000000000000000000000000000000000000000000000000000000000004614612199565b60429061228e612167565b906040519161190160f01b8352600283015260228201522090565b9291909260606122b98386611e80565b0135915f5b8181106122d1575050505050505f905f90565b6122dc818388611e9b565b6122e68287611c0e565b5185606083013503612409575f5b8381106123df575060018060a01b0385165f52600860205260405f20905f5260205260ff60405f2054166123d05760e0810135156123c15760c08101359081156123b1576040810135805f52600b60205260a060405f2092013591825f5260205260ff60405f205416156123a0575f52600e60205260405f20905f5260205260405f20905f5260205260ff60405f20541615612392576001016122be565b505050505050600190600690565b505050505050505050600190600590565b5050505050505050600190600490565b50505050505050600190600990565b50505050505050600190600890565b816123ea828a611c0e565b51146123f8576001016122f4565b505050505050505050600190600890565b5050505050505050600190600a90565b60ff811461245f5760ff811690601f8211612450576040519161243d604084611b6a565b6020808452838101919036833783525290565b632cd44ac360e21b5f5260045ffd5b5060405161247281610346816002611ace565b90565b60ff81146124995760ff811690601f8211612450576040519161243d604084611b6a565b5060405161247281610346816003611ace565b81519190604183036124dc576124d59250602082015190606060408401519301515f1a9061255a565b9192909190565b50505f9160029190565b600481101561254657806124f8575050565b6001810361250f5763f645eedf60e01b5f5260045ffd5b6002810361252a575063fce698f760e01b5f5260045260245ffd5b6003146125345750565b6335e2f38360e21b5f5260045260245ffd5b634e487b7160e01b5f52602160045260245ffd5b91907f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a084116125dc579160209360809260ff5f9560405194855216868401526040830152606082015282805260015afa156125d1575f516001600160a01b038116156125c757905f905f90565b505f906001905f90565b6040513d5f823e3d90fd5b5050505f916003919056fe1a27036f4eb7d046165dd3c2d29117a18b873fc3cc71b0c4320b65fbf51b4d2ba2646970667358221220e8de2016458276cf5146ff50506456db785069bd7fd373227cb446a60be8f3f164736f6c634300081e0033";
