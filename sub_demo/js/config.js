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
export const SUBVOTING_BYTECODE = "0x61018080604052346101d857602081612bd4803803809161002082856101dc565b8339810103126101d857516001600160a01b038116908190036101d8576040519061004c6040836101dc565b600982526020820168537562566f74696e6760b81b8152604051926100726040856101dc565b600184526020840192603160f81b845280156101c557600180546001600160a01b03199081169091555f8054918216831781556001600160a01b03909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a36100de81610213565b610120526100eb846103ae565b61014052519020918260e05251902080610100524660a0526040519060208201927f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f8452604083015260608201524660808201523060a082015260a0815261015460c0826101dc565b5190206080523060c05246610160526040516126ed90816104e78239608051816121b3015260a05181612270015260c0518161217d015260e051816122020152610100518161222801526101205181610d9b01526101405181610dc70152610160518181816104960152610e5a0152f35b631e4fbdf760e01b5f525f60045260245ffd5b5f80fd5b601f909101601f19168101906001600160401b038211908210176101ff57604052565b634e487b7160e01b5f52604160045260245ffd5b908151602081105f1461028d575090601f81511161024d57602081519101516020821061023e571790565b5f198260200360031b1b161790565b604460209160405192839163305a27a960e01b83528160048401528051918291826024860152018484015e5f828201840152601f01601f19168101030190fd5b6001600160401b0381116101ff57600254600181811c911680156103a4575b602082101461039057601f811161035d575b50602092601f82116001146102fc57928192935f926102f1575b50508160011b915f199060031b1c19161760025560ff90565b015190505f806102d8565b601f1982169360025f52805f20915f5b868110610345575083600195961061032d575b505050811b0160025560ff90565b01515f1960f88460031b161c191690555f808061031f565b9192602060018192868501518155019401920161030c565b60025f52601f60205f20910160051c810190601f830160051c015b81811061038557506102be565b5f8155600101610378565b634e487b7160e01b5f52602260045260245ffd5b90607f16906102ac565b908151602081105f146103d9575090601f81511161024d57602081519101516020821061023e571790565b6001600160401b0381116101ff57600354600181811c911680156104dc575b602082101461039057601f81116104a9575b50602092601f821160011461044857928192935f9261043d575b50508160011b915f199060031b1c19161760035560ff90565b015190505f80610424565b601f1982169360035f52805f20915f5b8681106104915750836001959610610479575b505050811b0160035560ff90565b01515f1960f88460031b161c191690555f808061046b565b91926020600181928685015181550194019201610458565b60035f52601f60205f20910160051c810190601f830160051c015b8181106104d1575061040a565b5f81556001016104c4565b90607f16906103f856fe60806040526004361015610011575f80fd5b5f3560e01c8063032e1a40146101fa5780630470ffc81461016e57806306407d72146101e65780630f70efa1146101f557806316c9a207146101f05780631a30ffa1146101eb5780632a08b5fe146101e65780632b38cd96146101e157806334ccc5ea146101dc578063574df932146101d757806360f57e80146101d2578063715018a6146101cd57806379ba5097146101c85780637b1c83b3146101c357806384b0196e146101be57806385e1f4d0146101b95780638da5cb5b146101b4578063b40f68ce146101af578063c00e0e25146101aa578063caa7c246146101a5578063dc5d0379146101a0578063e29dfba81461019b578063e30c397814610196578063e3a9db3214610191578063f2fde38b1461018c578063f698da2514610187578063f6de30b614610182578063f7feca8a1461017d578063faecef1514610178578063fd81654e146101735763ffbfdbbf1461016e575f80fd5b610233565b61147b565b61143e565b6113f0565b6113c8565b6113a6565b611330565b6112ed565b6112c5565b611277565b611158565b61111b565b6110a4565b610f5e565b610e7d565b610e43565b610d83565b610b9c565b610af9565b610a96565b610a58565b610a0a565b6109de565b610978565b61026c565b6108d9565b610410565b610323565b34610215575f36600319011261021557602060405160148152f35b5f80fd5b606090600319011261021557600435906024359060443590565b346102155761024136610219565b915f52600f60205260405f20905f5260205260405f20905f52602052602060405f2054604051908152f35b3461021557604036600319011261021557600435602435905f52601060205260405f20905f52602052602060405f2054604051908152f35b9181601f84011215610215578235916001600160401b038311610215576020808501948460051b01011161021557565b90602080835192838152019201905f5b8181106102f15750505090565b82518452602093840193909201916001016102e4565b92919061031e6020916040865260408601906102d4565b930152565b34610215576060366003190112610215576004356024356044356001600160401b038111610215576103599036906004016102a4565b9190610364836114d8565b915f5b848110156103aa57600190865f52600f60205260405f20835f5260205260405f208160051b8501355f5260205260405f20546103a3828761151e565b5201610367565b836103ce836103c1895f52601060205260405f2090565b905f5260205260405f2090565b54906103df60405192839283610307565b0390f35b9181601f84011215610215578235916001600160401b038311610215576020838186019501011161021557565b34610215576060366003190112610215576004356001600160401b038111610215576104409036906004016102a4565b90602435916044356001600160401b038111610215576104649036906004016103e3565b829391931561077b575f805b848210610757576107d0915011610748576009546001600160a01b0316908115610739577f0000000000000000000000000000000000000000000000000000000000000000460361072a576104d36104d7916104cb88611814565b9687856118fd565b1590565b61071b57846104e5916119d3565b6104ee826115b4565b6104f7836114d8565b610500846114d8565b915f5f5b8681106105a1575015610592578461051b94611e02565b8115610592576009547fcc50d873aa0e0708c11584529c18af24497ac00018c76faf48cb7a4c3396718f9361058d9161055e906001600160a01b0316938261161f565b6040805198895260208901959095529387015260608601929092526001600160a01b0316939081906080820190565b0390a3005b638894779f60e01b5f5260045ffd5b908686896106006104d36105fa6105f4886105d26105cd6105c3838b8b611537565b60208101906115fd565b611612565b9760206105ec6105e384848c611537565b828101906115fd565b013597611537565b80611559565b90611a99565b61069d57505061061e906106186105f4858b8b611537565b90611adb565b610628838561151e565b52610633828461151e565b5061065488610643848a8a611537565b61064d858761151e565b5190611b87565b929061067a575b6106746001929361066c838961151e565b9060ff169052565b01610504565b6106746001809361069461068e858a61151e565b60019052565b0192505061065b565b5f5160206126985f395f51905f526106f486945f6106be600198998c61151e565b526106d26106cc878d61151e565b60079052565b604051918291888060a01b031695826020600791939293604081019481520152565b0390a36106ff6114bd565b610709828661151e565b52610714818561151e565b5001610504565b638baa579f60e01b5f5260045ffd5b638325596360e01b5f5260045ffd5b63d92e233d60e01b5f5260045ffd5b6305beb17160e11b5f5260045ffd5b61077360019161076b6105f4858989611537565b9190506115a2565b910190610470565b63613f4a1360e11b5f5260045ffd5b90600182811c921680156107b8575b60208310146107a457565b634e487b7160e01b5f52602260045260245ffd5b91607f1691610799565b5f92918154916107d18361078a565b808352926001811690811561082657506001146107ed57505050565b5f9081526020812093945091925b83831061080c575060209250010190565b6001816020929493945483858701015201910191906107fb565b915050602093945060ff929192191683830152151560051b010190565b634e487b7160e01b5f52604160045260245ffd5b60e081019081106001600160401b0382111761087257604052565b610843565b90601f801991011681019081106001600160401b0382111761087257604052565b906108b36108ac92604051938480926107c2565b0383610877565b565b805180835260209291819084018484015e5f828201840152601f01601f1916010190565b3461021557604036600319011261021557600435602435905f52600a60205260405f20905f526020526103df61091b61092260405f20604051928380926107c2565b0382610877565b6040519182916020835260208301906108b5565b9491926109699360e0979a99989592875260208701526040860152606085015261010060808501526101008401906108b5565b9560a083015260c08201520152565b34610215576020366003190112610215576004355f52600460205260405f2080546103df60018301549260028101549060038101546040516109c18161091b81600487016107c2565b600583015491600760068501549401549460405198899889610936565b34610215575f36600319011261021557602060405160648152f35b6001600160a01b0381160361021557565b3461021557604036600319011261021557600435610a27816109f9565b6024359060018060a01b03165f52600760205260405f20905f52602052602060ff60405f2054166040519015158152f35b3461021557610a6636610219565b915f52600e60205260405f20905f5260205260405f20905f52602052602060ff60405f2054166040519015158152f35b34610215575f36600319011261021557610aae612167565b600180546001600160a01b03199081169091555f80549182168155906001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a3005b34610215575f36600319011261021557600154336001600160a01b0390911603610b6b57600180546001600160a01b03199081169091555f805433928116831782556001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a3005b63118cdaa760e01b5f523360045260245ffd5b60643590811515820361021557565b60843590811515820361021557565b34610215576080366003190112610215576004356024356044356001600160401b03811161021557610bd29036906004016103e3565b610bdd939193610b7e565b93610be6612167565b8115610d7457825f52600a60205260405f20845f5260205260405f20946001600160401b03831161087257610c2583610c1f885461078a565b8861162c565b5f95601f8411600114610ce5579061058d91610c7a85807fc9c1ae0a6fb65b3fc44b61a6cc769977fca4a7e8543caa636a406f35d1efd4b398999a5f91610cda575b508160011b915f199060031b1c19161790565b90555b610ca881610c97896103c18a5f52600b60205260405f2090565b9060ff801983541691151516179055565b610cce610cc1886103c1895f52600c60205260405f2090565b805460ff19166001179055565b60405193849384611763565b90508601355f610c67565b601f198416610cf7825f5260205f2090565b905f5b818110610d5c5750907fc9c1ae0a6fb65b3fc44b61a6cc769977fca4a7e8543caa636a406f35d1efd4b39697988661058d95949310610d43575b5050600185811b019055610c7d565b8501355f19600388901b60f8161c191690555f80610d34565b858a013583556020998a019960019093019201610cfa565b63af943d0360e01b5f5260045ffd5b34610215575f36600319011261021557610e15610dbf7f00000000000000000000000000000000000000000000000000000000000000006124a6565b6103df610deb7f00000000000000000000000000000000000000000000000000000000000000006124ff565b610e23610df66114bd565b91604051958695600f60f81b875260e0602088015260e08701906108b5565b9085820360408701526108b5565b904660608501523060808501525f60a085015283820360c08501526102d4565b34610215575f3660031901126102155760206040517f00000000000000000000000000000000000000000000000000000000000000008152f35b34610215575f366003190112610215575f546040516001600160a01b039091168152602090f35b602081016020825282518091526040820191602060408360051b8301019401925f915b838310610ed657505050505090565b9091929394602080600192603f198582030186528851908151815282820151838201526040820151604082015260c080610f49610f37610f25606087015160e0606088015260e08701906108b5565b608087015186820360808801526108b5565b60a086015185820360a08701526108b5565b93015191015297019301930191939290610ec7565b3461021557604036600319011261021557610f8a6004356103c1602435915f52600560205260405f2090565b8054610f9581611784565b915f5b828110610fad57604051806103df8682610ea4565b80610fd8610fca610fc0600194866117ff565b90549060031b1c90565b5f52600460205260405f2090565b828101549061107e60028201549161107460038201549161106a6004611006875f52600a60205260405f2090565b9261104861103761102460058401548097905f5260205260405f2090565b956103c18b5f52600d60205260405f2090565b60068301545f5260205260405f2090565b95600782015498611057611497565b9a8b5260208b015260408a015201610898565b6060870152610898565b6080850152610898565b60a083015260c0820152611092828761151e565b5261109d818661151e565b5001610f98565b34610215576020366003190112610215576004356110c1816109f9565b6110c9612167565b6001600160a01b0316801561073957600980546001600160a01b0319811683179091556001600160a01b03167f7b430a84222a519230743a1a600e19cbaf3386e1074a55b0ae7bedf74419406c5f80a3005b3461021557604036600319011261021557600435602435905f52600b60205260405f20905f52602052602060ff60405f2054166040519015158152f35b346102155760a0366003190112610215576044356024356004356064356001600160401b038111610215576111919036906004016103e3565b9061119a610b8d565b6111a2612167565b835f52600c6020526111cc6104d36111c58760405f20905f5260205260405f2090565b5460ff1690565b61125e578215610d7457851561124a579061124583926112277f85c66a91133fbeb8288b2279a45826b22de8a7146c961451a200ce916a1b3c5095846112228b6103c18c6103c18d5f52600d60205260405f2090565b61167b565b610cce81610c978a6103c18b6103c18c5f52600e60205260405f2090565b0390a4005b63768d03e960e11b5f52600486905260245ffd5b63276b620160e01b5f526004849052602485905260445ffd5b3461021557604036600319011261021557600435611294816109f9565b6024359060018060a01b03165f52600860205260405f20905f52602052602060ff60405f2054166040519015158152f35b34610215575f366003190112610215576001546040516001600160a01b039091168152602090f35b34610215576112fb36610219565b915f52600d60205260405f20905f5260205260405f20905f526020526103df61091b61092260405f20604051928380926107c2565b346102155760203660031901126102155760043561134d816109f9565b611355612167565b60018060a01b0316806bffffffffffffffffffffffff60a01b600154161760015560018060a01b035f54167f38d16b8cac22d99fc7c124b9cd0de2d3fa1faef420bfe791d8c362d765e227005f80a3005b34610215575f3660031901126102155760206113c061217a565b604051908152f35b34610215575f366003190112610215576009546040516001600160a01b039091168152602090f35b346102155760403660031901126102155760043561140d816109f9565b6024359060018060a01b03165f52600660205260405f20905f52602052602060ff60405f2054166040519015158152f35b3461021557604036600319011261021557600435602435905f52600c60205260405f20905f52602052602060ff60405f2054166040519015158152f35b34610215575f3660031901126102155760206040516107d08152f35b604051906108b360e083610877565b6001600160401b0381116108725760051b60200190565b604051906114cc602083610877565b5f808352366020840137565b906114e2826114a6565b6114ef6040519182610877565b8281528092611500601f19916114a6565b0190602036910137565b634e487b7160e01b5f52603260045260245ffd5b80518210156115325760209160051b010190565b61150a565b91908110156115325760051b81013590603e1981360301821215610215570190565b903590601e198136030182121561021557018035906001600160401b03821161021557602001918160051b3603831361021557565b634e487b7160e01b5f52601160045260245ffd5b919082018092116115af57565b61158e565b906115be826114a6565b6115cb6040519182610877565b82815280926115dc601f19916114a6565b01905f5b8281106115ec57505050565b8060606020809385010152016115e0565b903590605e1981360301821215610215570190565b3561161c816109f9565b90565b919082039182116115af57565b601f821161163957505050565b5f5260205f20906020601f840160051c83019310611671575b601f0160051c01905b818110611666575050565b5f815560010161165b565b9091508190611652565b9092916001600160401b038111610872576116a08161169a845461078a565b8461162c565b5f601f82116001146116de5781906116cf9394955f926116d3575b50508160011b915f199060031b1c19161790565b9055565b013590505f806116bb565b601f198216946116f1845f5260205f2090565b915f5b87811061172b575083600195969710611712575b505050811b019055565b01355f19600384901b60f8161c191690555f8080611708565b909260206001819286860135815501940191016116f4565b908060209392818452848401375f828201840152601f01601f1916010190565b9160209161177c91959495604085526040850191611743565b931515910152565b9061178e826114a6565b61179b6040519182610877565b82815280926117ac601f19916114a6565b01905f5b8281106117bc57505050565b6020906040516117cb81610857565b5f81525f838201525f604082015260608082015260606080820152606060a08201525f60c0820152828285010152016117b0565b8054821015611532575f5260205f2001905f90565b61161c9060405160208101917f9835e583e3f8f1e4dfc48fe02a92fdbd9a76bc16eec83f3b1f70df2ffbc3b84a8352604082015260408152611857606082610877565b519020612296565b6001600160401b03811161087257601f01601f191660200190565b60409061161c949281528160208201520191611743565b3d156118bb573d906118a28261185f565b916118b06040519384610877565b82523d5f602084013e565b606090565b80516020909101516001600160e01b03198116929190600482106118e2575050565b6001600160e01b031960049290920360031b82901b16169150565b929091833b1561198857915f939161193f85946119316040519384926020840196630b135d3f60e11b88526024850161187a565b03601f198101835282610877565b51915afa61194b611891565b8161197c575b8161195a575090565b630b135d3f60e11b91506001600160e01b031990611977906118c0565b161490565b80516004149150611951565b916119928261185f565b916119a06040519384610877565b8083523681850111610215576020815f926119c29683870137840101526122bc565b6001600160a01b0390811691161490565b60018060a01b0316805f52600760205260405f20825f5260205260ff60405f205416611a1b575f52600760205260405f20905f5260205260405f20600160ff19825416179055565b6301654bf760e61b5f5260045ffd5b90156115325780359060fe1981360301821215610215570190565b91908110156115325760051b8101359060fe1981360301821215610215570190565b903590601e198136030182121561021557018035906001600160401b0382116102155760200191813603831361021557565b905f5b818110611aab57505050600190565b6064611ac5611abb838587611a45565b6080810190611a67565b905011611ad457600101611a9c565b5050505f90565b909291611ae7846114d8565b935f5b818110611af75750505050565b80610100611b086001938588611a45565b602081013590604081013590606081013560a08201359060e060c084013593013593604051957fa1d8d8a9fe7a1cd934efad85a30531d6a5706082c92aec323624ec869a921e8a8752602087015260408601526060850152608084015260a083015260c08201528560e082015220611b80828961151e565b5201611aea565b919091611ba3611b978280611559565b926020810191506115fd565b90611bad82611612565b9160208101359482158015611d1d575b611ce757611bf291611beb611be08360206104d3955160051b91012089886122d2565b916040810190611a67565b91866118fd565b611cb357611c176111c5856103c18560018060a01b03165f52600660205260405f2090565b611c7f5781611c5e610cc1866103c17fde9782b6ede4a1d22e2929e1f7757daf3be1d657007a7f02d7d02050721cf4789660018060a01b03165f52600660205260405f2090565b6040805195865260208601929092526001600160a01b031693a36001905f90565b5060408051938452600360208501526001600160a01b0391909116925f5160206126985f395f51905f529190a35f90600390565b5060408051938452600260208501526001600160a01b0391909116925f5160206126985f395f51905f529190a35f90600290565b505060408051948552600160208601526001600160a01b0392909216935f5160206126985f395f51905f52929150a35f90600190565b5060148311611bbd565b9060ff611d476040929594955f85526060602086015260608501906102d4565b9416910152565b9060e060079180358455602081013560018501556040810135600285015560608101356003850155611d90611d866080830183611a67565b906004870161167b565b60a0810135600585015560c081013560068501550135910155565b80546801000000000000000081101561087257611dcd916001820181556117ff565b819291549060031b91821b915f19901b1916179055565b9190604061031e5f92600186526060602087015260608601906102d4565b94929091945f955f955f945b808610611e1d57505050505050565b909192939496611e2e888387611537565b611e388180611559565b90611e4f6104d3611e498d8c61151e565b51151590565b6120b857611e6d60208401611e676105cd82876115fd565b946115fd565b508115801592906120b1576060611e848284611a2a565b0135935b611e928d8a61151e565b5190611e9d836114d8565b5f5b8481106120915750611eb383858785612329565b9061203a5750509291905f935b828510611f2a57505050505091600192918392611ee9575b50019701935b929190949394611e0e565b7fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb901611f21611f156114bd565b60405191829182611de4565b0390a25f611ed8565b909192939e8f6001918161202c612024611f50611f4987968b8d611a45565b938961151e565b5192611f73610cc1856103c18b60018060a01b03165f52600860205260405f2090565b611f8e81611f89865f52600460205260405f2090565b611d4e565b611fc2604082013594611fbd611fac875f52600560205260405f2090565b60608501355f5260205260405f2090565b611dab565b6103c160e082013594612009611fe0825f52600f60205260405f2090565b9360c0611ffa60a08301358097905f5260205260405f2090565b9101355f5260205260405f2090565b6120148782546115a2565b90555f52601060205260405f2090565b9182546115a2565b9055019f0193929190611ec0565b9350935050506001949b9392612055575b5050500193611ede565b7fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb9019161208660405192839283611d27565b0390a25f808061204b565b8061209f6001928789611a45565b356120aa828561151e565b5201611e9f565b5f93611e88565b9150809992996120ce575b505060010193611ede565b60606120da8284611a2a565b0135916120e6826114d8565b915f5b81811061214757505050907fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb901839261212d6121266001968961151e565b5160ff1690565b9061213d60405192839283611d27565b0390a2905f6120c3565b806121556001928486611a45565b35612160828761151e565b52016120e9565b5f546001600160a01b03163303610b6b57565b307f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316148061226d575b156121d5577f000000000000000000000000000000000000000000000000000000000000000090565b60405160208101907f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f82527f000000000000000000000000000000000000000000000000000000000000000060408201527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a082015260a0815261226760c082610877565b51902090565b507f000000000000000000000000000000000000000000000000000000000000000046146121ac565b6042906122a161217a565b906040519161190160f01b8352600283015260228201522090565b61161c916122c991612536565b9092919261258e565b9061161c926040519160208301937fffa38b52b3794fa160256e68781327917915a9d4bded223f53d0414603dd37b8855260018060a01b03166040840152606083015260808201526080815261185760a082610877565b9291909260606123398386611a2a565b0135915f5b818110612351575050505050505f905f90565b61235c818388611a45565b612366828761151e565b5185606083013503612496575f5b83811061246c57506001600160a01b0385165f9081526008602052604090206123a0916111c5916103c1565b61245d5760e08101351561244e5760c081013590811561243e576040810135906123ef6104d36111c560a06123dd865f52600b60205260405f2090565b9401358094905f5260205260405f2090565b61242d57612413926103c16111c5926103c16104d3955f52600e60205260405f2090565b61241f5760010161233e565b505050505050600190600690565b505050505050505050600190600590565b5050505050505050600190600490565b50505050505050600190600990565b50505050505050600190600890565b81612477828a61151e565b511461248557600101612374565b505050505050505050600190600890565b5050505050505050600190600a90565b60ff81146124ec5760ff811690601f82116124dd57604051916124ca604084610877565b6020808452838101919036833783525290565b632cd44ac360e21b5f5260045ffd5b5060405161161c8161091b8160026107c2565b60ff81146125235760ff811690601f82116124dd57604051916124ca604084610877565b5060405161161c8161091b8160036107c2565b81519190604183036125665761255f9250602082015190606060408401519301515f1a9061260a565b9192909190565b50505f9160029190565b6004111561257a57565b634e487b7160e01b5f52602160045260245ffd5b61259781612570565b806125a0575050565b6125a981612570565b600181036125c05763f645eedf60e01b5f5260045ffd5b6125c981612570565b600281036125e4575063fce698f760e01b5f5260045260245ffd5b806125f0600392612570565b146125f85750565b6335e2f38360e21b5f5260045260245ffd5b91907f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0841161268c579160209360809260ff5f9560405194855216868401526040830152606082015282805260015afa15612681575f516001600160a01b0381161561267757905f905f90565b505f906001905f90565b6040513d5f823e3d90fd5b5050505f916003919056fe1a27036f4eb7d046165dd3c2d29117a18b873fc3cc71b0c4320b65fbf51b4d2ba2646970667358221220cae9af54f6fd032cfa40dc0dfee1660f46425a775edf1d004faff1eba8493db064736f6c634300081e0033";
