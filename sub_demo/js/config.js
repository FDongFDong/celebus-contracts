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
    "name": "UserVoteResult",
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
export const SUBVOTING_BYTECODE = "0x61018080604052346101d85760208161335f803803809161002082856101dc565b8339810103126101d857516001600160a01b038116908190036101d8576040519061004c6040836101dc565b600982526020820168537562566f74696e6760b81b8152604051926100726040856101dc565b600184526020840192603160f81b845280156101c557600180546001600160a01b03199081169091555f8054918216831781556001600160a01b03909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a36100de81610213565b610120526100eb846103ae565b61014052519020918260e05251902080610100524660a0526040519060208201927f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f8452604083015260608201524660808201523060a082015260a0815261015460c0826101dc565b5190206080523060c0524661016052604051612e7890816104e7823960805181612b4b015260a05181612c08015260c05181612b15015260e05181612b9a01526101005181612bc001526101205181610cb201526101405181610cde015261016051818181610c7701526114860152f35b631e4fbdf760e01b5f525f60045260245ffd5b5f80fd5b601f909101601f19168101906001600160401b038211908210176101ff57604052565b634e487b7160e01b5f52604160045260245ffd5b908151602081105f1461028d575090601f81511161024d57602081519101516020821061023e571790565b5f198260200360031b1b161790565b604460209160405192839163305a27a960e01b83528160048401528051918291826024860152018484015e5f828201840152601f01601f19168101030190fd5b6001600160401b0381116101ff57600254600181811c911680156103a4575b602082101461039057601f811161035d575b50602092601f82116001146102fc57928192935f926102f1575b50508160011b915f199060031b1c19161760025560ff90565b015190505f806102d8565b601f1982169360025f52805f20915f5b868110610345575083600195961061032d575b505050811b0160025560ff90565b01515f1960f88460031b161c191690555f808061031f565b9192602060018192868501518155019401920161030c565b60025f52601f60205f20910160051c810190601f830160051c015b81811061038557506102be565b5f8155600101610378565b634e487b7160e01b5f52602260045260245ffd5b90607f16906102ac565b908151602081105f146103d9575090601f81511161024d57602081519101516020821061023e571790565b6001600160401b0381116101ff57600354600181811c911680156104dc575b602082101461039057601f81116104a9575b50602092601f821160011461044857928192935f9261043d575b50508160011b915f199060031b1c19161760035560ff90565b015190505f80610424565b601f1982169360035f52805f20915f5b8681106104915750836001959610610479575b505050811b0160035560ff90565b01515f1960f88460031b161c191690555f808061046b565b91926020600181928685015181550194019201610458565b60035f52601f60205f20910160051c810190601f830160051c015b8181106104d1575061040a565b5f81556001016104c4565b90607f16906103f856fe60c0806040526004361015610012575f80fd5b5f3560e01c908163032e1a4014612268575080630470ffc8146122005780631510841c1461202557806316c9a207146113de5780631a30ffa1146113a55780632b38cd961461130d57806334ccc5ea146112f25780634aeb82b914611174578063574df9321461112b57806360f57e80146110ed578063711a53d414611049578063715018a614610fe65780637641bf0214610fcb57806379ba509714610f465780637b1c83b314610d6757806384b0196e14610c9a57806385e1f4d014610c605780638b391c0a14610bbe5780638da5cb5b14610b97578063b40f68ce14610936578063b656f40414610904578063c00e0e2514610882578063c11c48ec146105f1578063caa7c246146105bd578063dc5d03791461037f578063e29dfba814610336578063e30c39781461030e578063e3a9db32146102ac578063f2fde38b1461023a578063f698da2514610218578063f6de30b6146101f0578063f7feca8a146101a75763fd81654e14610187575f80fd5b346101a3575f3660031901126101a35760206040516107d08152f35b5f80fd5b346101a35760403660031901126101a3576001600160a01b036101c861248c565b165f52600660205260405f206024355f52602052602060ff60405f2054166040519015158152f35b346101a3575f3660031901126101a3576009546040516001600160a01b039091168152602090f35b346101a3575f3660031901126101a3576020610232612b12565b604051908152f35b346101a35760203660031901126101a35761025361248c565b61025b612aff565b60018060a01b0316806bffffffffffffffffffffffff60a01b600154161760015560018060a01b035f54167f38d16b8cac22d99fc7c124b9cd0de2d3fa1faef420bfe791d8c362d765e227005f80a3005b346101a3576102ba36612281565b915f52600c60205260405f20905f5260205260405f20905f5260205261030a6102ef6102f660405f206040519283809261233a565b038261240d565b6040519182916020835260208301906122b1565b0390f35b346101a3575f3660031901126101a3576001546040516001600160a01b039091168152602090f35b346101a35760403660031901126101a3576001600160a01b0361035761248c565b165f52600860205260405f206024355f52602052602060ff60405f2054166040519015158152f35b346101a35760a03660031901126101a3576044356024356004356064356001600160401b0381116101a3576103b89036906004016122d5565b9060843580151581036101a3576103cd612aff565b851580156105b3575b6105a057835f52600c60205260405f20855f5260205260405f20865f5260205260405f206001600160401b03841161058c576104128154612302565b601f8111610547575b505f601f85116001146104bd57916104ad91857f85c66a91133fbeb8288b2279a45826b22de8a7146c961451a200ce916a1b3c509695945f916104b2575b508560011b905f198760031b1c19161790555b855f52600d60205260405f20875f5260205260405f20885f526020526104a18160405f209060ff801983541691151516179055565b604051938493846126bc565b0390a4005b90508401358a610459565b601f19851690825f5260205f20915f5b81811061052f5750916104ad9391877f85c66a91133fbeb8288b2279a45826b22de8a7146c961451a200ce916a1b3c509897969410610516575b5050600185811b01905561046c565b8501355f19600388901b60f8161c191690558980610507565b9192602060018192868a0135815501940192016104cd565b815f5260205f20601f860160051c81019160208710610582575b601f0160051c01905b818110610577575061041b565b5f815560010161056a565b9091508190610561565b634e487b7160e01b5f52604160045260245ffd5b8563768d03e960e11b5f5260045260245ffd5b50600a86116103d6565b346101a3576105cb3661229b565b905f52600b60205260405f20905f52602052602060ff60405f2054166040519015158152f35b346101a3576105ff3661229b565b5f606060405161060e816123bb565b8181528260208201528160408201520152815f52600a60205260405f20815f526020526102ef61064760405f206040519283809261233a565b825f52600b60205260405f20825f5260205260ff60405f205416835f52600e60205260405f20835f5260205260405f205f60015b600a811115610841575061068e9061250f565b935f9060015b600a81111561078357505050600b015492604051926106b2846123bb565b835260208301911515825260408301908152606083019384526106e86040519360208552516080602086015260a08501906122b1565b9151151560408401525190601f19838203016060840152815180825260208201916020808360051b8301019401925f915b83831061072d578751608088015286860387f35b9091929394602080600192601f19858203018652885190815181526060806107628585015160808786015260808501906122b1565b93604081015160408501520151151591015297019301930191939290610719565b875f52600c60205260405f20825f5260205260405f20815f526020526102ef6107b560405f206040519283809261233a565b80516107c5575b50600101610694565b8193600192916107d68493886124d5565b90549060031b1c8b5f52600d60205260405f20865f5260205260405f20875f5260205260ff60405f205416906040519261080f846123bb565b888452602084015260408301521515606082015261082d828b612577565b52610838818a612577565b500192906107bc565b865f52600c60205260405f20865f5260205260405f20815f5260205261086a60405f2054612302565b610877575b60010161067b565b60019091019061086f565b346101a35760203660031901126101a35761089b61248c565b6108a3612aff565b6001600160a01b031680156108f557600980546001600160a01b0319811683179091556001600160a01b03167f7b430a84222a519230743a1a600e19cbaf3386e1074a55b0ae7bedf74419406c5f80a3005b63d92e233d60e01b5f5260045ffd5b346101a3576109123661229b565b905f52600e60205260405f20905f526020526020600b60405f200154604051908152f35b346101a3576109443661229b565b905f52600560205260405f20905f5260205260405f208054610965816124f8565b91610973604051938461240d565b818352601f19610982836124f8565b015f5b818110610b545750505f5b828110610a5957836040518091602082016020835281518091526040830190602060408260051b8601019301915f905b8282106109cf57505050500390f35b919360019193955060208091603f198982030185528751908151815282820151838201526040820151604082015260c080610a43610a31610a1f606087015160e0606088015260e08701906122b1565b608087015186820360808801526122b1565b60a086015185820360a08701526122b1565b93015191015296019201920185949391926109c0565b80610a6660019284612687565b90549060031b1c5f526004602052610af060405f206102ef610b2e85830154926102ef610b1d6002830154926004610b0c600383015492865f52600a60205260405f2093600582015494855f5260205260405f2094885f52600c60205260405f20905f5260205260405f2060068301545f5260205260405f209760078301549b6040519d8e6123f2565b8d5260208d015260408c01526102ef604051809481930161233a565b60608901526040519283809261233a565b60808601526040519283809261233a565b60a083015260c0820152610b428287612577565b52610b4d8186612577565b5001610990565b602090604051610b63816123f2565b5f81525f838201525f604082015260608082015260606080820152606060a08201525f60c082015282828801015201610985565b346101a3575f3660031901126101a3575f546040516001600160a01b039091168152602090f35b346101a357610bcc3661229b565b6101609182604051610bde828261240d565b3690375f52600e60205260405f20905f5260205260405f2090600b82015460405192835f905b600b8210610c4a57505050610c19828461240d565b604051915f835b600b8210610c345750506101809350820152f35b6020806001928851815201960191019094610c20565b6001602081928554815201930191019091610c04565b346101a3575f3660031901126101a35760206040517f00000000000000000000000000000000000000000000000000000000000000008152f35b346101a3575f3660031901126101a357610d39610cd67f0000000000000000000000000000000000000000000000000000000000000000612c54565b61030a610d027f0000000000000000000000000000000000000000000000000000000000000000612cb0565b610d4760405191610d1460208461240d565b5f83525f368137604051958695600f60f81b875260e0602088015260e08701906122b1565b9085820360408701526122b1565b904660608501523060808501525f60a085015283820360c08501526124a2565b346101a35760803660031901126101a3576004356024356044356001600160401b0381116101a357610d9d9036906004016122d5565b606435939184151585036101a357610db3612aff565b825f52600a60205260405f20845f5260205260405f20946001600160401b03831161058c57610de28654612302565b601f8111610f01575b505f95601f8411600114610e785790610e6891847fc9c1ae0a6fb65b3fc44b61a6cc769977fca4a7e8543caa636a406f35d1efd4b39697985f91610e6d575b508560011b905f198760031b1c19161790555b855f52600b60205260405f20875f526020526104a18160405f209060ff801983541691151516179055565b0390a3005b905084013589610e2a565b601f198416815f5260205f20905f5b818110610ee95750907fc9c1ae0a6fb65b3fc44b61a6cc769977fca4a7e8543caa636a406f35d1efd4b396979886610e6895949310610ed0575b5050600185811b019055610e3d565b8501355f19600388901b60f8161c191690558880610ec1565b858a013583556020998a019960019093019201610e87565b865f5260205f20601f850160051c81019160208610610f3c575b601f0160051c01905b818110610f315750610deb565b5f8155600101610f24565b9091508190610f1b565b346101a3575f3660031901126101a357600154336001600160a01b0390911603610fb857600180546001600160a01b03199081169091555f805433928116831782556001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a3005b63118cdaa760e01b5f523360045260245ffd5b346101a3575f3660031901126101a3576020604051600a8152f35b346101a3575f3660031901126101a357610ffe612aff565b600180546001600160a01b03199081169091555f80549182168155906001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a3005b346101a35760203660031901126101a35761106261264a565b506004355f52600460205261030a60405f20600760405191611083836123d6565b805483526001810154602084015260028101546040840152600381015460608401526040516110b9816102ef816004860161233a565b6080840152600581015460a0840152600681015460c0840152015460e082015260405191829160208352602083019061242e565b346101a3576110fb36612281565b915f52600d60205260405f20905f5260205260405f20905f52602052602060ff60405f2054166040519015158152f35b346101a35760403660031901126101a3576001600160a01b0361114c61248c565b165f52600760205260405f206024355f52602052602060ff60405f2054166040519015158152f35b346101a3576111823661229b565b905f52600560205260405f20905f5260205260405f2080546111a3816124f8565b916111b1604051938461240d565b818352601f196111c0836124f8565b015f5b8181106112db5750505f5b82811061123c57836040518091602082016020835281518091526040830190602060408260051b8601019301915f905b82821061120d57505050500390f35b9193600191939550602061122c8192603f198a8203018652885161242e565b96019201920185949391926111fe565b8061124960019284612687565b90549060031b1c5f52600460205260405f2060076040519161126a836123d6565b80548352848101546020840152600281015460408401526003810154606084015260405161129f816102ef816004860161233a565b6080840152600581015460a0840152600681015460c0840152015460e08201526112c98287612577565b526112d48186612577565b50016111ce565b6020906112e661264a565b828288010152016111c3565b346101a3575f3660031901126101a357602060405160648152f35b346101a35760203660031901126101a3576004355f52600460205260405f2080546001820154916002810154600382015491611391604051611356816102ef816004870161233a565b6005830154946007600685015494015494604051988998895260208901526040880152606087015261010060808701526101008601906122b1565b9260a085015260c084015260e08301520390f35b346101a3576113b33661229b565b905f52600a60205260405f20905f5260205261030a6102ef6102f660405f206040519283809261233a565b346101a35760603660031901126101a3576004356001600160401b0381116101a357366023820112156101a35780600401356080526001600160401b03608051116101a35736602460805160051b830101116101a3576044356001600160401b0381116101a3576114539036906004016122d5565b60805115612016575f805b6080518210611fed576107d0915011611fde576009546001600160a01b03169081156108f5577f00000000000000000000000000000000000000000000000000000000000000004603611fcf57611504906114fc60405160208101907f9835e583e3f8f1e4dfc48fe02a92fdbd9a76bc16eec83f3b1f70df2ffbc3b84a82526024356040820152604081526114f460608261240d565b519020612c2e565b9384846126f8565b15611fc057805f52600760205260405f206024355f5260205260ff60405f205416611fb1575f52600760205260405f206024355f5260205260405f20600160ff198254161790556115566080516124f8565b91611564604051938461240d565b6080518352601f196115776080516124f8565b015f5b818110611fa057505061158e6080516124f8565b61159b604051918261240d565b6080518152601f196115ae6080516124f8565b013660208301376115c06080516124f8565b916115ce604051938461240d565b6080518352601f196115e16080516124f8565b013660208501375f945f5b6080518110611d5b57508515611683575f935f5b6080518110611692578787878015611683576009546080516001600160a01b0390911693810390811161166f577fcc50d873aa0e0708c11584529c18af24497ac00018c76faf48cb7a4c3396718f916080916040519160243583526020830152825160408301526060820152a3005b634e487b7160e01b5f52601160045260245ffd5b638894779f60e01b5f5260045ffd5b6116a2816080516024870161258b565b6116ac81806125ad565b90916116b88489612577565b5115611ca3576116cf8160206116d49301906125ef565b612604565b908015611c9b5760606116e78285612844565b013592915b5f60a081905291829182919061170182612618565b955f915b83831061183157505050611724575b5050505050600101925b92611600565b821592836117e85761173581612618565b945f5b8281106117c957505050916001959493917f404ea7a72766782efe513e7a598669333a34933cf547408efb07888770920ffe935b826117bd575b82156117b05750505f5b60ff61179c604051948594151585526060602086015260608501906124a2565b911660408301520390a29089808080611714565b5f0361177c57505f61177c565b60a05115159250611772565b806117d660019284612577565b516117e1828a612577565b5201611738565b5090600195949350917f404ea7a72766782efe513e7a598669333a34933cf547408efb07888770920ffe92602060405190611823818361240d565b5f8252505f3681379261176c565b90919d8b908f806118508d61184a611856948a8a61285f565b95612577565b51612577565b519060018060a01b0384165f52600860205260405f20825f5260205260ff60405f205416611c4f5760e08301358015611c015760c08401359384158015611bf7575b611bc257604081013594855f52600b60205260405f209160a081013592835f5260205260ff60405f20541615611b8b57865f52600d60205260405f20835f5260205260405f20825f5260205260ff60405f20541615611b4d5760018060a01b0388165f52600860205260405f20865f5260205260405f20600160ff19825416179055855f52600460205260405f2090803582556020810135600183015587600283015560608101359182600382015561195960048201926080810190612881565b9190926001600160401b03831161058c5787926119768254612302565b601f8111611af9575b505f601f8211600114611a8e578190600795965f92611a83575b50508160011b915f199060031b1c19161790555b8560058201558460068201550155865f52600560205260405f20905f5260205260405f20908154926801000000000000000084101561058c576001978897611a18611a0287600b978c611a6e9a018155612687565b819391549060031b91821b915f19901b19161790565b90555f52600e60205260405f20905f52602052611a63611a3c60405f2092836124d5565b8192915490611a5088838360031b1c6125e2565b919060031b91821b915f19901b19161790565b9055019182546125e2565b9055019e8160a0510160a052015b9190611705565b013590505f80611999565b94601f19821695835f5260205f20965f5b818110611ade5750916007969791846001959410611ac5575b505050811b0190556119ad565b01355f19600384901b60f8161c191690555f8080611ab8565b8284013589556001909801978c975060209283019201611a9f565b9091809394505f5260205f20601f830160051c81019160208410611b43575b90601f8b96959493920160051c01905b818110611b35575061197f565b5f81558a9550600101611b28565b9091508190611b18565b939550505050611b6e9291509f97909f35611b68828b612577565b52612af1565b958415611b7e575b600101611a7c565b6006955060019450611b76565b939550505050611ba69291509f97909f35611b68828b612577565b958415611bb557600101611a7c565b6005955060019450611b76565b91935050611bdb9291509f97909f35611b68828b612577565b958415611bea57600101611a7c565b6004955060019450611b76565b50600a8511611898565b509f905060019160606040519180358352600260208401520135907f0d6841dda0332ed6f6420eb5802f05e6977c4381eed89d0c09df3cc4095472d96040858060a01b03871692a301611a7c565b9f9050600191606060405191803583528460208401520135907f0d6841dda0332ed6f6420eb5802f05e6977c4381eed89d0c09df3cc4095472d96040858060a01b03871692a301611a7c565b5f92916116ec565b5080611cb5575b50506001019261171e565b6060611cc18284612844565b013591611ccd82612618565b915f5b818110611d3b57505050907f404ea7a72766782efe513e7a598669333a34933cf547408efb07888770920ffe611d2b849360ff611d0f60019789612577565b51166040519283925f84526060602085015260608401906124a2565b9060408301520390a29089611caa565b80611d49600192848661285f565b35611d548287612577565b5201611cd0565b611d7b6116cf611d71836080516024880161258b565b60208101906125ef565b6020611d99611d90846080516024890161258b565b828101906125ef565b013587611dbe611db8611db28660805160248b0161258b565b806125ad565b906128b3565b15611f2b575050611dd8611db2836080516024880161258b565b91611de283612618565b926001600160a01b03909116905f5b818110611e735750505050611e068284612577565b52611e118183612577565b50611e3786611e26836080516024880161258b565b611e308486612577565b51906128f5565b90611e57575b9060019160ff611e4d8389612577565b91169052016115ec565b96906001809281611e688489612577565b520197909150611e3d565b90600182611e8d869594839f9a999d9c9b9897859061285f565b60405160e060208201927fa1d8d8a9fe7a1cd934efad85a30531d6a5706082c92aec323624ec869a921e8a845260208101356040840152604081013560608401526060810135608084015260a081013560a084015260c081013560c0840152013560e0820152856101008201526101008152611f0b6101208261240d565b519020611f188288612577565b520192939497989995969b509091611df1565b5f516020612e235f395f51905f52604085945f611f4a6001988c612577565b526007611f57878d612577565b52815194855260076020860152868060a01b031693a36040516020611f7c818361240d565b5f8252505f368137611f8e8285612577565b52611f998184612577565b50016115ec565b80606060208093880101520161157a565b6301654bf760e61b5f5260045ffd5b638baa579f60e01b5f5260045ffd5b638325596360e01b5f5260045ffd5b6305beb17160e11b5f5260045ffd5b61200e600191612006611db28560805160248b0161258b565b9190506125e2565b91019061145e565b63613f4a1360e11b5f5260045ffd5b346101a3576120333661229b565b90805f52600e60205260405f20825f5260205260405f20915f60015b600a8111156121bf57506120629061250f565b925f9060015b600a81111561210157856040518091602082016020835281518091526040830190602060408260051b8601019301915f905b8282106120a957505050500390f35b919360019193955060208091603f19898203018552875190815181526060806120df8585015160808786015260808501906122b1565b936040810151604085015201511515910152960192019201859493919261209a565b845f52600c60205260405f20845f5260205260405f20815f526020526102ef61213360405f206040519283809261233a565b8051612143575b50600101612068565b8193600192916121548493866124d5565b90549060031b1c885f52600d60205260405f20885f5260205260405f20875f5260205260ff60405f205416906040519261218d846123bb565b88845260208401526040830152151560608201526121ab828a612577565b526121b68189612577565b5001929061213a565b835f52600c60205260405f20835f5260205260405f20815f526020526121e860405f2054612302565b6121f5575b60010161204f565b6001909101906121ed565b346101a35761220e36612281565b918215801561225e575b61224b579161223c916020935f52600e845260405f20905f52835260405f206124d5565b90549060031b1c604051908152f35b8263768d03e960e11b5f5260045260245ffd5b50600a8311612218565b346101a3575f3660031901126101a35780601460209252f35b60609060031901126101a357600435906024359060443590565b60409060031901126101a3576004359060243590565b805180835260209291819084018484015e5f828201840152601f01601f1916010190565b9181601f840112156101a3578235916001600160401b0383116101a357602083818601950101116101a357565b90600182811c92168015612330575b602083101461231c57565b634e487b7160e01b5f52602260045260245ffd5b91607f1691612311565b5f929181549161234983612302565b808352926001811690811561239e575060011461236557505050565b5f9081526020812093945091925b838310612384575060209250010190565b600181602092949394548385870101520191019190612373565b915050602093945060ff929192191683830152151560051b010190565b608081019081106001600160401b0382111761058c57604052565b61010081019081106001600160401b0382111761058c57604052565b60e081019081106001600160401b0382111761058c57604052565b90601f801991011681019081106001600160401b0382111761058c57604052565b908151815260208201516020820152604082015160408201526060820151606082015260e08061246f608085015161010060808601526101008501906122b1565b9360a081015160a085015260c081015160c0850152015191015290565b600435906001600160a01b03821682036101a357565b90602080835192838152019201905f5b8181106124bf5750505090565b82518452602093840193909201916001016124b2565b600b8210156124e45701905f90565b634e487b7160e01b5f52603260045260245ffd5b6001600160401b03811161058c5760051b60200190565b90612519826124f8565b612526604051918261240d565b8281528092612537601f19916124f8565b01905f5b82811061254757505050565b602090604051612556816123bb565b5f81526060838201525f60408201525f60608201528282850101520161253b565b80518210156124e45760209160051b010190565b91908110156124e45760051b81013590603e19813603018212156101a3570190565b903590601e19813603018212156101a357018035906001600160401b0382116101a357602001918160051b360383136101a357565b9190820180921161166f57565b903590605e19813603018212156101a3570190565b356001600160a01b03811681036101a35790565b90612622826124f8565b61262f604051918261240d565b8281528092612640601f19916124f8565b0190602036910137565b60405190612657826123d6565b5f60e083828152826020820152826040820152826060820152606060808201528260a08201528260c08201520152565b80548210156124e4575f5260205f2001905f90565b908060209392818452848401375f828201840152601f01601f1916010190565b916020916126d59195949560408552604085019161269c565b931515910152565b6001600160401b03811161058c57601f01601f191660200190565b92919091833b156127ec57915f9391612748859461273a6040519384926020840196630b135d3f60e11b8852602485015260406044850152606484019161269c565b03601f19810183528261240d565b51915afa3d156127e5573d61275c816126dd565b9061276a604051928361240d565b81523d5f602083013e5b816127d9575b81612783575090565b80516020909101516001600160e01b031981169250600482106127b9575b50506001600160e01b031916630b135d3f60e11b1490565b6001600160e01b031960049290920360031b82901b161690505f806127a1565b8051600414915061277a565b6060612774565b92916127f7846126dd565b90612805604051928361240d565b84825236858401116101a3575f6020866128339761282a968387013784010152612ce7565b90939193612d21565b6001600160a01b0391821691161490565b90156124e45780359060fe19813603018212156101a3570190565b91908110156124e45760051b8101359060fe19813603018212156101a3570190565b903590601e19813603018212156101a357018035906001600160401b0382116101a3576020019181360383136101a357565b905f5b8181106128c557505050600190565b60646128df6128d583858761285f565b6080810190612881565b9050116128ee576001016128b6565b5050505f90565b919061291061290484806125ad565b946020810191506125ef565b9261291a84612604565b9360208101359282158015612ae7575b612ab15760405160208101918260208251919201905f5b818110612a9b5750505090612964816129d695949303601f19810183528261240d565b519020956129ce6129c360405160208101907fffa38b52b3794fa160256e68781327917915a9d4bded223f53d0414603dd37b8825260018060a01b0385169a8b60408301528960608301526080820152608081526114f460a08261240d565b926040810190612881565b9290916126f8565b15612a7557835f52600660205260405f20825f5260205260ff60405f205416612a4f577fde9782b6ede4a1d22e2929e1f7757daf3be1d657007a7f02d7d02050721cf47891604091855f526006602052825f20825f52602052825f20600160ff1982541617905582519182526020820152a36001905f90565b5060405f516020612e235f395f51905f5291815190815260036020820152a35f90600390565b5060405f516020612e235f395f51905f5291815190815260026020820152a35f90600290565b8251845260209384019390920191600101612941565b505060408051928352600160208401526001600160a01b03909416935f516020612e235f395f51905f5292909150a35f90600190565b506014831161292a565b5f19811461166f5760010190565b5f546001600160a01b03163303610fb857565b307f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03161480612c05575b15612b6d577f000000000000000000000000000000000000000000000000000000000000000090565b60405160208101907f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f82527f000000000000000000000000000000000000000000000000000000000000000060408201527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a082015260a08152612bff60c08261240d565b51902090565b507f00000000000000000000000000000000000000000000000000000000000000004614612b44565b604290612c39612b12565b906040519161190160f01b8352600283015260228201522090565b60ff8114612c9a5760ff811690601f8211612c8b5760405191612c7860408461240d565b6020808452838101919036833783525290565b632cd44ac360e21b5f5260045ffd5b50604051612cad816102ef81600261233a565b90565b60ff8114612cd45760ff811690601f8211612c8b5760405191612c7860408461240d565b50604051612cad816102ef81600361233a565b8151919060418303612d1757612d109250602082015190606060408401519301515f1a90612d95565b9192909190565b50505f9160029190565b6004811015612d815780612d33575050565b60018103612d4a5763f645eedf60e01b5f5260045ffd5b60028103612d65575063fce698f760e01b5f5260045260245ffd5b600314612d6f5750565b6335e2f38360e21b5f5260045260245ffd5b634e487b7160e01b5f52602160045260245ffd5b91907f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a08411612e17579160209360809260ff5f9560405194855216868401526040830152606082015282805260015afa15612e0c575f516001600160a01b03811615612e0257905f905f90565b505f906001905f90565b6040513d5f823e3d90fd5b5050505f916003919056fe1a27036f4eb7d046165dd3c2d29117a18b873fc3cc71b0c4320b65fbf51b4d2ba264697066735822122001cf0652d33ead122ff090eb8df4b416cf90d7bf1b6833ca48714d97e1cf378964736f6c634300081e0033";