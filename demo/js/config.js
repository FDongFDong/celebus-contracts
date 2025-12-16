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
    "name": "UserNonceAlreadyUsed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroAddress",
    "inputs": []
  }
]

,
  // 실패 사유 코드 (reasonCode)
  REASON_CODES: {
    0: { name: 'SUCCESS', message: '성공', alert: false },
    1: { name: 'USER_BATCH_TOO_LARGE', message: '배치 레코드 수 초과 (최대 20개)', alert: true },
    2: { name: 'INVALID_USER_SIGNATURE', message: '서명 검증 실패', alert: true },
    3: { name: 'USER_NONCE_INVALID', message: 'Nonce 중복 사용 (이미 사용된 nonce)', alert: true },
    4: { name: 'INVALID_VOTE_TYPE', message: 'voteType 범위 오류 (0 또는 1만 허용)', alert: true },
    5: { name: 'ARTIST_NOT_ALLOWED', message: '허용되지 않은 아티스트', alert: true },
    6: { name: 'STRING_TOO_LONG', message: '문자열 길이 초과 (userId > 100자)', alert: true }
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
export const MAINVOTING_BYTECODE = "0x61018080604052346101d957602081612a7a803803809161002082856101dd565b8339810103126101d957516001600160a01b038116908190036101d9576040519061004c6040836101dd565b600a825260208201694d61696e566f74696e6760b01b8152604051926100736040856101dd565b600184526020840192603160f81b845280156101c657600180546001600160a01b03199081169091555f8054918216831781556001600160a01b03909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a36100df81610214565b610120526100ec846103af565b61014052519020918260e05251902080610100524660a0526040519060208201927f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f8452604083015260608201524660808201523060a082015260a0815261015560c0826101dd565b5190206080523060c052466101605260405161259290816104e8823960805181612143015260a05181612200015260c0518161210d015260e05181612192015261010051816121b801526101205181610894015261014051816108c00152610160518181816108590152610ccb0152f35b631e4fbdf760e01b5f525f60045260245ffd5b5f80fd5b601f909101601f19168101906001600160401b0382119082101761020057604052565b634e487b7160e01b5f52604160045260245ffd5b908151602081105f1461028e575090601f81511161024e57602081519101516020821061023f571790565b5f198260200360031b1b161790565b604460209160405192839163305a27a960e01b83528160048401528051918291826024860152018484015e5f828201840152601f01601f19168101030190fd5b6001600160401b03811161020057600254600181811c911680156103a5575b602082101461039157601f811161035e575b50602092601f82116001146102fd57928192935f926102f2575b50508160011b915f199060031b1c19161760025560ff90565b015190505f806102d9565b601f1982169360025f52805f20915f5b868110610346575083600195961061032e575b505050811b0160025560ff90565b01515f1960f88460031b161c191690555f8080610320565b9192602060018192868501518155019401920161030d565b60025f52601f60205f20910160051c810190601f830160051c015b81811061038657506102bf565b5f8155600101610379565b634e487b7160e01b5f52602260045260245ffd5b90607f16906102ad565b908151602081105f146103da575090601f81511161024e57602081519101516020821061023f571790565b6001600160401b03811161020057600354600181811c911680156104dd575b602082101461039157601f81116104aa575b50602092601f821160011461044957928192935f9261043e575b50508160011b915f199060031b1c19161760035560ff90565b015190505f80610425565b601f1982169360035f52805f20915f5b868110610492575083600195961061047a575b505050811b0160035560ff90565b01515f1960f88460031b161c191690555f808061046c565b91926020600181928685015181550194019201610459565b60035f52601f60205f20910160051c810190601f830160051c015b8181106104d2575061040b565b5f81556001016104c5565b90607f16906103f956fe60c0806040526004361015610012575f80fd5b5f3560e01c908163032e1a401461198c5750806304136353146109495780630a19c4a9146119585780632b38cd96146118c557806334818a27146118ab57806334ccc5ea14611890578063524578e014611861578063574df9321461181857806363674b0714610c235780636768d0b9146102805780636a606b0614610a36578063715018a6146109d357806379ba50971461094e5780637ffc587b1461094957806384b0196e1461087c57806385e1f4d0146108425780638da5cb5b1461081b578063a670b24e1461063c578063ab38b7bd146105f6578063b40f68ce146103c7578063c00e0e2514610345578063e29dfba8146102fc578063e30c3978146102d4578063f013b28614610280578063f2fde38b1461020e578063f698da25146101ec578063f6de30b6146101c4578063f7feca8a1461017b5763fd81654e1461015b575f80fd5b34610177575f3660031901126101775760206040516107d08152f35b5f80fd5b34610177576040366003190112610177576001600160a01b0361019c611b0e565b165f52600660205260405f206024355f52602052602060ff60405f2054166040519015158152f35b34610177575f366003190112610177576009546040516001600160a01b039091168152602090f35b34610177575f36600319011261017757602061020661210a565b604051908152f35b3461017757602036600319011261017757610227611b0e565b61022f6120f7565b60018060a01b0316806bffffffffffffffffffffffff60a01b600154161760015560018060a01b035f54167f38d16b8cac22d99fc7c124b9cd0de2d3fa1faef420bfe791d8c362d765e227005f80a3005b346101775761028e366119c0565b905f52600d60205260405f20905f5260205260405f2080546102d060026001840154930154604051938493846040919493926060820195825260208201520152565b0390f35b34610177575f366003190112610177576001546040516001600160a01b039091168152602090f35b34610177576040366003190112610177576001600160a01b0361031d611b0e565b165f52600860205260405f206024355f52602052602060ff60405f2054166040519015158152f35b346101775760203660031901126101775761035e611b0e565b6103666120f7565b6001600160a01b031680156103b857600980546001600160a01b0319811683179091556001600160a01b03167f7b430a84222a519230743a1a600e19cbaf3386e1074a55b0ae7bedf74419406c5f80a3005b63d92e233d60e01b5f5260045ffd5b34610177576103d5366119c0565b905f52600560205260405f20905f5260205260405f2080546103f681611c0c565b916104046040519384611a29565b818352601f1961041383611c0c565b015f5b8181106105b35750505f5b8281106104ea57836040518091602082016020835281518091526040830190602060408260051b8601019301915f905b82821061046057505050500390f35b919360019193955060208091603f198982030185528751908151815282820151838201526040820151604082015260c0806104d46104c26104b0606087015160e0606088015260e0870190611aea565b60808701518682036080880152611aea565b60a086015185820360a0870152611aea565b9301519101529601920192018594939192610451565b806104f760019284611cb2565b90549060031b1c5f52600460205260405f20828101549061058d600282015491610583600382015491845f52600a60205260405f2060048201545f52602052610579600660405f209260ff6005820154165f52600c60205260405f20956007820154986040519a6105678c611a0e565b8b5260208b015260408a015201611a4a565b6060870152611a4a565b6080850152611a4a565b60a083015260c08201526105a18287611c4c565b526105ac8186611c4c565b5001610421565b6020906040516105c281611a0e565b5f81525f838201525f604082015260608082015260606080820152606060a08201525f60c082015282828801015201610416565b346101775760203660031901126101775760ff610611611b84565b165f52600c6020526102d061062860405f20611a4a565b604051918291602083526020830190611aea565b3461017757604036600319011261017757610655611b84565b602435906001600160401b0382116101775761067760ff923690600401611b24565b9290916106826120f7565b16906001821161080857815f52600c60205260405f20926001600160401b0381116107f4576106b184546119d6565b601f81116107af575b505f93601f821160011461072d57817f54cf46c7df15a042c83c529440104b7dec0de5ed404068839761777f7cb61ee094955f91610722575b508260011b905f198460031b1c19161790555b61071d604051928392602084526020840191611c92565b0390a2005b9050830135866106f3565b601f19821694815f5260205f20905f5b8781106107975750837f54cf46c7df15a042c83c529440104b7dec0de5ed404068839761777f7cb61ee096971061077e575b5050600182811b019055610706565b8401355f19600385901b60f8161c19169055858061076f565b9091602060018192858901358155019301910161073d565b845f5260205f20601f830160051c810191602084106107ea575b601f0160051c01905b8181106107df57506106ba565b5f81556001016107d2565b90915081906107c9565b634e487b7160e01b5f52604160045260245ffd5b50632081b22360e01b5f5260045260245ffd5b34610177575f366003190112610177575f546040516001600160a01b039091168152602090f35b34610177575f3660031901126101775760206040517f00000000000000000000000000000000000000000000000000000000000000008152f35b34610177575f3660031901126101775761091b6108b87f000000000000000000000000000000000000000000000000000000000000000061224c565b6102d06108e47f0000000000000000000000000000000000000000000000000000000000000000612349565b610929604051916108f6602084611a29565b5f83525f368137604051958695600f60f81b875260e0602088015260e0870190611aea565b908582036040870152611aea565b904660608501523060808501525f60a085015283820360c0850152611b51565b6119a5565b34610177575f36600319011261017757600154336001600160a01b03909116036109c057600180546001600160a01b03199081169091555f805433928116831782556001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a3005b63118cdaa760e01b5f523360045260245ffd5b34610177575f366003190112610177576109eb6120f7565b600180546001600160a01b03199081169091555f80549182168155906001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a3005b34610177576080366003190112610177576004356024356044356001600160401b03811161017757610a6c903690600401611b24565b92906064359384151580950361017757610a846120f7565b825f52600a60205260405f20845f5260205260405f20946001600160401b0382116107f457610ab386546119d6565b601f8111610bde575b505f95601f8311600114610b5957827fc493b0f714207d712988efdf95df7c44b2783c014b736b6d8684fdee50859cf69596975f91610b4e575b508360011b905f198560031b1c19161790555b845f52600b60205260405f20865f5260205260405f2060ff1981541660ff8316179055610b43604051938493604085526040850191611c92565b9060208301520390a3005b905084013588610af6565b601f19831696815f5260205f20975f5b818110610bc6575090847fc493b0f714207d712988efdf95df7c44b2783c014b736b6d8684fdee50859cf69798999210610bad575b5050600183811b019055610b09565b8501355f19600386901b60f8161c191690558780610b9e565b868301358a5560019099019860209283019201610b69565b865f5260205f20601f840160051c81019160208510610c19575b601f0160051c01905b818110610c0e5750610abc565b5f8155600101610c01565b9091508190610bf8565b34610177576060366003190112610177576004356001600160401b03811161017757366023820112156101775780600401356080526001600160401b03608051116101775736602460805160051b83010111610177576044356001600160401b03811161017757610c98903690600401611b24565b60805115611809575f805b60805182106117e0576107d09150116117d1576009546001600160a01b03169081156103b8577f000000000000000000000000000000000000000000000000000000000000000046036117c257610d4990610d4160405160208101907f9835e583e3f8f1e4dfc48fe02a92fdbd9a76bc16eec83f3b1f70df2ffbc3b84a8252602435604082015260408152610d39606082611a29565b519020612226565b938484611ce2565b156117b357805f52600760205260405f206024355f5260205260ff60405f2054166117a4575f52600760205260405f206024355f5260205260405f20600160ff19825416179055610d9b608051611c0c565b91610da96040519384611a29565b6080518352601f19610dbc608051611c0c565b015f5b818110611793575050610dd3608051611c0c565b610de06040519182611a29565b6080518152601f19610df3608051611c0c565b01366020830137610e05608051611c0c565b91610e136040519384611a29565b6080518352601f19610e26608051611c0c565b013660208501375f945f5b608051811061154257508515610ec8575f935f5b6080518110610ed7578787878015610ec8576009546080516001600160a01b03909116938103908111610eb4577fcc50d873aa0e0708c11584529c18af24497ac00018c76faf48cb7a4c3396718f916080916040519160243583526020830152825160408301526060820152a3005b634e487b7160e01b5f52601160045260245ffd5b638894779f60e01b5f5260045ffd5b610ee78160805160248701611b94565b610ef18180611bca565b9091610efd8489611c4c565b511561148a57610f14816020610f19930190611c23565b611c38565b908015611482576060610f2c8285611e2e565b013592915b5f60a0819052918291829190610f4682611c60565b955f915b83831061107657505050610f69575b5050505050600101925b92610e45565b8215928361102d57610f7a81611c60565b945f5b82811061100e57505050916001959493917fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb901935b82611002575b8215610ff55750505f5b60ff610fe160405194859415158552606060208601526060850190611b51565b911660408301520390a29089808080610f59565b5f03610fc157505f610fc1565b60a05115159250610fb7565b8061101b60019284611c4c565b51611026828a611c4c565b5201610f7d565b5090600195949350917fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb901926020604051906110688183611a29565b5f8252505f36813792610fb1565b90919d8b908f806110958d61108f61109b948a8a611e49565b95611c4c565b51611c4c565b519060018060a01b0384165f52600860205260405f20825f5260205260ff60405f2054166114365760e083013580156113e85760a08401600160ff6110df836120db565b16116113b757604085013594855f52600b60205260405f2090608081013591825f5260205260ff60405f205416156113795760018060a01b0388165f52600860205260405f20865f5260205260405f20600160ff19825416179055855f52600460205260405f209080358255602081013560018301558760028301556060810135918260038201558360048201556005810160ff61117c876120db565b1660ff19825416179055611198600682019260c0810190611e6b565b9190926001600160401b0383116107f45787926111b582546119d6565b601f8111611325575b505f601f82116001146112ba578190600795965f926112af575b50508160011b915f199060031b1c19161790555b0155865f52600560205260405f20905f5260205260405f2091825491680100000000000000008310156107f457600197889761123285611285978b600298018155611cb2565b819291549060031b91821b915f19901b19161790555f52600d60205260405f20905f526020528560ff61126860405f20936120db565b160361129a57611279848254611bff565b81555b01918254611bff565b9055019e8160a0510160a052015b9190610f4a565b8581016112a8858254611bff565b905561127c565b013590505f806111d8565b94601f19821695835f5260205f20965f5b81811061130a57509160079697918460019594106112f1575b505050811b0190556111ec565b01355f19600384901b60f8161c191690555f80806112e4565b8284013589556001909801978c9750602092830192016112cb565b9091809394505f5260205f20601f830160051c8101916020841061136f575b90601f8b96959493920160051c01905b81811061136157506111be565b5f81558a9550600101611354565b9091508190611344565b93955050505061139a9291509f97909f35611394828b611c4c565b526120e9565b9584156113aa575b600101611293565b60059550600194506113a2565b50509f9790506113cc9135611394828b611c4c565b9584156113db57600101611293565b60049550600194506113a2565b509f905060019160606040519180358352600260208401520135907f0d6841dda0332ed6f6420eb5802f05e6977c4381eed89d0c09df3cc4095472d96040858060a01b03871692a301611293565b9f9050600191606060405191803583528460208401520135907f0d6841dda0332ed6f6420eb5802f05e6977c4381eed89d0c09df3cc4095472d96040858060a01b03871692a301611293565b5f9291610f31565b508061149c575b505060010192610f63565b60606114a88284611e2e565b0135916114b482611c60565b915f5b81811061152257505050907fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb901611512849360ff6114f660019789611c4c565b51166040519283925f8452606060208501526060840190611b51565b9060408301520390a29089611491565b806115306001928486611e49565b3561153b8287611c4c565b52016114b7565b611562610f146115588360805160248801611b94565b6020810190611c23565b60206115806115778460805160248901611b94565b82810190611c23565b0135876115a561159f6115998660805160248b01611b94565b80611bca565b90611e9d565b1561171e5750506115bf6115998360805160248801611b94565b916115c983611c60565b926001600160a01b03909116905f5b81811061165a57505050506115ed8284611c4c565b526115f88183611c4c565b5061161e8661160d8360805160248801611b94565b6116178486611c4c565b5190611edf565b9061163e575b9060019160ff6116348389611c4c565b9116905201610e31565b9690600180928161164f8489611c4c565b520197909150611624565b90600182611674869594839f9a999d9c9b98978590611e49565b61168060a082016120db565b9060e06040519160ff60208401947f0a988988f17d3e106a27abc736f142846ce01b2d9b625c96fe145e71be8cc1ec8652602083013560408601526040830135606086015260608301356080860152608083013560a08601521660c0840152013560e08201528561010082015261010081526116fe61012082611a29565b51902061170b8288611c4c565b520192939497989995969b5090916115d8565b5f51602061253d5f395f51905f52604085945f61173d6001988c611c4c565b52600661174a878d611c4c565b52815194855260066020860152868060a01b031693a3604051602061176f8183611a29565b5f8252505f3681376117818285611c4c565b5261178c8184611c4c565b5001610e31565b806060602080938801015201610dbf565b6301654bf760e61b5f5260045ffd5b638baa579f60e01b5f5260045ffd5b638325596360e01b5f5260045ffd5b6305beb17160e11b5f5260045ffd5b6118016001916117f96115998560805160248b01611b94565b919050611bff565b910190610ca3565b63613f4a1360e11b5f5260045ffd5b34610177576040366003190112610177576001600160a01b03611839611b0e565b165f52600760205260405f206024355f52602052602060ff60405f2054166040519015158152f35b346101775761186f366119c0565b905f52600a60205260405f20905f526020526102d061062860405f20611a4a565b34610177575f36600319011261017757602060405160648152f35b34610177575f3660031901126101775760206040515f8152f35b34610177576020366003190112610177576004355f52600460205260405f20805460018201549161194e6002820154916003810154600482015460ff60058401541691600761191660068601611a4a565b940154956040519889988952602089015260408801526060870152608086015260a085015261010060c0850152610100840190611aea565b9060e08301520390f35b3461017757611966366119c0565b905f52600b60205260405f20905f52602052602060ff60405f2054166040519015158152f35b34610177575f3660031901126101775780601460209252f35b34610177575f36600319011261017757602060405160018152f35b6040906003190112610177576004359060243590565b90600182811c92168015611a04575b60208310146119f057565b634e487b7160e01b5f52602260045260245ffd5b91607f16916119e5565b60e081019081106001600160401b038211176107f457604052565b90601f801991011681019081106001600160401b038211176107f457604052565b9060405191825f825492611a5d846119d6565b8084529360018116908115611ac85750600114611a84575b50611a8292500383611a29565b565b90505f9291925260205f20905f915b818310611aac575050906020611a82928201015f611a75565b6020919350806001915483858901015201910190918492611a93565b905060209250611a8294915060ff191682840152151560051b8201015f611a75565b805180835260209291819084018484015e5f828201840152601f01601f1916010190565b600435906001600160a01b038216820361017757565b9181601f84011215610177578235916001600160401b038311610177576020838186019501011161017757565b90602080835192838152019201905f5b818110611b6e5750505090565b8251845260209384019390920191600101611b61565b6004359060ff8216820361017757565b9190811015611bb65760051b81013590603e1981360301821215610177570190565b634e487b7160e01b5f52603260045260245ffd5b903590601e198136030182121561017757018035906001600160401b03821161017757602001918160051b3603831361017757565b91908201809211610eb457565b6001600160401b0381116107f45760051b60200190565b903590605e1981360301821215610177570190565b356001600160a01b03811681036101775790565b8051821015611bb65760209160051b010190565b90611c6a82611c0c565b611c776040519182611a29565b8281528092611c88601f1991611c0c565b0190602036910137565b908060209392818452848401375f828201840152601f01601f1916010190565b8054821015611bb6575f5260205f2001905f90565b6001600160401b0381116107f457601f01601f191660200190565b92919091833b15611dd657915f9391611d328594611d246040519384926020840196630b135d3f60e11b88526024850152604060448501526064840191611c92565b03601f198101835282611a29565b51915afa3d15611dcf573d611d4681611cc7565b90611d546040519283611a29565b81523d5f602083013e5b81611dc3575b81611d6d575090565b80516020909101516001600160e01b03198116925060048210611da3575b50506001600160e01b031916630b135d3f60e11b1490565b6001600160e01b031960049290920360031b82901b161690505f80611d8b565b80516004149150611d64565b6060611d5e565b9291611de184611cc7565b90611def6040519283611a29565b8482523685840111610177575f602086611e1d97611e14968387013784010152612401565b9093919361243b565b6001600160a01b0391821691161490565b9015611bb65780359060fe1981360301821215610177570190565b9190811015611bb65760051b8101359060fe1981360301821215610177570190565b903590601e198136030182121561017757018035906001600160401b0382116101775760200191813603831361017757565b905f5b818110611eaf57505050600190565b6064611ec9611ebf838587611e49565b60c0810190611e6b565b905011611ed857600101611ea0565b5050505f90565b9190611efa611eee8480611bca565b94602081019150611c23565b92611f0484611c38565b93602081013592821580156120d1575b61209b5760405160208101918260208251919201905f5b8181106120855750505090611f4e81611fc095949303601f198101835282611a29565b51902095611fb8611fad60405160208101907fffa38b52b3794fa160256e68781327917915a9d4bded223f53d0414603dd37b8825260018060a01b0385169a8b6040830152896060830152608082015260808152610d3960a082611a29565b926040810190611e6b565b929091611ce2565b1561205f57835f52600660205260405f20825f5260205260ff60405f205416612039577fde9782b6ede4a1d22e2929e1f7757daf3be1d657007a7f02d7d02050721cf47891604091855f526006602052825f20825f52602052825f20600160ff1982541617905582519182526020820152a36001905f90565b5060405f51602061253d5f395f51905f5291815190815260036020820152a35f90600390565b5060405f51602061253d5f395f51905f5291815190815260026020820152a35f90600290565b8251845260209384019390920191600101611f2b565b505060408051928352600160208401526001600160a01b03909416935f51602061253d5f395f51905f5292909150a35f90600190565b5060148311611f14565b3560ff811681036101775790565b5f198114610eb45760010190565b5f546001600160a01b031633036109c057565b307f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031614806121fd575b15612165577f000000000000000000000000000000000000000000000000000000000000000090565b60405160208101907f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f82527f000000000000000000000000000000000000000000000000000000000000000060408201527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a082015260a081526121f760c082611a29565b51902090565b507f0000000000000000000000000000000000000000000000000000000000000000461461213c565b60429061223161210a565b906040519161190160f01b8352600283015260228201522090565b60ff81146122925760ff811690601f82116122835760405191612270604084611a29565b6020808452838101919036833783525290565b632cd44ac360e21b5f5260045ffd5b50604051600254815f6122a4836119d6565b808352926001811690811561232a57506001146122cb575b6122c892500382611a29565b90565b5060025f90815290917f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace5b81831061230e5750509060206122c8928201016122bc565b60209193508060019154838588010152019101909183926122f6565b602092506122c894915060ff191682840152151560051b8201016122bc565b60ff811461236d5760ff811690601f82116122835760405191612270604084611a29565b50604051600354815f61237f836119d6565b808352926001811690811561232a57506001146123a2576122c892500382611a29565b5060035f90815290917fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b5b8183106123e55750509060206122c8928201016122bc565b60209193508060019154838588010152019101909183926123cd565b81519190604183036124315761242a9250602082015190606060408401519301515f1a906124af565b9192909190565b50505f9160029190565b600481101561249b578061244d575050565b600181036124645763f645eedf60e01b5f5260045ffd5b6002810361247f575063fce698f760e01b5f5260045260245ffd5b6003146124895750565b6335e2f38360e21b5f5260045260245ffd5b634e487b7160e01b5f52602160045260245ffd5b91907f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a08411612531579160209360809260ff5f9560405194855216868401526040830152606082015282805260015afa15612526575f516001600160a01b0381161561251c57905f905f90565b505f906001905f90565b6040513d5f823e3d90fd5b5050505f916003919056fe1a27036f4eb7d046165dd3c2d29117a18b873fc3cc71b0c4320b65fbf51b4d2ba2646970667358221220a0e925cd957153c0f5511ba4536e8c48914296ab6a9ed8976be469da84f6604d64736f6c634300081e0033";
