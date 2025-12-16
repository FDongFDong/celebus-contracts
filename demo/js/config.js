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
  ],
  // 실패 사유 코드 (reasonCode)
  REASON_CODES: {
    0: { name: 'SUCCESS', message: '성공', alert: false },
    1: { name: 'USER_BATCH_TOO_LARGE', message: '배치 레코드 수 초과 (최대 20개)', alert: true },
    2: { name: 'INVALID_USER_SIGNATURE', message: '서명 검증 실패', alert: true },
    3: { name: 'USER_NONCE_INVALID', message: 'Nonce 중복 사용 (이미 사용된 nonce)', alert: true },
    4: { name: 'INVALID_VOTE_TYPE', message: 'voteType 범위 오류 (0 또는 1만 허용)', alert: true },
    5: { name: 'ARTIST_NOT_ALLOWED', message: '허용되지 않은 아티스트', alert: true },
    6: { name: 'STRING_TOO_LONG', message: '문자열 길이 초과 (userId > 100자)', alert: true },
    7: { name: 'DUPLICATE_RECORD', message: '중복 레코드 (이미 처리된 레코드 또는 배치 내 중복)', alert: true },
    8: { name: 'ZERO_AMOUNT', message: '투표 수량이 0입니다', alert: true },
    9: { name: 'VOTING_ID_MISMATCH', message: '유저 배치 내 votingId가 서로 다릅니다', alert: true },
    10: { name: 'INVALID_OPTION_ID', message: 'optionId 오류 (0은 허용되지 않음)', alert: true }
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
export const MAINVOTING_BYTECODE = "0x61018080604052346101d957602081612a41803803809161002082856101dd565b8339810103126101d957516001600160a01b038116908190036101d9576040519061004c6040836101dd565b600a825260208201694d61696e566f74696e6760b01b8152604051926100736040856101dd565b600184526020840192603160f81b845280156101c657600180546001600160a01b03199081169091555f8054918216831781556001600160a01b03909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a36100df81610214565b610120526100ec846103af565b61014052519020918260e05251902080610100524660a0526040519060208201927f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f8452604083015260608201524660808201523060a082015260a0815261015560c0826101dd565b5190206080523060c052466101605260405161255990816104e8823960805181611fb3015260a05181612070015260c05181611f7d015260e0518161200201526101005181612028015261012051816108a9015261014051816108d501526101605181818161086e0152610d000152f35b631e4fbdf760e01b5f525f60045260245ffd5b5f80fd5b601f909101601f19168101906001600160401b0382119082101761020057604052565b634e487b7160e01b5f52604160045260245ffd5b908151602081105f1461028e575090601f81511161024e57602081519101516020821061023f571790565b5f198260200360031b1b161790565b604460209160405192839163305a27a960e01b83528160048401528051918291826024860152018484015e5f828201840152601f01601f19168101030190fd5b6001600160401b03811161020057600254600181811c911680156103a5575b602082101461039157601f811161035e575b50602092601f82116001146102fd57928192935f926102f2575b50508160011b915f199060031b1c19161760025560ff90565b015190505f806102d9565b601f1982169360025f52805f20915f5b868110610346575083600195961061032e575b505050811b0160025560ff90565b01515f1960f88460031b161c191690555f8080610320565b9192602060018192868501518155019401920161030d565b60025f52601f60205f20910160051c810190601f830160051c015b81811061038657506102bf565b5f8155600101610379565b634e487b7160e01b5f52602260045260245ffd5b90607f16906102ad565b908151602081105f146103da575090601f81511161024e57602081519101516020821061023f571790565b6001600160401b03811161020057600354600181811c911680156104dd575b602082101461039157601f81116104aa575b50602092601f821160011461044957928192935f9261043e575b50508160011b915f199060031b1c19161760035560ff90565b015190505f80610425565b601f1982169360035f52805f20915f5b868110610492575083600195961061047a575b505050811b0160035560ff90565b01515f1960f88460031b161c191690555f808061046c565b91926020600181928685015181550194019201610459565b60035f52601f60205f20910160051c810190601f830160051c015b8181106104d2575061040b565b5f81556001016104c5565b90607f16906103f956fe6080806040526004361015610012575f80fd5b5f3560e01c908163032e1a40146117e357508063041363531461095e5780630a19c4a9146117af5780632b38cd961461171c57806334818a271461170257806334ccc5ea146116e7578063524578e0146116b8578063574df9321461166f57806363674b0714610c575780636768d0b9146102805780636a606b0614610a4b578063715018a6146109e857806379ba5097146109635780637ffc587b1461095e57806384b0196e1461089157806385e1f4d0146108575780638da5cb5b14610830578063a670b24e1461063c578063ab38b7bd146105f6578063b40f68ce146103c7578063c00e0e2514610345578063e29dfba8146102fc578063e30c3978146102d4578063f013b28614610280578063f2fde38b1461020e578063f698da25146101ec578063f6de30b6146101c4578063f7feca8a1461017b5763fd81654e1461015b575f80fd5b34610177575f3660031901126101775760206040516107d08152f35b5f80fd5b34610177576040366003190112610177576001600160a01b0361019c611965565b165f52600660205260405f206024355f52602052602060ff60405f2054166040519015158152f35b34610177575f366003190112610177576009546040516001600160a01b039091168152602090f35b34610177575f366003190112610177576020610206611f7a565b604051908152f35b3461017757602036600319011261017757610227611965565b61022f611f67565b60018060a01b0316806bffffffffffffffffffffffff60a01b600154161760015560018060a01b035f54167f38d16b8cac22d99fc7c124b9cd0de2d3fa1faef420bfe791d8c362d765e227005f80a3005b346101775761028e36611817565b905f52600d60205260405f20905f5260205260405f2080546102d060026001840154930154604051938493846040919493926060820195825260208201520152565b0390f35b34610177575f366003190112610177576001546040516001600160a01b039091168152602090f35b34610177576040366003190112610177576001600160a01b0361031d611965565b165f52600860205260405f206024355f52602052602060ff60405f2054166040519015158152f35b346101775760203660031901126101775761035e611965565b610366611f67565b6001600160a01b031680156103b857600980546001600160a01b0319811683179091556001600160a01b03167f7b430a84222a519230743a1a600e19cbaf3386e1074a55b0ae7bedf74419406c5f80a3005b63d92e233d60e01b5f5260045ffd5b34610177576103d536611817565b905f52600560205260405f20905f5260205260405f2080546103f681611a63565b916104046040519384611880565b818352601f1961041383611a63565b015f5b8181106105b35750505f5b8281106104ea57836040518091602082016020835281518091526040830190602060408260051b8601019301915f905b82821061046057505050500390f35b919360019193955060208091603f198982030185528751908151815282820151838201526040820151604082015260c0806104d46104c26104b0606087015160e0606088015260e0870190611941565b60808701518682036080880152611941565b60a086015185820360a0870152611941565b9301519101529601920192018594939192610451565b806104f760019284611b09565b90549060031b1c5f52600460205260405f20828101549061058d600282015491610583600382015491845f52600a60205260405f2060048201545f52602052610579600660405f209260ff6005820154165f52600c60205260405f20956007820154986040519a6105678c611865565b8b5260208b015260408a0152016118a1565b60608701526118a1565b60808501526118a1565b60a083015260c08201526105a18287611aa3565b526105ac8186611aa3565b5001610421565b6020906040516105c281611865565b5f81525f838201525f604082015260608082015260606080820152606060a08201525f60c082015282828801015201610416565b346101775760203660031901126101775760ff6106116119db565b165f52600c6020526102d061062860405f206118a1565b604051918291602083526020830190611941565b34610177576040366003190112610177576106556119db565b602435906001600160401b0382116101775761067760ff92369060040161197b565b929091610682611f67565b16906001821161081d57821561080e57815f52600c60205260405f20926001600160401b0381116107fa576106b7845461182d565b601f81116107b5575b505f93601f821160011461073357817f54cf46c7df15a042c83c529440104b7dec0de5ed404068839761777f7cb61ee094955f91610728575b508260011b905f198460031b1c19161790555b610723604051928392602084526020840191611ae9565b0390a2005b9050830135866106f9565b601f19821694815f5260205f20905f5b87811061079d5750837f54cf46c7df15a042c83c529440104b7dec0de5ed404068839761777f7cb61ee0969710610784575b5050600182811b01905561070c565b8401355f19600385901b60f8161c191690558580610775565b90916020600181928589013581550193019101610743565b845f5260205f20601f830160051c810191602084106107f0575b601f0160051c01905b8181106107e557506106c0565b5f81556001016107d8565b90915081906107cf565b634e487b7160e01b5f52604160045260245ffd5b63af943d0360e01b5f5260045ffd5b50632081b22360e01b5f5260045260245ffd5b34610177575f366003190112610177575f546040516001600160a01b039091168152602090f35b34610177575f3660031901126101775760206040517f00000000000000000000000000000000000000000000000000000000000000008152f35b34610177575f366003190112610177576109306108cd7f0000000000000000000000000000000000000000000000000000000000000000612213565b6102d06108f97f0000000000000000000000000000000000000000000000000000000000000000612310565b61093e6040519161090b602084611880565b5f83525f368137604051958695600f60f81b875260e0602088015260e0870190611941565b908582036040870152611941565b904660608501523060808501525f60a085015283820360c08501526119a8565b6117fc565b34610177575f36600319011261017757600154336001600160a01b03909116036109d557600180546001600160a01b03199081169091555f805433928116831782556001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a3005b63118cdaa760e01b5f523360045260245ffd5b34610177575f36600319011261017757610a00611f67565b600180546001600160a01b03199081169091555f80549182168155906001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a3005b34610177576080366003190112610177576004356024356044356001600160401b03811161017757610a8190369060040161197b565b92906064359384151580950361017757610a99611f67565b8315610c4457801561080e57825f52600a60205260405f20845f5260205260405f20946001600160401b0382116107fa57610ad4865461182d565b601f8111610bff575b505f95601f8311600114610b7a57827fc493b0f714207d712988efdf95df7c44b2783c014b736b6d8684fdee50859cf69596975f91610b6f575b508360011b905f198560031b1c19161790555b845f52600b60205260405f20865f5260205260405f2060ff1981541660ff8316179055610b64604051938493604085526040850191611ae9565b9060208301520390a3005b905084013588610b17565b601f19831696815f5260205f20975f5b818110610be7575090847fc493b0f714207d712988efdf95df7c44b2783c014b736b6d8684fdee50859cf69798999210610bce575b5050600183811b019055610b2a565b8501355f19600386901b60f8161c191690558780610bbf565b868301358a5560019099019860209283019201610b8a565b865f5260205f20601f840160051c81019160208510610c3a575b601f0160051c01905b818110610c2f5750610add565b5f8155600101610c22565b9091508190610c19565b8363768d03e960e11b5f5260045260245ffd5b34610177576060366003190112610177576004356001600160401b03811161017757366023820112156101775780600401356001600160401b038111610177576024820191602436918360051b01011161017757602435906044356001600160401b03811161017757610cce90369060040161197b565b8293919315611660575f805b84821061163c576107d091501161162d576009546001600160a01b03169081156103b8577f0000000000000000000000000000000000000000000000000000000000000000460361161e57610d7c90610d7460405160208101907f9835e583e3f8f1e4dfc48fe02a92fdbd9a76bc16eec83f3b1f70df2ffbc3b84a825286604082015260408152610d6c606082611880565b519020612096565b958684611b39565b1561160f57805f52600760205260405f20825f5260205260ff60405f205416611600575f52600760205260405f20815f5260205260405f20600160ff19825416179055610dc882611a63565b90610dd66040519283611880565b828252601f19610de584611a63565b015f5b8181106115ef575050610dfa83611a63565b91610e086040519384611880565b838352601f19610e1785611a63565b01366020850137610e2784611a63565b95610e356040519788611880565b848752601f19610e4486611a63565b013660208901375f805b8287898b898387106113ce575050505050905015610ee8575f968794859392915b878510610ef75750505050508115610ee8576009546001600160a01b0316948303838111610ed4577fcc50d873aa0e0708c11584529c18af24497ac00018c76faf48cb7a4c3396718f93608093604051938452602084015260408301526060820152a3005b634e487b7160e01b5f52601160045260245ffd5b638894779f60e01b5f5260045ffd5b9091929398610f078a89866119eb565b610f118180611a21565b9091610f1d8d87611aa3565b51156113265790610f3c610f37838f959460200190611a7a565b611a8f565b81158015939061131c57610f5f6060610f558584611c85565b0135955b8b611aa3565b5192610f6a81611ab7565b5f5b8281106112fc5750610f80858385876120bc565b906112a557505f94939192916001600160a01b031690505b82851061102157505050505091600192918392610fc0575b50019901925b9190939293610e6f565b7fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb90160606020611012604051610ff58382611880565b5f81525f36813760405193849389855284015260608301906119a8565b5f60408301520390a28c610fb0565b90919293809d61103c611035838787611ca0565b9287611aa3565b5190835f52600860205260405f20825f5260205260405f20600160ff19825416179055815f52600460205260405f209280358455602081013560018501556040810135938460028201556060820135806003830155608083013591826004820155600581019360a081019460ff6110b287611f59565b1660ff19825416179055600682016110cd60c0830183611cc2565b906001600160401b0382116107fa576110e6835461182d565b601f8111611260575b505f90601f83116001146111f257918060e0949260079a99989796945f926111e7575b50508160011b915f199060031b1c19161790555b01359485910155865f52600560205260405f20905f5260205260405f2091825491680100000000000000008310156107fa576001978897611171856111c4978b600298018155611b09565b819291549060031b91821b915f19901b19161790555f52600d60205260405f20905f526020528560ff6111a760405f2093611f59565b16036111d2576111b8848254611a56565b81555b01918254611a56565b9055019d0193929190610f98565b8581016111e0858254611a56565b90556111bb565b013590505f80611112565b601f19831691845f5260205f20925f5b818110611248575092600192859260079c9b9a99989660e098961061122f575b505050811b019055611126565b01355f19600384901b60f8161c191690555f8080611222565b91936020600181928787013581550195019201611202565b835f5260205f20601f840160051c8101916020851061129b575b601f0160051c01905b81811061129057506110ef565b5f8155600101611283565b909150819061127a565b9350935050506001949d93926112c0575b5050500192610fb6565b7fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb901916112f160405192839283611f32565b0390a28b80806112b6565b8061130a6001928587611ca0565b356113158285611aa3565b5201610f6c565b610f5f5f95610f59565b50809b929b61133b575b505060010192610fb6565b60606113478284611c85565b01359161135382611ab7565b915f5b8181106113ae57505050907fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb901839260ff61139260019688611aa3565b5116906113a460405192839283611f32565b0390a2908b611330565b806113bc6001928486611ca0565b356113c78287611aa3565b5201611356565b61142161141b61141589602061140c611403838b6113fd610f378f84846113f4926119eb565b87810190611a7a565b9d6119eb565b82810190611a7a565b0135978c6119eb565b80611a21565b90611cf4565b156115795750505050611438611415848a876119eb565b9161144283611ab7565b926001600160a01b03909116905f5b8181106114cd57505050506114668386611aa3565b526114718285611aa3565b5061149288611481848a876119eb565b61148b8588611aa3565b5190611d36565b92906114b5575b6001919260ff6114a9838d611aa3565b91169052015b90610e4e565b60018092816114c4848b611aa3565b52019150611499565b806114db6001928487611ca0565b6114e760a08201611f59565b9060e06040519160ff60208401947f0a988988f17d3e106a27abc736f142846ce01b2d9b625c96fe145e71be8cc1ec8652602083013560408601526040830135606086015260608301356080860152608083013560a08601521660c0840152013560e082015285610100820152610100815261156561012082611880565b5190206115728288611aa3565b5201611451565b869460066115a6875f5160206125045f395f51905f52955f6115a060019c9d604098611aa3565b52611aa3565b52815194855260066020860152868060a01b031693a360405160206115cb8183611880565b5f8252505f3681376115dd8287611aa3565b526115e88186611aa3565b50016114af565b806060602080938701015201610de8565b6301654bf760e61b5f5260045ffd5b638baa579f60e01b5f5260045ffd5b638325596360e01b5f5260045ffd5b6305beb17160e11b5f5260045ffd5b61165860019161165061141585898c6119eb565b919050611a56565b910190610cda565b63613f4a1360e11b5f5260045ffd5b34610177576040366003190112610177576001600160a01b03611690611965565b165f52600760205260405f206024355f52602052602060ff60405f2054166040519015158152f35b34610177576116c636611817565b905f52600a60205260405f20905f526020526102d061062860405f206118a1565b34610177575f36600319011261017757602060405160648152f35b34610177575f3660031901126101775760206040515f8152f35b34610177576020366003190112610177576004355f52600460205260405f2080546001820154916117a56002820154916003810154600482015460ff60058401541691600761176d600686016118a1565b940154956040519889988952602089015260408801526060870152608086015260a085015261010060c0850152610100840190611941565b9060e08301520390f35b34610177576117bd36611817565b905f52600b60205260405f20905f52602052602060ff60405f2054166040519015158152f35b34610177575f3660031901126101775780601460209252f35b34610177575f36600319011261017757602060405160018152f35b6040906003190112610177576004359060243590565b90600182811c9216801561185b575b602083101461184757565b634e487b7160e01b5f52602260045260245ffd5b91607f169161183c565b60e081019081106001600160401b038211176107fa57604052565b90601f801991011681019081106001600160401b038211176107fa57604052565b9060405191825f8254926118b48461182d565b808452936001811690811561191f57506001146118db575b506118d992500383611880565b565b90505f9291925260205f20905f915b8183106119035750509060206118d9928201015f6118cc565b60209193508060019154838589010152019101909184926118ea565b9050602092506118d994915060ff191682840152151560051b8201015f6118cc565b805180835260209291819084018484015e5f828201840152601f01601f1916010190565b600435906001600160a01b038216820361017757565b9181601f84011215610177578235916001600160401b038311610177576020838186019501011161017757565b90602080835192838152019201905f5b8181106119c55750505090565b82518452602093840193909201916001016119b8565b6004359060ff8216820361017757565b9190811015611a0d5760051b81013590603e1981360301821215610177570190565b634e487b7160e01b5f52603260045260245ffd5b903590601e198136030182121561017757018035906001600160401b03821161017757602001918160051b3603831361017757565b91908201809211610ed457565b6001600160401b0381116107fa5760051b60200190565b903590605e1981360301821215610177570190565b356001600160a01b03811681036101775790565b8051821015611a0d5760209160051b010190565b90611ac182611a63565b611ace6040519182611880565b8281528092611adf601f1991611a63565b0190602036910137565b908060209392818452848401375f828201840152601f01601f1916010190565b8054821015611a0d575f5260205f2001905f90565b6001600160401b0381116107fa57601f01601f191660200190565b92919091833b15611c2d57915f9391611b898594611b7b6040519384926020840196630b135d3f60e11b88526024850152604060448501526064840191611ae9565b03601f198101835282611880565b51915afa3d15611c26573d611b9d81611b1e565b90611bab6040519283611880565b81523d5f602083013e5b81611c1a575b81611bc4575090565b80516020909101516001600160e01b03198116925060048210611bfa575b50506001600160e01b031916630b135d3f60e11b1490565b6001600160e01b031960049290920360031b82901b161690505f80611be2565b80516004149150611bbb565b6060611bb5565b9291611c3884611b1e565b90611c466040519283611880565b8482523685840111610177575f602086611c7497611c6b9683870137840101526123c8565b90939193612402565b6001600160a01b0391821691161490565b9015611a0d5780359060fe1981360301821215610177570190565b9190811015611a0d5760051b8101359060fe1981360301821215610177570190565b903590601e198136030182121561017757018035906001600160401b0382116101775760200191813603831361017757565b905f5b818110611d0657505050600190565b6064611d20611d16838587611ca0565b60c0810190611cc2565b905011611d2f57600101611cf7565b5050505f90565b9190611d51611d458480611a21565b94602081019150611a7a565b92611d5b84611a8f565b9360208101359282158015611f28575b611ef25760405160208101918260208251919201905f5b818110611edc5750505090611da581611e1795949303601f198101835282611880565b51902095611e0f611e0460405160208101907fffa38b52b3794fa160256e68781327917915a9d4bded223f53d0414603dd37b8825260018060a01b0385169a8b6040830152896060830152608082015260808152610d6c60a082611880565b926040810190611cc2565b929091611b39565b15611eb657835f52600660205260405f20825f5260205260ff60405f205416611e90577fde9782b6ede4a1d22e2929e1f7757daf3be1d657007a7f02d7d02050721cf47891604091855f526006602052825f20825f52602052825f20600160ff1982541617905582519182526020820152a36001905f90565b5060405f5160206125045f395f51905f5291815190815260036020820152a35f90600390565b5060405f5160206125045f395f51905f5291815190815260026020820152a35f90600290565b8251845260209384019390920191600101611d82565b505060408051928352600160208401526001600160a01b03909416935f5160206125045f395f51905f5292909150a35f90600190565b5060148311611d6b565b9060ff611f526040929594955f85526060602086015260608501906119a8565b9416910152565b3560ff811681036101775790565b5f546001600160a01b031633036109d557565b307f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316148061206d575b15611fd5577f000000000000000000000000000000000000000000000000000000000000000090565b60405160208101907f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f82527f000000000000000000000000000000000000000000000000000000000000000060408201527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a082015260a0815261206760c082611880565b51902090565b507f00000000000000000000000000000000000000000000000000000000000000004614611fac565b6042906120a1611f7a565b906040519161190160f01b8352600283015260228201522090565b909260606120ca8486611c85565b0135925f5b8181106120e2575050505050505f905f90565b6120ed818388611ca0565b6120f78285611aa3565b5190866060820135036122035760808101359081156121f25760e0810135156121e157600160ff61212a60a08401611f59565b16116121d057604001355f52600b60205260405f20905f5260205260ff60405f205416156121c1575f5b828110612198575060018060a01b0385165f52600860205260405f20905f5260205260ff60405f20541661218a576001016120cf565b505050505050600190600790565b816121a38287611aa3565b51146121b157600101612154565b5050505050505050600190600790565b50505050505050600190600590565b505050505050505050600190600490565b505050505050505050600190600890565b505050505050505050600190600a90565b5050505050505050600190600990565b60ff81146122595760ff811690601f821161224a5760405191612237604084611880565b6020808452838101919036833783525290565b632cd44ac360e21b5f5260045ffd5b50604051600254815f61226b8361182d565b80835292600181169081156122f15750600114612292575b61228f92500382611880565b90565b5060025f90815290917f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace5b8183106122d557505090602061228f92820101612283565b60209193508060019154838588010152019101909183926122bd565b6020925061228f94915060ff191682840152151560051b820101612283565b60ff81146123345760ff811690601f821161224a5760405191612237604084611880565b50604051600354815f6123468361182d565b80835292600181169081156122f157506001146123695761228f92500382611880565b5060035f90815290917fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b5b8183106123ac57505090602061228f92820101612283565b6020919350806001915483858801015201910190918392612394565b81519190604183036123f8576123f19250602082015190606060408401519301515f1a90612476565b9192909190565b50505f9160029190565b60048110156124625780612414575050565b6001810361242b5763f645eedf60e01b5f5260045ffd5b60028103612446575063fce698f760e01b5f5260045260245ffd5b6003146124505750565b6335e2f38360e21b5f5260045260245ffd5b634e487b7160e01b5f52602160045260245ffd5b91907f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a084116124f8579160209360809260ff5f9560405194855216868401526040830152606082015282805260015afa156124ed575f516001600160a01b038116156124e357905f905f90565b505f906001905f90565b6040513d5f823e3d90fd5b5050505f916003919056fe1a27036f4eb7d046165dd3c2d29117a18b873fc3cc71b0c4320b65fbf51b4d2ba264697066735822122097547f2756edb6f1aa9da1cdc500b9cf20467fe2d7cb690e06eec57d2dbb8ebd64736f6c634300081e0033";
