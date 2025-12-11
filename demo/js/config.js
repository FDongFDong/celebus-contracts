/**
 * MainVoting Demo Configuration
 * 컨트랙트 주소, ABI, 기본값 등을 관리합니다
 */

export const CONFIG = {
  // Network Configuration
  CHAIN_ID: 5611,
  CHAIN_NAME: 'opBNB Testnet',
  RPC_URL: 'https://opbnb-testnet-rpc.bnbchain.org',

  // Contract Configuration
  VOTING_ADDRESS: 'NEW_CONTRACT_ADDRESS', // 새로 배포된 MainVoting 컨트랙트 주소

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
    "name": "MAX_VOTE_TYPE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "VOTE_TYPE_FORGET",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "VOTE_TYPE_REMEMBER",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
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
    "name": "allowedArtist",
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
    "name": "artistName",
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
    "name": "artistStats",
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
        "name": "remember",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "forget",
        "type": "uint256",
        "internalType": "uint256"
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
    "name": "getArtistAggregates",
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
    ],
    "outputs": [
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
        "internalType": "struct MainVoting.VoteRecordSummary[]",
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
            "name": "votingFor",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "votedOn",
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
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setArtist",
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
      },
      {
        "name": "name",
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
    "name": "setVoteTypeName",
    "inputs": [
      {
        "name": "voteType",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "name",
        "type": "string",
        "internalType": "string"
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
        "internalType": "struct MainVoting.UserVoteBatch[]",
        "components": [
          {
            "name": "records",
            "type": "tuple[]",
            "internalType": "struct MainVoting.VoteRecord[]",
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
                "name": "optionId",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "voteType",
                "type": "uint8",
                "internalType": "uint8"
              },
              {
                "name": "userId",
                "type": "string",
                "internalType": "string"
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
            "internalType": "struct MainVoting.UserBatchSig",
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
    "name": "voteTypeName",
    "inputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
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
        "name": "optionId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "voteType",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "userId",
        "type": "string",
        "internalType": "string"
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
    "name": "ArtistSet",
    "inputs": [
      {
        "name": "missionId",
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
        "name": "name",
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
    "type": "event",
    "name": "VoteTypeSet",
    "inputs": [
      {
        "name": "voteType",
        "type": "uint8",
        "indexed": true,
        "internalType": "uint8"
      },
      {
        "name": "name",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "ArtistNotAllowed",
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
    "name": "InvalidVoteType",
    "inputs": [
      {
        "name": "value",
        "type": "uint8",
        "internalType": "uint8"
      }
    ]
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
    4: { name: 'INVALID_VOTE_TYPE', message: 'voteType 범위 오류 (0 또는 1만 허용)', alert: true },
    5: { name: 'ARTIST_NOT_ALLOWED', message: '허용되지 않은 아티스트', alert: true }
  },

  // EIP-712 Domain Configuration
  DOMAIN: {
    name: 'MainVoting',
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
    optionId: 1,
    voteType: 1, // 1 = Remember, 0 = Forget
    votingAmt: 100
  },

  // Limits
  MAX_RECORDS_PER_BATCH: 20,
  MAX_RECORDS_PER_USER: 20,

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

// MainVoting Contract Bytecode (embedded for file:/// protocol support)
export const MAINVOTING_BYTECODE = "0x61018080604052346101d957602081612968803803809161002082856101dd565b8339810103126101d957516001600160a01b038116908190036101d9576040519061004c6040836101dd565b600a825260208201694d61696e566f74696e6760b01b8152604051926100736040856101dd565b600184526020840192603160f81b845280156101c657600180546001600160a01b03199081169091555f8054918216831781556001600160a01b03909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a36100df81610214565b610120526100ec846103af565b61014052519020918260e05251902080610100524660a0526040519060208201927f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f8452604083015260608201524660808201523060a082015260a0815261015560c0826101dd565b5190206080523060c052466101605260405161248090816104e8823960805181612031015260a051816120ee015260c05181611ffb015260e05181612080015261010051816120a6015261012051816108730152610140518161089f0152610160518181816108380152610ce40152f35b631e4fbdf760e01b5f525f60045260245ffd5b5f80fd5b601f909101601f19168101906001600160401b0382119082101761020057604052565b634e487b7160e01b5f52604160045260245ffd5b908151602081105f1461028e575090601f81511161024e57602081519101516020821061023f571790565b5f198260200360031b1b161790565b604460209160405192839163305a27a960e01b83528160048401528051918291826024860152018484015e5f828201840152601f01601f19168101030190fd5b6001600160401b03811161020057600254600181811c911680156103a5575b602082101461039157601f811161035e575b50602092601f82116001146102fd57928192935f926102f2575b50508160011b915f199060031b1c19161760025560ff90565b015190505f806102d9565b601f1982169360025f52805f20915f5b868110610346575083600195961061032e575b505050811b0160025560ff90565b01515f1960f88460031b161c191690555f8080610320565b9192602060018192868501518155019401920161030d565b60025f52601f60205f20910160051c810190601f830160051c015b81811061038657506102bf565b5f8155600101610379565b634e487b7160e01b5f52602260045260245ffd5b90607f16906102ad565b908151602081105f146103da575090601f81511161024e57602081519101516020821061023f571790565b6001600160401b03811161020057600354600181811c911680156104dd575b602082101461039157601f81116104aa575b50602092601f821160011461044957928192935f9261043e575b50508160011b915f199060031b1c19161760035560ff90565b015190505f80610425565b601f1982169360035f52805f20915f5b868110610492575083600195961061047a575b505050811b0160035560ff90565b01515f1960f88460031b161c191690555f808061046c565b91926020600181928685015181550194019201610459565b60035f52601f60205f20910160051c810190601f830160051c015b8181106104d2575061040b565b5f81556001016104c5565b90607f16906103f956fe6080806040526004361015610012575f80fd5b5f3560e01c908163032e1a401461184a5750806304136353146109285780630a19c4a9146118165780630ab57023146117885780631dcc3b38146116c55780632b38cd96146116325780632e04b8e7146115fa57806334818a27146115e057806334ccc5ea146115c5578063524578e01461159657806363674b0714610c3a5780636768d0b91461024d5780636a606b0614610a4d5780636eacfe5014610a15578063715018a6146109b257806379ba50971461092d5780637ffc587b1461092857806384b0196e1461085b57806385e1f4d0146108215780638da5cb5b146107fa578063a670b24e1461061b578063ab38b7bd146105d5578063b40f68ce146103a6578063c00e0e2514610312578063e29dfba8146102c9578063e30c3978146102a1578063f013b2861461024d578063f2fde38b146101db578063f698da25146101b9578063f6de30b6146101915763fd81654e14610171575f80fd5b3461018d575f36600319011261018d5760206040516107d08152f35b5f80fd5b3461018d575f36600319011261018d576009546040516001600160a01b039091168152602090f35b3461018d575f36600319011261018d5760206101d3611ff8565b604051908152f35b3461018d57602036600319011261018d576101f4611894565b6101fc611b53565b60018060a01b0316806bffffffffffffffffffffffff60a01b600154161760015560018060a01b035f54167f38d16b8cac22d99fc7c124b9cd0de2d3fa1faef420bfe791d8c362d765e227005f80a3005b3461018d5761025b3661187e565b905f52600d60205260405f20905f5260205260405f20805461029d60026001840154930154604051938493846040919493926060820195825260208201520152565b0390f35b3461018d575f36600319011261018d576001546040516001600160a01b039091168152602090f35b3461018d57604036600319011261018d576001600160a01b036102ea611894565b165f52600860205260405f206024355f52602052602060ff60405f2054166040519015158152f35b3461018d57602036600319011261018d5761032b611894565b610333611b53565b6001600160a01b0316801561039757600980545f83815260076020526040812081905582546001600160a01b03191684179092556001600160a01b0316907f7b430a84222a519230743a1a600e19cbaf3386e1074a55b0ae7bedf74419406c9080a3005b63d92e233d60e01b5f5260045ffd5b3461018d576103b43661187e565b905f52600560205260405f20905f5260205260405f2080546103d581611aca565b916103e360405193846118fd565b818352601f196103f283611aca565b015f5b8181106105925750505f5b8281106104c957836040518091602082016020835281518091526040830190602060408260051b8601019301915f905b82821061043f57505050500390f35b919360019193955060208091603f198982030185528751908151815282820151838201526040820151604082015260c0806104b36104a161048f606087015160e0606088015260e08701906119be565b608087015186820360808801526119be565b60a086015185820360a08701526119be565b9301519101529601920192018594939192610430565b806104d660019284611b3e565b90549060031b1c5f52600460205260405f20828101549061056c600282015491610562600382015491845f52600a60205260405f2060048201545f52602052610558600660405f209260ff6005820154165f52600c60205260405f20956007820154986040519a6105468c6118e2565b8b5260208b015260408a01520161191e565b606087015261191e565b608085015261191e565b60a083015260c08201526105808287611b0a565b5261058b8186611b0a565b5001610400565b6020906040516105a1816118e2565b5f81525f838201525f604082015260608082015260606080820152606060a08201525f60c0820152828288010152016103f5565b3461018d57602036600319011261018d5760ff6105f0611a42565b165f52600c60205261029d61060760405f2061191e565b6040519182916020835260208301906119be565b3461018d57604036600319011261018d57610634611a42565b602435906001600160401b03821161018d5761065660ff9236906004016119e2565b929091610661611b53565b1690600182116107e757815f52600c60205260405f20926001600160401b0381116107d35761069084546118aa565b601f811161078e575b505f93601f821160011461070c57817f54cf46c7df15a042c83c529440104b7dec0de5ed404068839761777f7cb61ee094955f91610701575b508260011b905f198460031b1c19161790555b6106fc604051928392602084526020840191611b1e565b0390a2005b9050830135866106d2565b601f19821694815f5260205f20905f5b8781106107765750837f54cf46c7df15a042c83c529440104b7dec0de5ed404068839761777f7cb61ee096971061075d575b5050600182811b0190556106e5565b8401355f19600385901b60f8161c19169055858061074e565b9091602060018192858901358155019301910161071c565b845f5260205f20601f830160051c810191602084106107c9575b601f0160051c01905b8181106107be5750610699565b5f81556001016107b1565b90915081906107a8565b634e487b7160e01b5f52604160045260245ffd5b50632081b22360e01b5f5260045260245ffd5b3461018d575f36600319011261018d575f546040516001600160a01b039091168152602090f35b3461018d575f36600319011261018d5760206040517f00000000000000000000000000000000000000000000000000000000000000008152f35b3461018d575f36600319011261018d576108fa6108977f000000000000000000000000000000000000000000000000000000000000000061213a565b61029d6108c37f0000000000000000000000000000000000000000000000000000000000000000612237565b610908604051916108d56020846118fd565b5f83525f368137604051958695600f60f81b875260e0602088015260e08701906119be565b9085820360408701526119be565b904660608501523060808501525f60a085015283820360c0850152611a0f565b611863565b3461018d575f36600319011261018d57600154336001600160a01b039091160361099f57600180546001600160a01b03199081169091555f805433928116831782556001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a3005b63118cdaa760e01b5f523360045260245ffd5b3461018d575f36600319011261018d576109ca611b53565b600180546001600160a01b03199081169091555f80549182168155906001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a3005b3461018d57602036600319011261018d576001600160a01b03610a36611894565b165f526007602052602060405f2054604051908152f35b3461018d57608036600319011261018d576004356024356044356001600160401b03811161018d57610a839036906004016119e2565b92906064359384151580950361018d57610a9b611b53565b825f52600a60205260405f20845f5260205260405f20946001600160401b0382116107d357610aca86546118aa565b601f8111610bf5575b505f95601f8311600114610b7057827fc493b0f714207d712988efdf95df7c44b2783c014b736b6d8684fdee50859cf69596975f91610b65575b508360011b905f198560031b1c19161790555b845f52600b60205260405f20865f5260205260405f2060ff1981541660ff8316179055610b5a604051938493604085526040850191611b1e565b9060208301520390a3005b905084013588610b0d565b601f19831696815f5260205f20975f5b818110610bdd575090847fc493b0f714207d712988efdf95df7c44b2783c014b736b6d8684fdee50859cf69798999210610bc4575b5050600183811b019055610b20565b8501355f19600386901b60f8161c191690558780610bb5565b868301358a5560019099019860209283019201610b80565b865f5260205f20601f840160051c81019160208510610c30575b601f0160051c01905b818110610c255750610ad3565b5f8155600101610c18565b9091508190610c0f565b3461018d57606036600319011261018d576004356001600160401b03811161018d573660238201121561018d578060040135906001600160401b03821161018d576024810190602436918460051b01011161018d57602435916044356001600160401b03811161018d57610cb29036906004016119e2565b8293919315611587575f805b848210611563576107d0915011611554576009546001600160a01b0316908115610397577f0000000000000000000000000000000000000000000000000000000000000000460361154557610d6090610d5860405160208101907f9835e583e3f8f1e4dfc48fe02a92fdbd9a76bc16eec83f3b1f70df2ffbc3b84a825289604082015260408152610d506060826118fd565b519020612114565b958684611b81565b1561153657805f52600760205260405f2054808603611527576001915f5260076020520160405f2055610d9282611aca565b93610da060405195866118fd565b828552601f19610daf84611aca565b015f5b818110611516575050610dc483611aca565b94610dd260405196876118fd565b838652601f19610de185611aca565b01366020880137610df184611aca565b92610dff60405194856118fd565b848452601f19610e0e86611aca565b013660208601375f965f5b86811061135157508715610ea4575f945f5b878110610eb35750505050508115610ea4576009546001600160a01b0316948303838111610e90577fcc50d873aa0e0708c11584529c18af24497ac00018c76faf48cb7a4c3396718f93608093604051938452602084015260408301526060820152a3005b634e487b7160e01b5f52601160045260245ffd5b638894779f60e01b5f5260045ffd5b610ebe818986611a52565b610ec88180611a88565b9091610ed48487611b0a565b511561127657610eeb816020610ef0930190611ae1565b611af6565b9181158015929061126d576060610f078284611ccd565b01359391905b5f926001600160a01b0316905b808410610f9a57505050509060019291610f39575b5001925b92610e2b565b7f404ea7a72766782efe513e7a598669333a34933cf547408efb07888770920ffe60606020610f8b604051610f6e83826118fd565b5f81525f3681376040519384938985528401526060830190611a0f565b5f60408301520390a28b610f2f565b9091929b8a90610fbf8e610fb98a610fb383888b611ce8565b95611b0a565b51611b0a565b519060e08301358015801561124d575b61123e57855f52600860205260405f20835f5260205260405f20600160ff19825416179055825f52600460205260405f2084358155602085013560018201556040850135948560028301556060810135806003840155608082013591826004850155600584019360a082019460ff61104687611d0a565b1660ff19825416179055611062600682019260c0810190611d18565b9190926001600160401b0383116107d357879261107f82546118aa565b601f81116111ea575b505f601f821160011461117f578190600795965f92611174575b50508160011b915f199060031b1c19161790555b0155865f52600560205260405f20905f5260205260405f2091825491680100000000000000008310156107d35760019788976110fc8561114f978b600298018155611b3e565b819291549060031b91821b915f19901b19161790555f52600d60205260405f20905f526020528560ff61113260405f2093611d0a565b160361115f57611143848254611abd565b81555b01918254611abd565b9055019c01905b92919092610f1a565b85810161116d858254611abd565b9055611146565b013590505f806110a2565b94601f19821695835f5260205f20965f5b8181106111cf57509160079697918460019594106111b6575b505050811b0190556110b6565b01355f19600384901b60f8161c191690555f80806111a9565b8284013589556001909801978c975060209283019201611190565b9091809394505f5260205f20601f830160051c81019160208410611234575b90601f8b96959493920160051c01905b8181106112265750611088565b5f81558a9550600101611219565b9091508190611209565b509d9050600191500190611156565b50855f52600860205260405f20835f5260205260ff60405f205416610fcf565b5f939190610f0d565b5080611288575b505060010192610f33565b60606112948284611ccd565b0135916112a082611aca565b916112ae60405193846118fd565b808352601f196112bd82611aca565b013660208501375f5b81811061133157505050907f404ea7a72766782efe513e7a598669333a34933cf547408efb07888770920ffe611321849360ff61130560019789611b0a565b51166040519283925f8452606060208501526060840190611a0f565b9060408301520390a2908b61127d565b8061133f6001928486611ce8565b3561134a8287611b0a565b52016112c6565b61136c610eeb611362838a87611a52565b6020810190611ae1565b61138061137a838a87611a52565b80611a88565b919061138b83611aca565b9261139960405194856118fd565b808452601f196113a882611aca565b013660208601376001600160a01b03909216915f5b81811061143a57505050506113d28286611b0a565b526113dd8185611b0a565b506113fe886113ed838a87611a52565b6113f78488611b0a565b5190611d4a565b9061141e575b9060019160ff611414838a611b0a565b9116905201610e19565b9890600180928161142f8487611b0a565b520199909150611404565b606461145461144a838587611ce8565b60c0810190611d18565b90501161150757806114696001928486611ce8565b61147560a08201611d0a565b9060e06040519160ff60208401947f0a988988f17d3e106a27abc736f142846ce01b2d9b625c96fe145e71be8cc1ec8652602083013560408601526040830135606086015260608301356080860152608083013560a08601521660c0840152013560e08201528661010082015261010081526114f3610120826118fd565b5190206115008288611b0a565b52016113bd565b631623655b60e31b5f5260045ffd5b806060602080938a01015201610db2565b63213fcc3160e01b5f5260045ffd5b638baa579f60e01b5f5260045ffd5b638325596360e01b5f5260045ffd5b6305beb17160e11b5f5260045ffd5b61157f60019161157761137a858989611a52565b919050611abd565b910190610cbe565b63613f4a1360e11b5f5260045ffd5b3461018d576115a43661187e565b905f52600a60205260405f20905f5260205261029d61060760405f2061191e565b3461018d575f36600319011261018d57602060405160648152f35b3461018d575f36600319011261018d5760206040515f8152f35b3461018d57602036600319011261018d576001600160a01b0361161b611894565b165f526006602052602060405f2054604051908152f35b3461018d57602036600319011261018d576004355f52600460205260405f2080546001820154916116bb6002820154916003810154600482015460ff6005840154169160076116836006860161191e565b940154956040519889988952602089015260408801526060870152608086015260a085015261010060c08501526101008401906119be565b9060e08301520390f35b3461018d57602036600319011261018d5760043560018060a01b035f541633141580611773575b611764576009546001600160a01b03165f818152600760205260409020548210611755575f5260076020528060405f20557f2a6c71b52c2e0ec0d4c4ec428dd2e26c1b3c0bc97042d5ed16deeffb69b055c9602060018060a01b036009541692604051908152a2005b63529fe72f60e11b5f5260045ffd5b635c7698a360e11b5f5260045ffd5b506009546001600160a01b03163314156116ec565b3461018d57604036600319011261018d576117a1611894565b602435906117ad611b53565b6001600160a01b03165f8181526006602052604090205490919081106118075760207f35abc581befc77c9e8fb7da843942a4364fe9e4bb8e510e5bdb640f0036d770691835f52600682528060405f2055604051908152a2005b63121a83e360e11b5f5260045ffd5b3461018d576118243661187e565b905f52600b60205260405f20905f52602052602060ff60405f2054166040519015158152f35b3461018d575f36600319011261018d5780601460209252f35b3461018d575f36600319011261018d57602060405160018152f35b604090600319011261018d576004359060243590565b600435906001600160a01b038216820361018d57565b90600182811c921680156118d8575b60208310146118c457565b634e487b7160e01b5f52602260045260245ffd5b91607f16916118b9565b60e081019081106001600160401b038211176107d357604052565b90601f801991011681019081106001600160401b038211176107d357604052565b9060405191825f825492611931846118aa565b808452936001811690811561199c5750600114611958575b50611956925003836118fd565b565b90505f9291925260205f20905f915b818310611980575050906020611956928201015f611949565b6020919350806001915483858901015201910190918492611967565b90506020925061195694915060ff191682840152151560051b8201015f611949565b805180835260209291819084018484015e5f828201840152601f01601f1916010190565b9181601f8401121561018d578235916001600160401b03831161018d576020838186019501011161018d57565b90602080835192838152019201905f5b818110611a2c5750505090565b8251845260209384019390920191600101611a1f565b6004359060ff8216820361018d57565b9190811015611a745760051b81013590603e198136030182121561018d570190565b634e487b7160e01b5f52603260045260245ffd5b903590601e198136030182121561018d57018035906001600160401b03821161018d57602001918160051b3603831361018d57565b91908201809211610e9057565b6001600160401b0381116107d35760051b60200190565b903590605e198136030182121561018d570190565b356001600160a01b038116810361018d5790565b8051821015611a745760209160051b010190565b908060209392818452848401375f828201840152601f01601f1916010190565b8054821015611a74575f5260205f2001905f90565b5f546001600160a01b0316330361099f57565b6001600160401b0381116107d357601f01601f191660200190565b92919091833b15611c7557915f9391611bd18594611bc36040519384926020840196630b135d3f60e11b88526024850152604060448501526064840191611b1e565b03601f1981018352826118fd565b51915afa3d15611c6e573d611be581611b66565b90611bf360405192836118fd565b81523d5f602083013e5b81611c62575b81611c0c575090565b80516020909101516001600160e01b03198116925060048210611c42575b50506001600160e01b031916630b135d3f60e11b1490565b6001600160e01b031960049290920360031b82901b161690505f80611c2a565b80516004149150611c03565b6060611bfd565b9291611c8084611b66565b90611c8e60405192836118fd565b848252368584011161018d575f602086611cbc97611cb39683870137840101526122ef565b90939193612329565b6001600160a01b0391821691161490565b9015611a745780359060fe198136030182121561018d570190565b9190811015611a745760051b8101359060fe198136030182121561018d570190565b3560ff8116810361018d5790565b903590601e198136030182121561018d57018035906001600160401b03821161018d5760200191813603831361018d57565b919091611d578180611a88565b9050611d666020830183611ae1565b611d6f81611af6565b9460208201359383158015611fee575b611fbb575f5b848110611ef957505060405160208101918260208251919201905f5b818110611ee35750505090611dc481611e3695949303601f1981018352826118fd565b51902095611e2e611e2360405160208101907fffa38b52b3794fa160256e68781327917915a9d4bded223f53d0414603dd37b8825260018060a01b0385169a8b6040830152896060830152608082015260808152610d5060a0826118fd565b926040810190611d18565b929091611b81565b15611ebd57835f52600660205260405f2054808303611e96579160409160017fde9782b6ede4a1d22e2929e1f7757daf3be1d657007a7f02d7d02050721cf47894875f52600660205201835f205582519182526020820152a36001905f90565b505060405f51602061242b5f395f51905f5291815190815260036020820152a35f90600390565b5060405f51602061242b5f395f51905f5291815190815260026020820152a35f90600290565b8251845260209384019390920191600101611da1565b611f0d81611f078480611a88565b90611ce8565b600160ff611f1d60a08401611d0a565b1611611f865760408101355f52600b602052608060405f209101355f5260205260ff60405f20541615611f5257600101611d85565b50505050509160405f51602061242b5f395f51905f529181519485526005602086015260018060a01b031693a35f90600590565b5050505050509160405f51602061242b5f395f51905f529181519485526004602086015260018060a01b031693a35f90600490565b505050509160405f51602061242b5f395f51905f529181519485526001602086015260018060a01b031693a35f90600190565b5060148411611d7f565b307f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031614806120eb575b15612053577f000000000000000000000000000000000000000000000000000000000000000090565b60405160208101907f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f82527f000000000000000000000000000000000000000000000000000000000000000060408201527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a082015260a081526120e560c0826118fd565b51902090565b507f0000000000000000000000000000000000000000000000000000000000000000461461202a565b60429061211f611ff8565b906040519161190160f01b8352600283015260228201522090565b60ff81146121805760ff811690601f8211612171576040519161215e6040846118fd565b6020808452838101919036833783525290565b632cd44ac360e21b5f5260045ffd5b50604051600254815f612192836118aa565b808352926001811690811561221857506001146121b9575b6121b6925003826118fd565b90565b5060025f90815290917f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace5b8183106121fc5750509060206121b6928201016121aa565b60209193508060019154838588010152019101909183926121e4565b602092506121b694915060ff191682840152151560051b8201016121aa565b60ff811461225b5760ff811690601f8211612171576040519161215e6040846118fd565b50604051600354815f61226d836118aa565b80835292600181169081156122185750600114612290576121b6925003826118fd565b5060035f90815290917fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b5b8183106122d35750509060206121b6928201016121aa565b60209193508060019154838588010152019101909183926122bb565b815191906041830361231f576123189250602082015190606060408401519301515f1a9061239d565b9192909190565b50505f9160029190565b6004811015612389578061233b575050565b600181036123525763f645eedf60e01b5f5260045ffd5b6002810361236d575063fce698f760e01b5f5260045260245ffd5b6003146123775750565b6335e2f38360e21b5f5260045260245ffd5b634e487b7160e01b5f52602160045260245ffd5b91907f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0841161241f579160209360809260ff5f9560405194855216868401526040830152606082015282805260015afa15612414575f516001600160a01b0381161561240a57905f905f90565b505f906001905f90565b6040513d5f823e3d90fd5b5050505f916003919056fe1a27036f4eb7d046165dd3c2d29117a18b873fc3cc71b0c4320b65fbf51b4d2ba26469706673582212208ce4640fbbf7367f48ac635d92f6ca79331c3694080e855e4e90898ffaf2922064736f6c634300081e0033";
