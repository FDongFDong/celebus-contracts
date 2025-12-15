/**
 * SubVoting Demo Configuration
 * 컨트랙트 주소, ABI, 기본값 등을 관리합니다
 */

export const CONFIG = {
  // Network Configuration
  CHAIN_ID: 5611,
  CHAIN_NAME: 'opBNB Testnet',
  RPC_URL: 'https://opbnb-testnet-rpc.bnbchain.org',

  // Contract Configuration
  VOTING_ADDRESS: 'NEW_CONTRACT_ADDRESS', // 새로 배포된 SubVoting 컨트랙트 주소

  // Contract ABI (UserVoteBatch[] 구조 - recordId 포함)
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
  // 실패 사유 코드 (reasonCode)
  REASON_CODES: {
    0: { name: 'SUCCESS', message: '성공', alert: false },
    1: { name: 'USER_BATCH_TOO_LARGE', message: '배치 레코드 수 초과 (최대 20개)', alert: true },
    2: { name: 'INVALID_USER_SIGNATURE', message: '서명 검증 실패', alert: true },
    3: { name: 'USER_NONCE_INVALID', message: 'Nonce 순차 오류', alert: true },
    4: { name: 'INVALID_OPTION_ID', message: 'optionId 범위 오류 (1~10만 허용)', alert: true },
    5: { name: 'QUESTION_NOT_ALLOWED', message: '허용되지 않은 질문', alert: true },
    6: { name: 'OPTION_NOT_ALLOWED', message: '허용되지 않은 옵션', alert: true }
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
export const SUBVOTING_BYTECODE = "0x61018080604052346101d857602081613369803803809161002082856101dc565b8339810103126101d857516001600160a01b038116908190036101d8576040519061004c6040836101dc565b600982526020820168537562566f74696e6760b81b8152604051926100726040856101dc565b600184526020840192601960f91b845280156101c557600180546001600160a01b03199081169091555f8054918216831781556001600160a01b03909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a36100de81610213565b610120526100eb846103ae565b61014052519020918260e05251902080610100524660a0526040519060208201927f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f8452604083015260608201524660808201523060a082015260a0815261015460c0826101dc565b5190206080523060c0524661016052604051612e8290816104e7823960805181612b75015260a05181612c32015260c05181612b3f015260e05181612bc401526101005181612bea01526101205181610c9101526101405181610cbd015261016051818181610c56015261154f0152f35b631e4fbdf760e01b5f525f60045260245ffd5b5f80fd5b601f909101601f19168101906001600160401b038211908210176101ff57604052565b634e487b7160e01b5f52604160045260245ffd5b908151602081105f1461028d575090601f81511161024d57602081519101516020821061023e571790565b5f198260200360031b1b161790565b604460209160405192839163305a27a960e01b83528160048401528051918291826024860152018484015e5f828201840152601f01601f19168101030190fd5b6001600160401b0381116101ff57600254600181811c911680156103a4575b602082101461039057601f811161035d575b50602092601f82116001146102fc57928192935f926102f1575b50508160011b915f199060031b1c19161760025560ff90565b015190505f806102d8565b601f1982169360025f52805f20915f5b868110610345575083600195961061032d575b505050811b0160025560ff90565b01515f1960f88460031b161c191690555f808061031f565b9192602060018192868501518155019401920161030c565b60025f52601f60205f20910160051c810190601f830160051c015b81811061038557506102be565b5f8155600101610378565b634e487b7160e01b5f52602260045260245ffd5b90607f16906102ac565b908151602081105f146103d9575090601f81511161024d57602081519101516020821061023e571790565b6001600160401b0381116101ff57600354600181811c911680156104dc575b602082101461039057601f81116104a9575b50602092601f821160011461044857928192935f9261043d575b50508160011b915f199060031b1c19161760035560ff90565b015190505f80610424565b601f1982169360035f52805f20915f5b8681106104915750836001959610610479575b505050811b0160035560ff90565b01515f1960f88460031b161c191690555f808061046b565b91926020600181928685015181550194019201610458565b60035f52601f60205f20910160051c810190601f830160051c015b8181106104d1575061040a565b5f81556001016104c4565b90607f16906103f856fe60c0806040526004361015610012575f80fd5b5f3560e01c908163032e1a40146122b3575080630470ffc81461224b5780630ab57023146121bd5780631510841c14611fe257806316c9a207146114a75780631a30ffa11461146e5780631dcc3b38146113ab5780632b38cd96146113135780632e04b8e7146112db57806334ccc5ea146112c05780634aeb82b91461114257806360f57e80146111045780636eacfe50146110cc578063711a53d414611028578063715018a614610fc55780637641bf0214610faa57806379ba509714610f255780637b1c83b314610d4657806384b0196e14610c7957806385e1f4d014610c3f5780638b391c0a14610b9d5780638da5cb5b14610b76578063b40f68ce14610915578063b656f404146108e3578063c00e0e251461084f578063c11c48ec146105be578063caa7c2461461058a578063dc5d03791461034c578063e29dfba814610303578063e30c3978146102db578063e3a9db3214610279578063f2fde38b14610207578063f698da25146101e5578063f6de30b6146101bd5763fd81654e1461019d575f80fd5b346101b9575f3660031901126101b95760206040516107d08152f35b5f80fd5b346101b9575f3660031901126101b9576009546040516001600160a01b039091168152602090f35b346101b9575f3660031901126101b95760206101ff612b3c565b604051908152f35b346101b95760203660031901126101b9576102206122e6565b610228612728565b60018060a01b0316806bffffffffffffffffffffffff60a01b600154161760015560018060a01b035f54167f38d16b8cac22d99fc7c124b9cd0de2d3fa1faef420bfe791d8c362d765e227005f80a3005b346101b957610287366122cc565b915f52600c60205260405f20905f5260205260405f20905f526020526102d76102bc6102c360405f206040519283809261239b565b038261246e565b604051918291602083526020830190612312565b0390f35b346101b9575f3660031901126101b9576001546040516001600160a01b039091168152602090f35b346101b95760403660031901126101b9576001600160a01b036103246122e6565b165f52600860205260405f206024355f52602052602060ff60405f2054166040519015158152f35b346101b95760a03660031901126101b9576044356024356004356064356001600160401b0381116101b957610385903690600401612336565b9060843580151581036101b95761039a612728565b85158015610580575b61056d57835f52600c60205260405f20855f5260205260405f20865f5260205260405f206001600160401b038411610559576103df8154612363565b601f8111610514575b505f601f851160011461048a579161047a91857f85c66a91133fbeb8288b2279a45826b22de8a7146c961451a200ce916a1b3c509695945f9161047f575b508560011b905f198760031b1c19161790555b855f52600d60205260405f20875f5260205260405f20885f5260205261046e8160405f209060ff801983541691151516179055565b604051938493846126d5565b0390a4005b90508401358a610426565b601f19851690825f5260205f20915f5b8181106104fc57509161047a9391877f85c66a91133fbeb8288b2279a45826b22de8a7146c961451a200ce916a1b3c5098979694106104e3575b5050600185811b019055610439565b8501355f19600388901b60f8161c1916905589806104d4565b9192602060018192868a01358155019401920161049a565b815f5260205f20601f860160051c8101916020871061054f575b601f0160051c01905b81811061054457506103e8565b5f8155600101610537565b909150819061052e565b634e487b7160e01b5f52604160045260245ffd5b8563768d03e960e11b5f5260045260245ffd5b50600a86116103a3565b346101b957610598366122fc565b905f52600b60205260405f20905f52602052602060ff60405f2054166040519015158152f35b346101b9576105cc366122fc565b5f60606040516105db8161241c565b8181528260208201528160408201520152815f52600a60205260405f20815f526020526102bc61061460405f206040519283809261239b565b825f52600b60205260405f20825f5260205260ff60405f205416835f52600e60205260405f20835f5260205260405f205f60015b600a81111561080e575061065b9061255a565b935f9060015b600a81111561075057505050600b0154926040519261067f8461241c565b835260208301911515825260408301908152606083019384526106b56040519360208552516080602086015260a0850190612312565b9151151560408401525190601f19838203016060840152815180825260208201916020808360051b8301019401925f915b8383106106fa578751608088015286860387f35b9091929394602080600192601f198582030186528851908151815260608061072f858501516080878601526080850190612312565b936040810151604085015201511515910152970193019301919392906106e6565b875f52600c60205260405f20825f5260205260405f20815f526020526102bc61078260405f206040519283809261239b565b8051610792575b50600101610661565b8193600192916107a3849388612520565b90549060031b1c8b5f52600d60205260405f20865f5260205260405f20875f5260205260ff60405f20541690604051926107dc8461241c565b88845260208401526040830152151560608201526107fa828b6125c2565b52610805818a6125c2565b50019290610789565b865f52600c60205260405f20865f5260205260405f20815f5260205261083760405f2054612363565b610844575b600101610648565b60019091019061083c565b346101b95760203660031901126101b9576108686122e6565b610870612728565b6001600160a01b031680156108d457600980545f83815260076020526040812081905582546001600160a01b03191684179092556001600160a01b0316907f7b430a84222a519230743a1a600e19cbaf3386e1074a55b0ae7bedf74419406c9080a3005b63d92e233d60e01b5f5260045ffd5b346101b9576108f1366122fc565b905f52600e60205260405f20905f526020526020600b60405f200154604051908152f35b346101b957610923366122fc565b905f52600560205260405f20905f5260205260405f20805461094481612543565b91610952604051938461246e565b818352601f1961096183612543565b015f5b818110610b335750505f5b828110610a3857836040518091602082016020835281518091526040830190602060408260051b8601019301915f905b8282106109ae57505050500390f35b919360019193955060208091603f198982030185528751908151815282820151838201526040820151604082015260c080610a22610a106109fe606087015160e0606088015260e0870190612312565b60808701518682036080880152612312565b60a086015185820360a0870152612312565b930151910152960192019201859493919261099f565b80610a45600192846126a0565b90549060031b1c5f526004602052610acf60405f206102bc610b0d85830154926102bc610afc6002830154926004610aeb600383015492865f52600a60205260405f2093600582015494855f5260205260405f2094885f52600c60205260405f20905f5260205260405f2060068301545f5260205260405f209760078301549b6040519d8e612453565b8d5260208d015260408c01526102bc604051809481930161239b565b60608901526040519283809261239b565b60808601526040519283809261239b565b60a083015260c0820152610b2182876125c2565b52610b2c81866125c2565b500161096f565b602090604051610b4281612453565b5f81525f838201525f604082015260608082015260606080820152606060a08201525f60c082015282828801015201610964565b346101b9575f3660031901126101b9575f546040516001600160a01b039091168152602090f35b346101b957610bab366122fc565b6101609182604051610bbd828261246e565b3690375f52600e60205260405f20905f5260205260405f2090600b82015460405192835f905b600b8210610c2957505050610bf8828461246e565b604051915f835b600b8210610c135750506101809350820152f35b6020806001928851815201960191019094610bff565b6001602081928554815201930191019091610be3565b346101b9575f3660031901126101b95760206040517f00000000000000000000000000000000000000000000000000000000000000008152f35b346101b9575f3660031901126101b957610d18610cb57f0000000000000000000000000000000000000000000000000000000000000000612c7e565b6102d7610ce17f0000000000000000000000000000000000000000000000000000000000000000612cda565b610d2660405191610cf360208461246e565b5f83525f368137604051958695600f60f81b875260e0602088015260e0870190612312565b908582036040870152612312565b904660608501523060808501525f60a085015283820360c08501526124ed565b346101b95760803660031901126101b9576004356024356044356001600160401b0381116101b957610d7c903690600401612336565b606435939184151585036101b957610d92612728565b825f52600a60205260405f20845f5260205260405f20946001600160401b03831161055957610dc18654612363565b601f8111610ee0575b505f95601f8411600114610e575790610e4791847fc9c1ae0a6fb65b3fc44b61a6cc769977fca4a7e8543caa636a406f35d1efd4b39697985f91610e4c575b508560011b905f198760031b1c19161790555b855f52600b60205260405f20875f5260205261046e8160405f209060ff801983541691151516179055565b0390a3005b905084013589610e09565b601f198416815f5260205f20905f5b818110610ec85750907fc9c1ae0a6fb65b3fc44b61a6cc769977fca4a7e8543caa636a406f35d1efd4b396979886610e4795949310610eaf575b5050600185811b019055610e1c565b8501355f19600388901b60f8161c191690558880610ea0565b858a013583556020998a019960019093019201610e66565b865f5260205f20601f850160051c81019160208610610f1b575b601f0160051c01905b818110610f105750610dca565b5f8155600101610f03565b9091508190610efa565b346101b9575f3660031901126101b957600154336001600160a01b0390911603610f9757600180546001600160a01b03199081169091555f805433928116831782556001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a3005b63118cdaa760e01b5f523360045260245ffd5b346101b9575f3660031901126101b9576020604051600a8152f35b346101b9575f3660031901126101b957610fdd612728565b600180546001600160a01b03199081169091555f80549182168155906001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a3005b346101b95760203660031901126101b957611041612663565b506004355f5260046020526102d760405f2060076040519161106283612437565b80548352600181015460208401526002810154604084015260038101546060840152604051611098816102bc816004860161239b565b6080840152600581015460a0840152600681015460c0840152015460e082015260405191829160208352602083019061248f565b346101b95760203660031901126101b9576001600160a01b036110ed6122e6565b165f526007602052602060405f2054604051908152f35b346101b957611112366122cc565b915f52600d60205260405f20905f5260205260405f20905f52602052602060ff60405f2054166040519015158152f35b346101b957611150366122fc565b905f52600560205260405f20905f5260205260405f20805461117181612543565b9161117f604051938461246e565b818352601f1961118e83612543565b015f5b8181106112a95750505f5b82811061120a57836040518091602082016020835281518091526040830190602060408260051b8601019301915f905b8282106111db57505050500390f35b919360019193955060206111fa8192603f198a8203018652885161248f565b96019201920185949391926111cc565b80611217600192846126a0565b90549060031b1c5f52600460205260405f2060076040519161123883612437565b80548352848101546020840152600281015460408401526003810154606084015260405161126d816102bc816004860161239b565b6080840152600581015460a0840152600681015460c0840152015460e082015261129782876125c2565b526112a281866125c2565b500161119c565b6020906112b4612663565b82828801015201611191565b346101b9575f3660031901126101b957602060405160648152f35b346101b95760203660031901126101b9576001600160a01b036112fc6122e6565b165f526006602052602060405f2054604051908152f35b346101b95760203660031901126101b9576004355f52600460205260405f208054600182015491600281015460038201549161139760405161135c816102bc816004870161239b565b600583015494600760068501549401549460405198899889526020890152604088015260608701526101006080870152610100860190612312565b9260a085015260c084015260e08301520390f35b346101b95760203660031901126101b95760043560018060a01b035f541633141580611459575b61144a576009546001600160a01b03165f81815260076020526040902054821061143b575f5260076020528060405f20557f2a6c71b52c2e0ec0d4c4ec428dd2e26c1b3c0bc97042d5ed16deeffb69b055c9602060018060a01b036009541692604051908152a2005b63529fe72f60e11b5f5260045ffd5b635c7698a360e11b5f5260045ffd5b506009546001600160a01b03163314156113d2565b346101b95761147c366122fc565b905f52600a60205260405f20905f526020526102d76102bc6102c360405f206040519283809261239b565b346101b95760603660031901126101b9576004356001600160401b0381116101b957366023820112156101b95780600401356080526001600160401b03608051116101b95736602460805160051b830101116101b9576044356001600160401b0381116101b95761151c903690600401612336565b60805115611fd3575f805b6080518210611faa576107d0915011611f9b576009546001600160a01b03169081156108d4577f00000000000000000000000000000000000000000000000000000000000000004603611f8c576115cd906115c560405160208101907f9835e583e3f8f1e4dfc48fe02a92fdbd9a76bc16eec83f3b1f70df2ffbc3b84a82526024356040820152604081526115bd60608261246e565b519020612c58565b938484612756565b15611f7d57805f52600760205260405f20548060243503611f6e576001915f5260076020520160405f2055611603608051612543565b91611611604051938461246e565b6080518352601f19611624608051612543565b015f5b818110611f5d57505061163b608051612543565b611648604051918261246e565b6080518152601f1961165b608051612543565b0136602083013761166d608051612543565b9161167b604051938461246e565b6080518352601f1961168e608051612543565b013660208501375f945f5b6080518110611d8557508515611730575f935f5b608051811061173f578787878015611730576009546080516001600160a01b0390911693810390811161171c577fcc50d873aa0e0708c11584529c18af24497ac00018c76faf48cb7a4c3396718f916080916040519160243583526020830152825160408301526060820152a3005b634e487b7160e01b5f52601160045260245ffd5b638894779f60e01b5f5260045ffd5b61174f81608051602487016125d6565b61175981806125f8565b909161176584896125c2565b5115611ccd5761177c81602061178193019061263a565b61264f565b908015611cc557606061179482856128a2565b013592915b5f60a08190529182918291906117ae826126f6565b955f915b8383106118de575050506117d1575b5050505050600101925b926116ad565b82159283611895576117e2816126f6565b945f5b82811061187657505050916001959493917f404ea7a72766782efe513e7a598669333a34933cf547408efb07888770920ffe935b8261186a575b821561185d5750505f5b60ff611849604051948594151585526060602086015260608501906124ed565b911660408301520390a290898080806117c1565b5f0361182957505f611829565b60a0511515925061181f565b80611883600192846125c2565b5161188e828a6125c2565b52016117e5565b5090600195949350917f404ea7a72766782efe513e7a598669333a34933cf547408efb07888770920ffe926020604051906118d0818361246e565b5f8252505f36813792611819565b90919d8b908f806118fd8d6118f7611903948a8a6128bd565b956125c2565b516125c2565b519060e083013580158015611c9d575b611c8f5760c08401359384158015611c85575b611c5057604081013594855f52600b60205260405f209160a081013592835f5260205260ff60405f20541615611c1957865f52600d60205260405f20835f5260205260405f20825f5260205260ff60405f20541615611bdb5760018060a01b0388165f52600860205260405f20865f5260205260405f20600160ff19825416179055855f52600460205260405f209080358255602081013560018301558760028301556060810135918260038201556119e7600482019260808101906128df565b9190926001600160401b038311610559578792611a048254612363565b601f8111611b87575b505f601f8211600114611b1c578190600795965f92611b11575b50508160011b915f199060031b1c19161790555b8560058201558460068201550155865f52600560205260405f20905f5260205260405f209081549268010000000000000000841015610559576001978897611aa6611a9087600b978c611afc9a0181556126a0565b819391549060031b91821b915f19901b19161790565b90555f52600e60205260405f20905f52602052611af1611aca60405f209283612520565b8192915490611ade88838360031b1c61262d565b919060031b91821b915f19901b19161790565b90550191825461262d565b9055019e8160a0510160a052015b91906117b2565b013590505f80611a27565b94601f19821695835f5260205f20965f5b818110611b6c5750916007969791846001959410611b53575b505050811b019055611a3b565b01355f19600384901b60f8161c191690555f8080611b46565b8284013589556001909801978c975060209283019201611b2d565b9091809394505f5260205f20601f830160051c81019160208410611bd1575b90601f8b96959493920160051c01905b818110611bc35750611a0d565b5f81558a9550600101611bb6565b9091508190611ba6565b939550505050611bfc9291509f97909f35611bf6828b6125c2565b52612b2e565b958415611c0c575b600101611b0a565b6006955060019450611c04565b939550505050611c349291509f97909f35611bf6828b6125c2565b958415611c4357600101611b0a565b6005955060019450611c04565b91935050611c699291509f97909f35611bf6828b6125c2565b958415611c7857600101611b0a565b6004955060019450611c04565b50600a8511611926565b509f90506001915001611b0a565b5060018060a01b0385165f52600860205260405f20835f5260205260ff60405f205416611913565b5f9291611799565b5080611cdf575b5050600101926117cb565b6060611ceb82846128a2565b013591611cf7826126f6565b915f5b818110611d6557505050907f404ea7a72766782efe513e7a598669333a34933cf547408efb07888770920ffe611d55849360ff611d39600197896125c2565b51166040519283925f84526060602085015260608401906124ed565b9060408301520390a29089611cd4565b80611d7360019284866128bd565b35611d7e82876125c2565b5201611cfa565b611da561177c611d9b83608051602488016125d6565b602081019061263a565b611dbe611db883608051602488016125d6565b806125f8565b9190611dc983612543565b92611dd7604051948561246e565b808452601f19611de682612543565b013660208601376001600160a01b03909216915f5b818110611e7d5750505050611e1082846125c2565b52611e1b81836125c2565b50611e4186611e3083608051602488016125d6565b611e3a84866125c2565b5190612911565b90611e61575b9060019160ff611e5783896125c2565b9116905201611699565b96906001809281611e7284896125c2565b520197909150611e47565b6064611e9f611e95839c9e9b9c85999e9b99876128bd565b60808101906128df565b905011611f4e5780611eb460019284866128bd565b60405160e060208201927fa1d8d8a9fe7a1cd934efad85a30531d6a5706082c92aec323624ec869a921e8a845260208101356040840152604081013560608401526060810135608084015260a081013560a084015260c081013560c0840152013560e0820152866101008201526101008152611f326101208261246e565b519020611f3f82886125c2565b52019a98979a99949699611dfb565b631623655b60e31b5f5260045ffd5b806060602080938801015201611627565b63213fcc3160e01b5f5260045ffd5b638baa579f60e01b5f5260045ffd5b638325596360e01b5f5260045ffd5b6305beb17160e11b5f5260045ffd5b611fcb600191611fc3611db88560805160248b016125d6565b91905061262d565b910190611527565b63613f4a1360e11b5f5260045ffd5b346101b957611ff0366122fc565b90805f52600e60205260405f20825f5260205260405f20915f60015b600a81111561217c575061201f9061255a565b925f9060015b600a8111156120be57856040518091602082016020835281518091526040830190602060408260051b8601019301915f905b82821061206657505050500390f35b919360019193955060208091603f198982030185528751908151815260608061209c858501516080878601526080850190612312565b9360408101516040850152015115159101529601920192018594939192612057565b845f52600c60205260405f20845f5260205260405f20815f526020526102bc6120f060405f206040519283809261239b565b8051612100575b50600101612025565b819360019291612111849386612520565b90549060031b1c885f52600d60205260405f20885f5260205260405f20875f5260205260ff60405f205416906040519261214a8461241c565b8884526020840152604083015215156060820152612168828a6125c2565b5261217381896125c2565b500192906120f7565b835f52600c60205260405f20835f5260205260405f20815f526020526121a560405f2054612363565b6121b2575b60010161200c565b6001909101906121aa565b346101b95760403660031901126101b9576121d66122e6565b602435906121e2612728565b6001600160a01b03165f81815260066020526040902054909190811061223c5760207f35abc581befc77c9e8fb7da843942a4364fe9e4bb8e510e5bdb640f0036d770691835f52600682528060405f2055604051908152a2005b63121a83e360e11b5f5260045ffd5b346101b957612259366122cc565b91821580156122a9575b6122965791612287916020935f52600e845260405f20905f52835260405f20612520565b90549060031b1c604051908152f35b8263768d03e960e11b5f5260045260245ffd5b50600a8311612263565b346101b9575f3660031901126101b95780601460209252f35b60609060031901126101b957600435906024359060443590565b600435906001600160a01b03821682036101b957565b60409060031901126101b9576004359060243590565b805180835260209291819084018484015e5f828201840152601f01601f1916010190565b9181601f840112156101b9578235916001600160401b0383116101b957602083818601950101116101b957565b90600182811c92168015612391575b602083101461237d57565b634e487b7160e01b5f52602260045260245ffd5b91607f1691612372565b5f92918154916123aa83612363565b80835292600181169081156123ff57506001146123c657505050565b5f9081526020812093945091925b8383106123e5575060209250010190565b6001816020929493945483858701015201910191906123d4565b915050602093945060ff929192191683830152151560051b010190565b608081019081106001600160401b0382111761055957604052565b61010081019081106001600160401b0382111761055957604052565b60e081019081106001600160401b0382111761055957604052565b90601f801991011681019081106001600160401b0382111761055957604052565b908151815260208201516020820152604082015160408201526060820151606082015260e0806124d060808501516101006080860152610100850190612312565b9360a081015160a085015260c081015160c0850152015191015290565b90602080835192838152019201905f5b81811061250a5750505090565b82518452602093840193909201916001016124fd565b600b82101561252f5701905f90565b634e487b7160e01b5f52603260045260245ffd5b6001600160401b0381116105595760051b60200190565b9061256482612543565b612571604051918261246e565b8281528092612582601f1991612543565b01905f5b82811061259257505050565b6020906040516125a18161241c565b5f81526060838201525f60408201525f606082015282828501015201612586565b805182101561252f5760209160051b010190565b919081101561252f5760051b81013590603e19813603018212156101b9570190565b903590601e19813603018212156101b957018035906001600160401b0382116101b957602001918160051b360383136101b957565b9190820180921161171c57565b903590605e19813603018212156101b9570190565b356001600160a01b03811681036101b95790565b6040519061267082612437565b5f60e083828152826020820152826040820152826060820152606060808201528260a08201528260c08201520152565b805482101561252f575f5260205f2001905f90565b908060209392818452848401375f828201840152601f01601f1916010190565b916020916126ee919594956040855260408501916126b5565b931515910152565b9061270082612543565b61270d604051918261246e565b828152809261271e601f1991612543565b0190602036910137565b5f546001600160a01b03163303610f9757565b6001600160401b03811161055957601f01601f191660200190565b92919091833b1561284a57915f93916127a685946127986040519384926020840196630b135d3f60e11b885260248501526040604485015260648401916126b5565b03601f19810183528261246e565b51915afa3d15612843573d6127ba8161273b565b906127c8604051928361246e565b81523d5f602083013e5b81612837575b816127e1575090565b80516020909101516001600160e01b03198116925060048210612817575b50506001600160e01b031916630b135d3f60e11b1490565b6001600160e01b031960049290920360031b82901b161690505f806127ff565b805160041491506127d8565b60606127d2565b92916128558461273b565b90612863604051928361246e565b84825236858401116101b9575f60208661289197612888968387013784010152612d11565b90939193612d4b565b6001600160a01b0391821691161490565b901561252f5780359060fe19813603018212156101b9570190565b919081101561252f5760051b8101359060fe19813603018212156101b9570190565b903590601e19813603018212156101b957018035906001600160401b0382116101b9576020019181360383136101b957565b919061292c61292084806125f8565b9460208101915061263a565b926129368461264f565b9360208101359282158015612b24575b612adb5760405160208101918260208251919201905f5b818110612ac55750505090612980816129f295949303601f19810183528261246e565b519020956129ea6129df60405160208101907fffa38b52b3794fa160256e68781327917915a9d4bded223f53d0414603dd37b8825260018060a01b0385169a8b60408301528960608301526080820152608081526115bd60a08261246e565b9260408101906128df565b929091612756565b15612a8c57835f52600660205260405f2054808303612a52579160409160017fde9782b6ede4a1d22e2929e1f7757daf3be1d657007a7f02d7d02050721cf47894875f52600660205201835f205582519182526020820152a36001905f90565b505060407f1a27036f4eb7d046165dd3c2d29117a18b873fc3cc71b0c4320b65fbf51b4d2b91815190815260036020820152a35f90600390565b5060407f1a27036f4eb7d046165dd3c2d29117a18b873fc3cc71b0c4320b65fbf51b4d2b91815190815260026020820152a35f90600290565b825184526020938401939092019160010161295d565b505060408051928352600160208401526001600160a01b03909416937f1a27036f4eb7d046165dd3c2d29117a18b873fc3cc71b0c4320b65fbf51b4d2b92909150a35f90600190565b5060148311612946565b5f19811461171c5760010190565b307f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03161480612c2f575b15612b97577f000000000000000000000000000000000000000000000000000000000000000090565b60405160208101907f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f82527f000000000000000000000000000000000000000000000000000000000000000060408201527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a082015260a08152612c2960c08261246e565b51902090565b507f00000000000000000000000000000000000000000000000000000000000000004614612b6e565b604290612c63612b3c565b906040519161190160f01b8352600283015260228201522090565b60ff8114612cc45760ff811690601f8211612cb55760405191612ca260408461246e565b6020808452838101919036833783525290565b632cd44ac360e21b5f5260045ffd5b50604051612cd7816102bc81600261239b565b90565b60ff8114612cfe5760ff811690601f8211612cb55760405191612ca260408461246e565b50604051612cd7816102bc81600361239b565b8151919060418303612d4157612d3a9250602082015190606060408401519301515f1a90612dbf565b9192909190565b50505f9160029190565b6004811015612dab5780612d5d575050565b60018103612d745763f645eedf60e01b5f5260045ffd5b60028103612d8f575063fce698f760e01b5f5260045260245ffd5b600314612d995750565b6335e2f38360e21b5f5260045260245ffd5b634e487b7160e01b5f52602160045260245ffd5b91907f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a08411612e41579160209360809260ff5f9560405194855216868401526040830152606082015282805260015afa15612e36575f516001600160a01b03811615612e2c57905f905f90565b505f906001905f90565b6040513d5f823e3d90fd5b5050505f916003919056fea264697066735822122027e80098f4e537947550737354513c3069cd637b8f1224af0d0cb21bf836d89764736f6c634300081e0033";