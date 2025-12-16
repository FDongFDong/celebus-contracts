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
  try {
    const response = await fetch('./SubVoting-abi.json');
    ABI_DATA = await response.json();
    return ABI_DATA;
  } catch (e) {
    console.warn('ABI 파일 로드 실패, 내장 ABI 사용:', e);
    return CONFIG.ABI;
  }
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
    "name": "MAX_OPTION_ID",
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
    "name": "batchNonce",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
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
    "name": "getOptionList",
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
        "type": "tuple[]",
        "internalType": "struct SubVoting.OptionInfo[]",
        "components": [
          {
            "name": "optionId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "optionText",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "votes",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "allowed",
            "type": "bool",
            "internalType": "bool"
          }
        ]
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
      }
    ],
    "outputs": [
      {
        "name": "optionVotes",
        "type": "uint256[11]",
        "internalType": "uint256[11]"
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
    "name": "getQuestionWithOptions",
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
        "type": "tuple",
        "internalType": "struct SubVoting.QuestionInfo",
        "components": [
          {
            "name": "questionText",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "questionAllowed",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "options",
            "type": "tuple[]",
            "internalType": "struct SubVoting.OptionInfo[]",
            "components": [
              {
                "name": "optionId",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "optionText",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "votes",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "allowed",
                "type": "bool",
                "internalType": "bool"
              }
            ]
          },
          {
            "name": "totalVotes",
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
    "name": "getVoteByHash",
    "inputs": [
      {
        "name": "voteHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct SubVoting.VoteRecord",
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
    "name": "getVotesByMissionVotingId",
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
    "name": "questionStats",
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
        "name": "total",
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
    "name": "setBatchNonce",
    "inputs": [
      {
        "name": "newNonce",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
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
    "name": "setUserNonce",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "newNonce",
        "type": "uint256",
        "internalType": "uint256"
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
    "name": "userNonce",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
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
    "name": "SetBatchNonce",
    "inputs": [
      {
        "name": "executorSigner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newNonce",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SetUserNonce",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newNonce",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
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
    "type": "error",
    "name": "BadChain",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BatchNonceInvalid",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BatchNonceTooLow",
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
    "name": "UserNonceTooLow",
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
    4: { name: 'INVALID_OPTION_ID', message: 'optionId 범위 오류 (0 또는 10 초과)', alert: true },
    5: { name: 'QUESTION_NOT_ALLOWED', message: '허용되지 않은 질문 (비활성화된 질문)', alert: true },
    6: { name: 'OPTION_NOT_ALLOWED', message: '허용되지 않은 옵션 (비활성화된 선택지)', alert: true },
    7: { name: 'STRING_TOO_LONG', message: '문자열 길이 초과 (userId > 100자)', alert: true }
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
    optionId: 1,    // SubVoting용 옵션 ID (1~10)
    votingAmt: 100
  },

  // Limits
  MAX_RECORDS_PER_BATCH: 20,
  MAX_RECORDS_PER_USER: 20,
  MAX_OPTION_ID: 10, // optionId는 1~10만 허용

  // UI Messages
  MESSAGES: {
    userIdNote: '[참고] 실제 환경에서는 백엔드가 지갑 주소로 DB에서 userId를 조회하여 자동 설정합니다',
    signatureExplanation: 'EIP-712 구조화된 데이터 서명을 사용합니다',
    backendNote: '[TIP] 백엔드는 모든 사용자의 서명을 수집한 후 배치로 컨트랙트에 제출합니다'
  }
};

// Utility function to get current contract instance
export function getContractInstance(signer, contractAddress) {
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
export const SUBVOTING_BYTECODE = "0x61018080604052346101d857602081612bca803803809161002082856101dc565b8339810103126101d857516001600160a01b038116908190036101d8576040519061004c6040836101dc565b600982526020820168537562566f74696e6760b81b8152604051926100726040856101dc565b600184526020840192603160f81b845280156101c557600180546001600160a01b03199081169091555f8054918216831781556001600160a01b03909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a36100de81610213565b610120526100eb846103ae565b61014052519020918260e05251902080610100524660a0526040519060208201927f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f8452604083015260608201524660808201523060a082015260a0815261015460c0826101dc565b5190206080523060c05246610160526040516126e390816104e7823960805181612294015260a05181612351015260c0518161225e015260e051816122e301526101005181612309015261012051816109bb015261014051816109e70152610160518181816109800152610f5b0152f35b631e4fbdf760e01b5f525f60045260245ffd5b5f80fd5b601f909101601f19168101906001600160401b038211908210176101ff57604052565b634e487b7160e01b5f52604160045260245ffd5b908151602081105f1461028d575090601f81511161024d57602081519101516020821061023e571790565b5f198260200360031b1b161790565b604460209160405192839163305a27a960e01b83528160048401528051918291826024860152018484015e5f828201840152601f01601f19168101030190fd5b6001600160401b0381116101ff57600254600181811c911680156103a4575b602082101461039057601f811161035d575b50602092601f82116001146102fc57928192935f926102f1575b50508160011b915f199060031b1c19161760025560ff90565b015190505f806102d8565b601f1982169360025f52805f20915f5b868110610345575083600195961061032d575b505050811b0160025560ff90565b01515f1960f88460031b161c191690555f808061031f565b9192602060018192868501518155019401920161030c565b60025f52601f60205f20910160051c810190601f830160051c015b81811061038557506102be565b5f8155600101610378565b634e487b7160e01b5f52602260045260245ffd5b90607f16906102ac565b908151602081105f146103d9575090601f81511161024d57602081519101516020821061023e571790565b6001600160401b0381116101ff57600354600181811c911680156104dc575b602082101461039057601f81116104a9575b50602092601f821160011461044857928192935f9261043d575b50508160011b915f199060031b1c19161760035560ff90565b015190505f80610424565b601f1982169360035f52805f20915f5b8681106104915750836001959610610479575b505050811b0160035560ff90565b01515f1960f88460031b161c191690555f808061046b565b91926020600181928685015181550194019201610458565b60035f52601f60205f20910160051c810190601f830160051c015b8181106104d1575061040a565b5f81556001016104c4565b90607f16906103f856fe60c0806040526004361015610012575f80fd5b5f3560e01c908163032e1a4014611aef5750806316c9a20714610eb35780631a30ffa114610e845780632b38cd9614610df457806334ccc5ea14610dd9578063574df93214610d9057806360f57e8014610d52578063715018a614610cef5780637641bf0214610cd457806379ba509714610c4f5780637b1c83b314610a7057806384b0196e146109a357806385e1f4d0146109695780638b391c0a146108c75780638da5cb5b146108a0578063b40f68ce1461065d578063b656f4041461062b578063c00e0e25146105a9578063caa7c24614610575578063dc5d037914610337578063e29dfba8146102ee578063e30c3978146102c6578063e3a9db3214610275578063f2fde38b14610203578063f698da25146101e1578063f6de30b6146101b9578063f7feca8a146101705763fd81654e14610150575f80fd5b3461016c575f36600319011261016c5760206040516107d08152f35b5f80fd5b3461016c57604036600319011261016c576001600160a01b03610191611c83565b165f52600660205260405f206024355f52602052602060ff60405f2054166040519015158152f35b3461016c575f36600319011261016c576009546040516001600160a01b039091168152602090f35b3461016c575f36600319011261016c5760206101fb61225b565b604051908152f35b3461016c57602036600319011261016c5761021c611c83565b610224612248565b60018060a01b0316806bffffffffffffffffffffffff60a01b600154161760015560018060a01b035f54167f38d16b8cac22d99fc7c124b9cd0de2d3fa1faef420bfe791d8c362d765e227005f80a3005b3461016c5761028336611c99565b915f52600c60205260405f20905f5260205260405f20905f526020526102c26102ae60405f20611bbf565b604051918291602083526020830190611c5f565b0390f35b3461016c575f36600319011261016c576001546040516001600160a01b039091168152602090f35b3461016c57604036600319011261016c576001600160a01b0361030f611c83565b165f52600860205260405f206024355f52602052602060ff60405f2054166040519015158152f35b3461016c5760a036600319011261016c576044356024356004356064356001600160401b03811161016c57610370903690600401611b08565b90608435801515810361016c57610385612248565b8515801561056b575b61055857835f52600c60205260405f20855f5260205260405f20865f5260205260405f206001600160401b038411610544576103ca8154611b4b565b601f81116104ff575b505f601f8511600114610475579161046591857f85c66a91133fbeb8288b2279a45826b22de8a7146c961451a200ce916a1b3c509695945f9161046a575b508560011b905f198760031b1c19161790555b855f52600d60205260405f20875f5260205260405f20885f526020526104598160405f209060ff801983541691151516179055565b60405193849384611df0565b0390a4005b90508401358a610411565b601f19851690825f5260205f20915f5b8181106104e75750916104659391877f85c66a91133fbeb8288b2279a45826b22de8a7146c961451a200ce916a1b3c5098979694106104ce575b5050600185811b019055610424565b8501355f19600388901b60f8161c1916905589806104bf565b9192602060018192868a013581550194019201610485565b815f5260205f20601f860160051c8101916020871061053a575b601f0160051c01905b81811061052f57506103d3565b5f8155600101610522565b9091508190610519565b634e487b7160e01b5f52604160045260245ffd5b8563768d03e960e11b5f5260045260245ffd5b50600a861161038e565b3461016c5761058336611b35565b905f52600b60205260405f20905f52602052602060ff60405f2054166040519015158152f35b3461016c57602036600319011261016c576105c2611c83565b6105ca612248565b6001600160a01b0316801561061c57600980546001600160a01b0319811683179091556001600160a01b03167f7b430a84222a519230743a1a600e19cbaf3386e1074a55b0ae7bedf74419406c5f80a3005b63d92e233d60e01b5f5260045ffd5b3461016c5761063936611b35565b905f52600e60205260405f20905f526020526020600b60405f200154604051908152f35b3461016c5761066b36611b35565b905f52600560205260405f20905f5260205260405f20805461068c81611d4a565b9161069a6040519384611b9e565b818352601f196106a983611d4a565b015f5b81811061085d5750505f5b82811061078057836040518091602082016020835281518091526040830190602060408260051b8601019301915f905b8282106106f657505050500390f35b919360019193955060208091603f198982030185528751908151815282820151838201526040820151604082015260c08061076a610758610746606087015160e0606088015260e0870190611c5f565b60808701518682036080880152611c5f565b60a086015185820360a0870152611c5f565b93015191015296019201920185949391926106e7565b8061078d60019284611e11565b90549060031b1c5f52600460205260405f20828101549061083760028201549161082d600382015491845f52600a602052610823600460405f2092600581015493845f5260205260405f2093885f52600c60205260405f20905f5260205260405f2060068201545f5260205260405f20956007820154986040519a6108118c611b83565b8b5260208b015260408a015201611bbf565b6060870152611bbf565b6080850152611bbf565b60a083015260c082015261084b8287611d8a565b526108568186611d8a565b50016106b7565b60209060405161086c81611b83565b5f81525f838201525f604082015260608082015260606080820152606060a08201525f60c0820152828288010152016106ac565b3461016c575f36600319011261016c575f546040516001600160a01b039091168152602090f35b3461016c576108d536611b35565b61016091826040516108e78282611b9e565b3690375f52600e60205260405f20905f5260205260405f2090600b82015460405192835f905b600b8210610953575050506109228284611b9e565b604051915f835b600b821061093d5750506101809350820152f35b6020806001928851815201960191019094610929565b600160208192855481520193019101909161090d565b3461016c575f36600319011261016c5760206040517f00000000000000000000000000000000000000000000000000000000000000008152f35b3461016c575f36600319011261016c57610a426109df7f000000000000000000000000000000000000000000000000000000000000000061239d565b6102c2610a0b7f000000000000000000000000000000000000000000000000000000000000000061249a565b610a5060405191610a1d602084611b9e565b5f83525f368137604051958695600f60f81b875260e0602088015260e0870190611c5f565b908582036040870152611c5f565b904660608501523060808501525f60a085015283820360c0850152611cb3565b3461016c57608036600319011261016c576004356024356044356001600160401b03811161016c57610aa6903690600401611b08565b6064359391841515850361016c57610abc612248565b825f52600a60205260405f20845f5260205260405f20946001600160401b03831161054457610aeb8654611b4b565b601f8111610c0a575b505f95601f8411600114610b815790610b7191847fc9c1ae0a6fb65b3fc44b61a6cc769977fca4a7e8543caa636a406f35d1efd4b39697985f91610b76575b508560011b905f198760031b1c19161790555b855f52600b60205260405f20875f526020526104598160405f209060ff801983541691151516179055565b0390a3005b905084013589610b33565b601f198416815f5260205f20905f5b818110610bf25750907fc9c1ae0a6fb65b3fc44b61a6cc769977fca4a7e8543caa636a406f35d1efd4b396979886610b7195949310610bd9575b5050600185811b019055610b46565b8501355f19600388901b60f8161c191690558880610bca565b858a013583556020998a019960019093019201610b90565b865f5260205f20601f850160051c81019160208610610c45575b601f0160051c01905b818110610c3a5750610af4565b5f8155600101610c2d565b9091508190610c24565b3461016c575f36600319011261016c57600154336001600160a01b0390911603610cc157600180546001600160a01b03199081169091555f805433928116831782556001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a3005b63118cdaa760e01b5f523360045260245ffd5b3461016c575f36600319011261016c576020604051600a8152f35b3461016c575f36600319011261016c57610d07612248565b600180546001600160a01b03199081169091555f80549182168155906001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a3005b3461016c57610d6036611c99565b915f52600d60205260405f20905f5260205260405f20905f52602052602060ff60405f2054166040519015158152f35b3461016c57604036600319011261016c576001600160a01b03610db1611c83565b165f52600760205260405f206024355f52602052602060ff60405f2054166040519015158152f35b3461016c575f36600319011261016c57602060405160648152f35b3461016c57602036600319011261016c576004355f52600460205260405f2080546001820154916002810154600382015491610e70610e3560048301611bbf565b600583015494600760068501549401549460405198899889526020890152604088015260608701526101006080870152610100860190611c5f565b9260a085015260c084015260e08301520390f35b3461016c57610e9236611b35565b905f52600a60205260405f20905f526020526102c26102ae60405f20611bbf565b3461016c57606036600319011261016c576004356001600160401b03811161016c573660238201121561016c5780600401356080526001600160401b036080511161016c5736602460805160051b8301011161016c576044356001600160401b03811161016c57610f28903690600401611b08565b60805115611ae0575f805b6080518210611ab7576107d0915011611aa8576009546001600160a01b031690811561061c577f00000000000000000000000000000000000000000000000000000000000000004603611a9957610fd990610fd160405160208101907f9835e583e3f8f1e4dfc48fe02a92fdbd9a76bc16eec83f3b1f70df2ffbc3b84a8252602435604082015260408152610fc9606082611b9e565b519020612377565b938484611e41565b15611a8a57805f52600760205260405f206024355f5260205260ff60405f205416611a7b575f52600760205260405f206024355f5260205260405f20600160ff1982541617905561102b608051611d4a565b916110396040519384611b9e565b6080518352601f1961104c608051611d4a565b015f5b818110611a6a575050611063608051611d4a565b6110706040519182611b9e565b6080518152601f19611083608051611d4a565b01366020830137611095608051611d4a565b916110a36040519384611b9e565b6080518352601f196110b6608051611d4a565b013660208501375f945f5b608051811061182557508515611158575f935f5b6080518110611167578787878015611158576009546080516001600160a01b03909116938103908111611144577fcc50d873aa0e0708c11584529c18af24497ac00018c76faf48cb7a4c3396718f916080916040519160243583526020830152825160408301526060820152a3005b634e487b7160e01b5f52601160045260245ffd5b638894779f60e01b5f5260045ffd5b6111778160805160248701611ce6565b6111818180611d08565b9161118c8489611d8a565b511561176c576111a38160206111a8930190611d61565b611d76565b9180156117645760606111bb8284611f8d565b013592915b5f60a08190529182918291906111d582611d9e565b955f915b838310611305575050506111f8575b5050505050600101925b926110d5565b821592836112bc5761120981611d9e565b945f5b82811061129d57505050916001959493917fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb901935b82611291575b82156112845750505f5b60ff61127060405194859415158552606060208601526060850190611cb3565b911660408301520390a290898080806111e8565b5f0361125057505f611250565b60a05115159250611246565b806112aa60019284611d8a565b516112b5828a611d8a565b520161120c565b5090600195949350917fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb901926020604051906112f78183611b9e565b5f8252505f36813792611240565b90919d8b908f806113248d61131e61132a948a89611fa8565b95611d8a565b51611d8a565b519060018060a01b0385165f52600860205260405f20825f5260205260ff60405f2054166117185760e08301359283156116c65760c081013592831580156116bc575b61168757604082013590815f52600b60205260405f209260a081013593845f5260205260ff60405f2054161561165057825f52600d60205260405f20845f5260205260405f20865f5260205260ff60405f205416156116125760018060a01b0389165f52600860205260405f20825f5260205260405f20600160ff19825416179055815f52600460205260405f2090803582556020810135600183015583600283015560608101359182600382015561142e60048201926080810190611fca565b9190926001600160401b038311610544578a9261144b8254611b4b565b601f81116115be575b505f601f8211600114611553578190600795965f92611548575b50508160011b915f199060031b1c19161790555b8660058201558860068201550155825f52600560205260405f20905f5260205260405f20805468010000000000000000811015610544576114c891600182018155611e11565b819291549060031b91821b915f19901b19161790555f52600e60205260405f20905f5260205260405f2092600b8310156115345761151f600b8560019695879601611514858254611d3d565b905501918254611d3d565b9055019e8160a0510160a052015b91906111d9565b634e487b7160e01b5f52603260045260245ffd5b013590505f8061146e565b94601f19821695835f5260205f20965f5b8181106115a3575091600796979184600195941061158a575b505050811b019055611482565b01355f19600384901b60f8161c191690555f808061157d565b8284013589556001909801978f975060209283019201611564565b9091809394505f5260205f20601f830160051c81019160208410611608575b90601f8e96959493920160051c01905b8181106115fa5750611454565b5f81558d95506001016115ed565b90915081906115dd565b9395505050506116339291509f97909f3561162d828b611d8a565b5261223a565b958415611643575b60010161152d565b600695506001945061163b565b93955050505061166b9291509f97909f3561162d828b611d8a565b95841561167a5760010161152d565b600595506001945061163b565b509092506116a09291509f97909f3561162d828b611d8a565b9584156116af5760010161152d565b600495506001945061163b565b50600a841161136d565b9092506001929150909f9060606040519180358352600260208401520135907f0d6841dda0332ed6f6420eb5802f05e6977c4381eed89d0c09df3cc4095472d96040858060a01b03881692a30161152d565b9f9050600191606060405191803583528460208401520135907f0d6841dda0332ed6f6420eb5802f05e6977c4381eed89d0c09df3cc4095472d96040858060a01b03881692a30161152d565b5f92916111c0565b50908061177f575b5050600101926111f2565b606061178b8284611f8d565b01359161179782611d9e565b915f5b81811061180557505050907fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb9016117f5849360ff6117d960019789611d8a565b51166040519283925f8452606060208501526060840190611cb3565b9060408301520390a29089611774565b806118136001928486611fa8565b3561181e8287611d8a565b520161179a565b6118456111a361183b8360805160248801611ce6565b6020810190611d61565b602061186361185a8460805160248901611ce6565b82810190611d61565b01358761188861188261187c8660805160248b01611ce6565b80611d08565b90611ffc565b156119f55750506118a261187c8360805160248801611ce6565b916118ac83611d9e565b926001600160a01b03909116905f5b81811061193d57505050506118d08284611d8a565b526118db8183611d8a565b50611901866118f08360805160248801611ce6565b6118fa8486611d8a565b519061203e565b90611921575b9060019160ff6119178389611d8a565b91169052016110c1565b969060018092816119328489611d8a565b520197909150611907565b90600182611957869594839f9a999d9c9b98978590611fa8565b60405160e060208201927fa1d8d8a9fe7a1cd934efad85a30531d6a5706082c92aec323624ec869a921e8a845260208101356040840152604081013560608401526060810135608084015260a081013560a084015260c081013560c0840152013560e08201528561010082015261010081526119d561012082611b9e565b5190206119e28288611d8a565b520192939497989995969b5090916118bb565b5f51602061268e5f395f51905f52604085945f611a146001988c611d8a565b526007611a21878d611d8a565b52815194855260076020860152868060a01b031693a36040516020611a468183611b9e565b5f8252505f368137611a588285611d8a565b52611a638184611d8a565b50016110c1565b80606060208093880101520161104f565b6301654bf760e61b5f5260045ffd5b638baa579f60e01b5f5260045ffd5b638325596360e01b5f5260045ffd5b6305beb17160e11b5f5260045ffd5b611ad8600191611ad061187c8560805160248b01611ce6565b919050611d3d565b910190610f33565b63613f4a1360e11b5f5260045ffd5b3461016c575f36600319011261016c5780601460209252f35b9181601f8401121561016c578235916001600160401b03831161016c576020838186019501011161016c57565b604090600319011261016c576004359060243590565b90600182811c92168015611b79575b6020831014611b6557565b634e487b7160e01b5f52602260045260245ffd5b91607f1691611b5a565b60e081019081106001600160401b0382111761054457604052565b90601f801991011681019081106001600160401b0382111761054457604052565b9060405191825f825492611bd284611b4b565b8084529360018116908115611c3d5750600114611bf9575b50611bf792500383611b9e565b565b90505f9291925260205f20905f915b818310611c21575050906020611bf7928201015f611bea565b6020919350806001915483858901015201910190918492611c08565b905060209250611bf794915060ff191682840152151560051b8201015f611bea565b805180835260209291819084018484015e5f828201840152601f01601f1916010190565b600435906001600160a01b038216820361016c57565b606090600319011261016c57600435906024359060443590565b90602080835192838152019201905f5b818110611cd05750505090565b8251845260209384019390920191600101611cc3565b91908110156115345760051b81013590603e198136030182121561016c570190565b903590601e198136030182121561016c57018035906001600160401b03821161016c57602001918160051b3603831361016c57565b9190820180921161114457565b6001600160401b0381116105445760051b60200190565b903590605e198136030182121561016c570190565b356001600160a01b038116810361016c5790565b80518210156115345760209160051b010190565b90611da882611d4a565b611db56040519182611b9e565b8281528092611dc6601f1991611d4a565b0190602036910137565b908060209392818452848401375f828201840152601f01601f1916010190565b91602091611e0991959495604085526040850191611dd0565b931515910152565b8054821015611534575f5260205f2001905f90565b6001600160401b03811161054457601f01601f191660200190565b92919091833b15611f3557915f9391611e918594611e836040519384926020840196630b135d3f60e11b88526024850152604060448501526064840191611dd0565b03601f198101835282611b9e565b51915afa3d15611f2e573d611ea581611e26565b90611eb36040519283611b9e565b81523d5f602083013e5b81611f22575b81611ecc575090565b80516020909101516001600160e01b03198116925060048210611f02575b50506001600160e01b031916630b135d3f60e11b1490565b6001600160e01b031960049290920360031b82901b161690505f80611eea565b80516004149150611ec3565b6060611ebd565b9291611f4084611e26565b90611f4e6040519283611b9e565b848252368584011161016c575f602086611f7c97611f73968387013784010152612552565b9093919361258c565b6001600160a01b0391821691161490565b90156115345780359060fe198136030182121561016c570190565b91908110156115345760051b8101359060fe198136030182121561016c570190565b903590601e198136030182121561016c57018035906001600160401b03821161016c5760200191813603831361016c57565b905f5b81811061200e57505050600190565b606461202861201e838587611fa8565b6080810190611fca565b90501161203757600101611fff565b5050505f90565b919061205961204d8480611d08565b94602081019150611d61565b9261206384611d76565b9360208101359282158015612230575b6121fa5760405160208101918260208251919201905f5b8181106121e457505050906120ad8161211f95949303601f198101835282611b9e565b5190209561211761210c60405160208101907fffa38b52b3794fa160256e68781327917915a9d4bded223f53d0414603dd37b8825260018060a01b0385169a8b6040830152896060830152608082015260808152610fc960a082611b9e565b926040810190611fca565b929091611e41565b156121be57835f52600660205260405f20825f5260205260ff60405f205416612198577fde9782b6ede4a1d22e2929e1f7757daf3be1d657007a7f02d7d02050721cf47891604091855f526006602052825f20825f52602052825f20600160ff1982541617905582519182526020820152a36001905f90565b5060405f51602061268e5f395f51905f5291815190815260036020820152a35f90600390565b5060405f51602061268e5f395f51905f5291815190815260026020820152a35f90600290565b825184526020938401939092019160010161208a565b505060408051928352600160208401526001600160a01b03909416935f51602061268e5f395f51905f5292909150a35f90600190565b5060148311612073565b5f1981146111445760010190565b5f546001600160a01b03163303610cc157565b307f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316148061234e575b156122b6577f000000000000000000000000000000000000000000000000000000000000000090565b60405160208101907f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f82527f000000000000000000000000000000000000000000000000000000000000000060408201527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a082015260a0815261234860c082611b9e565b51902090565b507f0000000000000000000000000000000000000000000000000000000000000000461461228d565b60429061238261225b565b906040519161190160f01b8352600283015260228201522090565b60ff81146123e35760ff811690601f82116123d457604051916123c1604084611b9e565b6020808452838101919036833783525290565b632cd44ac360e21b5f5260045ffd5b50604051600254815f6123f583611b4b565b808352926001811690811561247b575060011461241c575b61241992500382611b9e565b90565b5060025f90815290917f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace5b81831061245f5750509060206124199282010161240d565b6020919350806001915483858801015201910190918392612447565b6020925061241994915060ff191682840152151560051b82010161240d565b60ff81146124be5760ff811690601f82116123d457604051916123c1604084611b9e565b50604051600354815f6124d083611b4b565b808352926001811690811561247b57506001146124f35761241992500382611b9e565b5060035f90815290917fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b5b8183106125365750509060206124199282010161240d565b602091935080600191548385880101520191019091839261251e565b81519190604183036125825761257b9250602082015190606060408401519301515f1a90612600565b9192909190565b50505f9160029190565b60048110156125ec578061259e575050565b600181036125b55763f645eedf60e01b5f5260045ffd5b600281036125d0575063fce698f760e01b5f5260045260245ffd5b6003146125da5750565b6335e2f38360e21b5f5260045260245ffd5b634e487b7160e01b5f52602160045260245ffd5b91907f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a08411612682579160209360809260ff5f9560405194855216868401526040830152606082015282805260015afa15612677575f516001600160a01b0381161561266d57905f905f90565b505f906001905f90565b6040513d5f823e3d90fd5b5050505f916003919056fe1a27036f4eb7d046165dd3c2d29117a18b873fc3cc71b0c4320b65fbf51b4d2ba2646970667358221220886665f6289d593451db48eb13fef2124644df25ec68fd3568f539fac99bbb3c64736f6c634300081e0033";