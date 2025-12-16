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
export const MAINVOTING_BYTECODE = "0x61018080604052346101d957602081612bf3803803809161002082856101dd565b8339810103126101d957516001600160a01b038116908190036101d9576040519061004c6040836101dd565b600a825260208201694d61696e566f74696e6760b01b8152604051926100736040856101dd565b600184526020840192603160f81b845280156101c657600180546001600160a01b03199081169091555f8054918216831781556001600160a01b03909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a36100df81610214565b610120526100ec846103af565b61014052519020918260e05251902080610100524660a0526040519060208201927f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f8452604083015260608201524660808201523060a082015260a0815261015560c0826101dd565b5190206080523060c052466101605260405161270b90816104e88239608051816120dc015260a05181612199015260c051816120a6015260e0518161212b015261010051816121510152610120518161095601526101405181610982015261016051818181610a1501526112150152f35b631e4fbdf760e01b5f525f60045260245ffd5b5f80fd5b601f909101601f19168101906001600160401b0382119082101761020057604052565b634e487b7160e01b5f52604160045260245ffd5b908151602081105f1461028e575090601f81511161024e57602081519101516020821061023f571790565b5f198260200360031b1b161790565b604460209160405192839163305a27a960e01b83528160048401528051918291826024860152018484015e5f828201840152601f01601f19168101030190fd5b6001600160401b03811161020057600254600181811c911680156103a5575b602082101461039157601f811161035e575b50602092601f82116001146102fd57928192935f926102f2575b50508160011b915f199060031b1c19161760025560ff90565b015190505f806102d9565b601f1982169360025f52805f20915f5b868110610346575083600195961061032e575b505050811b0160025560ff90565b01515f1960f88460031b161c191690555f8080610320565b9192602060018192868501518155019401920161030d565b60025f52601f60205f20910160051c810190601f830160051c015b81811061038657506102bf565b5f8155600101610379565b634e487b7160e01b5f52602260045260245ffd5b90607f16906102ad565b908151602081105f146103da575090601f81511161024e57602081519101516020821061023f571790565b6001600160401b03811161020057600354600181811c911680156104dd575b602082101461039157601f81116104aa575b50602092601f821160011461044957928192935f9261043e575b50508160011b915f199060031b1c19161760035560ff90565b015190505f80610425565b601f1982169360035f52805f20915f5b868110610492575083600195961061047a575b505050811b0160035560ff90565b01515f1960f88460031b161c191690555f808061046c565b91926020600181928685015181550194019201610459565b60035f52601f60205f20910160051c810190601f830160051c015b8181106104d2575061040b565b5f81556001016104c5565b90607f16906103f956fe60806040526004361015610011575f80fd5b5f3560e01c8063032e1a40146101da57806304136353146101a35780630a19c4a9146101d55780632b38cd96146101d057806334818a27146101cb57806334ccc5ea146101c6578063524578e0146101c1578063574df932146101bc57806363674b07146101b75780636768d0b9146101715780636a606b06146101b2578063715018a6146101ad57806379ba5097146101a85780637ffc587b146101a357806384b0196e1461019e57806385e1f4d0146101995780638da5cb5b14610194578063a670b24e1461018f578063ab38b7bd1461018a578063b40f68ce14610185578063c00e0e2514610180578063e29dfba81461017b578063e30c397814610176578063f013b28614610171578063f2fde38b1461016c578063f698da2514610167578063f6de30b614610162578063f7feca8a1461015d5763fd81654e14610158575f80fd5b611032565b610fe4565b610fbc565b610f9a565b610f24565b6105dc565b610efc565b610eae565b610e28565b610ced565b610bfd565b610a6a565b610a38565b6109fe565b61093e565b6101f9565b610886565b610823565b610635565b610558565b6104dd565b610480565b610465565b61044b565b6103e6565b610214565b346101f5575f3660031901126101f557602060405160148152f35b5f80fd5b346101f5575f3660031901126101f557602060405160018152f35b346101f55760403660031901126101f557600435602435905f52600b60205260405f20905f52602052602060ff60405f2054166040519015158152f35b90600182811c9216801561027f575b602083101461026b57565b634e487b7160e01b5f52602260045260245ffd5b91607f1691610260565b634e487b7160e01b5f52604160045260245ffd5b60e081019081106001600160401b038211176102b857604052565b610289565b90601f801991011681019081106001600160401b038211176102b857604052565b9060405191825f8254926102f184610251565b808452936001811690811561035c5750600114610318575b50610316925003836102bd565b565b90505f9291925260205f20905f915b818310610340575050906020610316928201015f610309565b6020919350806001915483858901015201910190918492610327565b90506020925061031694915060ff191682840152151560051b8201015f610309565b805180835260209291819084018484015e5f828201840152601f01601f1916010190565b9897969360ff9360e097936103e197938c5260208c015260408b015260608a015260808901521660a087015261010060c087015261010086019061037e565b930152565b346101f55760203660031901126101f5576004355f52600460205260405f2080546104476001830154926002810154906003810154600482015460ff600584015416916007610437600686016102de565b94015494604051988998896103a2565b0390f35b346101f5575f3660031901126101f55760206040515f8152f35b346101f5575f3660031901126101f557602060405160648152f35b346101f55760403660031901126101f557600435602435905f52600a60205260405f20905f526020526104476104b860405f206102de565b60405191829160208352602083019061037e565b6001600160a01b038116036101f557565b346101f55760403660031901126101f5576004356104fa816104cc565b6024359060018060a01b03165f52600760205260405f20905f52602052602060ff60405f2054166040519015158152f35b9181601f840112156101f5578235916001600160401b0383116101f557602083818601950101116101f557565b346101f55760603660031901126101f5576004356001600160401b0381116101f557366023820112156101f5578060040135906001600160401b0382116101f5573660248360051b830101116101f557604435906024356001600160401b0383116101f5576105da936105d1602494369060040161052b565b949093016111e3565b005b346101f55760403660031901126101f557600435602435905f52600d60205260405f20905f5260205260405f20805461044760026001840154930154604051938493846040919493926060820195825260208201520152565b346101f55760803660031901126101f5576004356024356044356001600160401b0381116101f55761066b90369060040161052b565b606435939184151585036101f557610681612090565b831561081057811561080157825f52600a60205260405f20845f5260205260405f20946001600160401b0383116102b8576106c6836106c08854610251565b886114fa565b5f95601f841160011461077257906107629161071b85807fc493b0f714207d712988efdf95df7c44b2783c014b736b6d8684fdee50859cf698999a5f91610767575b508160011b915f199060031b1c19161790565b90555b61075681610745896107388a5f52600b60205260405f2090565b905f5260205260405f2090565b9060ff801983541691151516179055565b60405193849384611631565b0390a3005b90508601355f610708565b601f198416610784825f5260205f2090565b905f5b8181106107e95750907fc493b0f714207d712988efdf95df7c44b2783c014b736b6d8684fdee50859cf696979886610762959493106107d0575b5050600185811b01905561071e565b8501355f19600388901b60f8161c191690555f806107c1565b858a013583556020998a019960019093019201610787565b63af943d0360e01b5f5260045ffd5b8363768d03e960e11b5f5260045260245ffd5b346101f5575f3660031901126101f55761083b612090565b600180546001600160a01b03199081169091555f80549182168155906001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a3005b346101f5575f3660031901126101f557600154336001600160a01b03909116036108f857600180546001600160a01b03199081169091555f805433928116831782556001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09080a3005b63118cdaa760e01b5f523360045260245ffd5b90602080835192838152019201905f5b8181106109285750505090565b825184526020938401939092019160010161091b565b346101f5575f3660031901126101f5576109d061097a7f00000000000000000000000000000000000000000000000000000000000000006123ac565b6104476109a67f0000000000000000000000000000000000000000000000000000000000000000612471565b6109de6109b16111bb565b91604051958695600f60f81b875260e0602088015260e087019061037e565b90858203604087015261037e565b904660608501523060808501525f60a085015283820360c085015261090b565b346101f5575f3660031901126101f55760206040517f00000000000000000000000000000000000000000000000000000000000000008152f35b346101f5575f3660031901126101f5575f546040516001600160a01b039091168152602090f35b60ff8116036101f557565b346101f55760403660031901126101f557600435610a8781610a5f565b6024356001600160401b0381116101f557610aa860ff91369060040161052b565b919092610ab3612090565b169060018211610bea57801561080157815f52600c60205260405f20926001600160401b0382116102b857610af282610aec8654610251565b866114fa565b5f93601f8311600114610b6257610b4083807f54cf46c7df15a042c83c529440104b7dec0de5ed404068839761777f7cb61ee096975f91610b5757508160011b915f199060031b1c19161790565b90555b610b5260405192839283611652565b0390a2005b90508401355f610708565b601f19831694610b75825f5260205f2090565b905f5b878110610bd25750847f54cf46c7df15a042c83c529440104b7dec0de5ed404068839761777f7cb61ee0969710610bb9575b5050600183811b019055610b43565b8301355f19600386901b60f8161c191690555f80610baa565b90916020600181928588013581550193019101610b78565b50632081b22360e01b5f5260045260245ffd5b346101f55760203660031901126101f55760ff600435610c1c81610a5f565b165f52600c6020526104476104b860405f206102de565b602081016020825282518091526040820191602060408360051b8301019401925f915b838310610c6557505050505090565b9091929394602080600192603f198582030186528851908151815282820151838201526040820151604082015260c080610cd8610cc6610cb4606087015160e0606088015260e087019061037e565b6080870151868203608088015261037e565b60a086015185820360a087015261037e565b93015191015297019301930191939290610c56565b346101f55760403660031901126101f557610d19600435610738602435915f52600560205260405f2090565b8054610d2481611663565b915f5b828110610d3c57604051806104478682610c33565b80610d67610d59610d4f600194866116de565b90549060031b1c90565b5f52600460205260405f2090565b8281015490610e02600282015491610df8600382015491610dee6006610da9610d98885f52600a60205260405f2090565b60048501545f5260205260405f2090565b92610dcc610dbb600583015460ff1690565b60ff165f52600c60205260405f2090565b95600782015498610ddb6110e4565b9a8b5260208b015260408a0152016102de565b60608701526102de565b60808501526102de565b60a083015260c0820152610e1682876111a7565b52610e2181866111a7565b5001610d27565b346101f55760203660031901126101f557600435610e45816104cc565b610e4d612090565b6001600160a01b03168015610e9f57600980546001600160a01b0319811683179091556001600160a01b03167f7b430a84222a519230743a1a600e19cbaf3386e1074a55b0ae7bedf74419406c5f80a3005b63d92e233d60e01b5f5260045ffd5b346101f55760403660031901126101f557600435610ecb816104cc565b6024359060018060a01b03165f52600860205260405f20905f52602052602060ff60405f2054166040519015158152f35b346101f5575f3660031901126101f5576001546040516001600160a01b039091168152602090f35b346101f55760203660031901126101f557600435610f41816104cc565b610f49612090565b60018060a01b0316806bffffffffffffffffffffffff60a01b600154161760015560018060a01b035f54167f38d16b8cac22d99fc7c124b9cd0de2d3fa1faef420bfe791d8c362d765e227005f80a3005b346101f5575f3660031901126101f5576020610fb46120a3565b604051908152f35b346101f5575f3660031901126101f5576009546040516001600160a01b039091168152602090f35b346101f55760403660031901126101f557600435611001816104cc565b6024359060018060a01b03165f52600660205260405f20905f52602052602060ff60405f2054166040519015158152f35b346101f5575f3660031901126101f55760206040516107d08152f35b634e487b7160e01b5f52603260045260245ffd5b91908110156110845760051b81013590603e19813603018212156101f5570190565b61104e565b903590601e19813603018212156101f557018035906001600160401b0382116101f557602001918160051b360383136101f557565b634e487b7160e01b5f52601160045260245ffd5b919082018092116110df57565b6110be565b6040519061031660e0836102bd565b6001600160401b0381116102b85760051b60200190565b90611114826110f3565b61112160405191826102bd565b8281528092611132601f19916110f3565b01905f5b82811061114257505050565b806060602080938501015201611136565b9061115d826110f3565b61116a60405191826102bd565b828152809261117b601f19916110f3565b0190602036910137565b903590605e19813603018212156101f5570190565b356111a4816104cc565b90565b80518210156110845760209160051b010190565b604051906111ca6020836102bd565b5f808352366020840137565b919082039182116110df57565b90919382156114eb575f805b8482106114c7576107d09150116114b8576009546001600160a01b0316908115610e9f577f000000000000000000000000000000000000000000000000000000000000000046036114a9576112526112569161124a886116f3565b9687856117dc565b1590565b61149a5784611264916118b2565b61126d8261110a565b61127683611153565b61127f84611153565b915f5f5b868110611320575015611311578461129a94611d22565b8115611311576009547fcc50d873aa0e0708c11584529c18af24497ac00018c76faf48cb7a4c3396718f9361130c916112dd906001600160a01b031693826111d6565b6040805198895260208901959095529387015260608601929092526001600160a01b0316939081906080820190565b0390a3565b638894779f60e01b5f5260045ffd5b9086868961137f6112526113796113738861135161134c611342838b8b611062565b6020810190611185565b61119a565b97602061136b61136284848c611062565b82810190611185565b013597611062565b80611089565b90611978565b61141c57505061139d90611397611373858b8b611062565b906119ba565b6113a783856111a7565b526113b282846111a7565b506113d3886113c2848a8a611062565b6113cc85876111a7565b5190611a6f565b92906113f9575b6113f3600192936113eb83896111a7565b9060ff169052565b01611283565b6113f36001809361141361140d858a6111a7565b60019052565b019250506113da565b5f5160206126b65f395f51905f5261147386945f61143d600198998c6111a7565b5261145161144b878d6111a7565b60069052565b604051918291888060a01b031695826020600691939293604081019481520152565b0390a361147e6111bb565b61148882866111a7565b5261149381856111a7565b5001611283565b638baa579f60e01b5f5260045ffd5b638325596360e01b5f5260045ffd5b6305beb17160e11b5f5260045ffd5b6114e36001916114db611373858989611062565b9190506110d2565b9101906111ef565b63613f4a1360e11b5f5260045ffd5b601f821161150757505050565b5f5260205f20906020601f840160051c8301931061153f575b601f0160051c01905b818110611534575050565b5f8155600101611529565b9091508190611520565b9092916001600160401b0381116102b85761156e816115688454610251565b846114fa565b5f601f82116001146115ac57819061159d9394955f926115a1575b50508160011b915f199060031b1c19161790565b9055565b013590505f80611589565b601f198216946115bf845f5260205f2090565b915f5b8781106115f95750836001959697106115e0575b505050811b019055565b01355f19600384901b60f8161c191690555f80806115d6565b909260206001819286860135815501940191016115c2565b908060209392818452848401375f828201840152601f01601f1916010190565b9160209161164a91959495604085526040850191611611565b931515910152565b9160206111a4938181520191611611565b9061166d826110f3565b61167a60405191826102bd565b828152809261168b601f19916110f3565b01905f5b82811061169b57505050565b6020906040516116aa8161029d565b5f81525f838201525f604082015260608082015260606080820152606060a08201525f60c08201528282850101520161168f565b8054821015611084575f5260205f2001905f90565b6111a49060405160208101917f9835e583e3f8f1e4dfc48fe02a92fdbd9a76bc16eec83f3b1f70df2ffbc3b84a83526040820152604081526117366060826102bd565b5190206121bf565b6001600160401b0381116102b857601f01601f191660200190565b6040906111a4949281528160208201520191611611565b3d1561179a573d906117818261173e565b9161178f60405193846102bd565b82523d5f602084013e565b606090565b80516020909101516001600160e01b03198116929190600482106117c1575050565b6001600160e01b031960049290920360031b82901b16169150565b929091833b1561186757915f939161181e85946118106040519384926020840196630b135d3f60e11b885260248501611759565b03601f1981018352826102bd565b51915afa61182a611770565b8161185b575b81611839575090565b630b135d3f60e11b91506001600160e01b0319906118569061179f565b161490565b80516004149150611830565b916118718261173e565b9161187f60405193846102bd565b80835236818501116101f5576020815f926118a19683870137840101526121e5565b6001600160a01b0390811691161490565b60018060a01b0316805f52600760205260405f20825f5260205260ff60405f2054166118fa575f52600760205260405f20905f5260205260405f20600160ff19825416179055565b6301654bf760e61b5f5260045ffd5b90156110845780359060fe19813603018212156101f5570190565b91908110156110845760051b8101359060fe19813603018212156101f5570190565b903590601e19813603018212156101f557018035906001600160401b0382116101f5576020019181360383136101f557565b905f5b81811061198a57505050600190565b60646119a461199a838587611924565b60c0810190611946565b9050116119b35760010161197b565b5050505f90565b9092916119c684611153565b935f5b8181106119d65750505050565b806101006119e76001938588611924565b602081013590604081013590606081013560808201359060e060a084013593611a0f85610a5f565b013593604051957f0a988988f17d3e106a27abc736f142846ce01b2d9b625c96fe145e71be8cc1ec8752602087015260408601526060850152608084015260a083015260c08201528560e082015220611a6882896111a7565b52016119c9565b919091611a8b611a7f8280611089565b92602081019150611185565b90611a958261119a565b9160208101359482158015611c19575b611be357611ada91611ad3611ac8836020611252955160051b91012089886121fb565b916040810190611946565b91866117dc565b611baf57611b06611aff856107388560018060a01b03165f52600660205260405f2090565b5460ff1690565b611b7b5781611b5a611b4d866107387fde9782b6ede4a1d22e2929e1f7757daf3be1d657007a7f02d7d02050721cf4789660018060a01b03165f52600660205260405f2090565b805460ff19166001179055565b6040805195865260208601929092526001600160a01b031693a36001905f90565b5060408051938452600360208501526001600160a01b0391909116925f5160206126b65f395f51905f529190a35f90600390565b5060408051938452600260208501526001600160a01b0391909116925f5160206126b65f395f51905f529190a35f90600290565b505060408051948552600160208601526001600160a01b0392909216935f5160206126b65f395f51905f52929150a35f90600190565b5060148311611aa5565b9060ff611c436040929594955f855260606020860152606085019061090b565b9416910152565b356111a481610a5f565b9060e06007918035845560208101356001850155604081013560028501556060810135600385015560808101356004850155611caa60a0820135611c9781610a5f565b600586019060ff1660ff19825416179055565b611cc4611cba60c0830183611946565b9060068701611549565b0135910155565b8054680100000000000000008110156102b857611ced916001820181556116de565b819291549060031b91821b915f19901b1916179055565b919060406103e15f926001865260606020870152606086019061090b565b94929091945f955f955f945b808610611d3d57505050505050565b909192939496611d4e888387611062565b611d588180611089565b9091611d70611252611d6a8d8c6111a7565b51151590565b611fe25761134c816020611d85930190611185565b91811580159290611fdb576060611d9c8284611909565b0135935b611daa8d8a6111a7565b5190611db583611153565b5f5b848110611fbb5750611dcb83858785612252565b90611f645750509291905f935b828510611e4257505050505091600192918392611e01575b50019701935b929190949394611d2e565b7fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb901611e39611e2d6111bb565b60405191829182611d04565b0390a25f611df0565b909192939e8f60019184611f3d600260e0611f04611ef3610738611e96611b4d8f8f8c8f928f9e611e7c93611e7692611924565b9b6111a7565b5193849160018060a01b03165f52600860205260405f2090565b611eb187611eac835f52600460205260405f2090565b611c54565b611ee5604088013591611ee0611ecf845f52600560205260405f2090565b60608b01355f5260205260405f2090565b611ccb565b5f52600d60205260405f2090565b60808601355f5260205260405f2090565b9386611f1b611f1560a08401611c4a565b60ff1690565b03611f4b57611f2e8282013586546110d2565b85555b013592019182546110d2565b9055019f0193929190611dd8565b81810135611f5d8887019182546110d2565b9055611f31565b9350935050506001949b9392611f7f575b5050500193611df6565b7fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb90191611fb060405192839283611c23565b0390a25f8080611f75565b80611fc96001928789611924565b35611fd482856111a7565b5201611db7565b5f93611da0565b5080999299611ff7575b505060010193611df6565b60606120038284611909565b01359161200f82611153565b915f5b81811061207057505050907fa0a52d009f5a13330062ed5f75173c051733875f678daf3dddcc5fb1f34fb901839261205661204f600196896111a7565b5160ff1690565b9061206660405192839283611c23565b0390a2905f611fec565b8061207e6001928486611924565b3561208982876111a7565b5201612012565b5f546001600160a01b031633036108f857565b307f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03161480612196575b156120fe577f000000000000000000000000000000000000000000000000000000000000000090565b60405160208101907f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f82527f000000000000000000000000000000000000000000000000000000000000000060408201527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a082015260a0815261219060c0826102bd565b51902090565b507f000000000000000000000000000000000000000000000000000000000000000046146120d5565b6042906121ca6120a3565b906040519161190160f01b8352600283015260228201522090565b6111a4916121f291612516565b9092919261256e565b906111a4926040519160208301937fffa38b52b3794fa160256e68781327917915a9d4bded223f53d0414603dd37b8855260018060a01b03166040840152606083015260808201526080815261173660a0826102bd565b909260606122608486611909565b0135925f5b818110612278575050505050505f905f90565b612283818388611924565b61228d82856111a7565b51908660608201350361239c576080810135801561238b5760e08201351561237a5760016122c0611f1560a08501611c4a565b1161236957611aff6112529161073860406122e59501355f52600b60205260405f2090565b61235a575f5b82811061233157506001600160a01b0385165f90815260086020526040902061231791611aff91610738565b61232357600101612265565b505050505050600190600790565b8161233c82876111a7565b511461234a576001016122eb565b5050505050505050600190600790565b50505050505050600190600590565b505050505050505050600190600490565b505050505050505050600190600890565b505050505050505050600190600a90565b5050505050505050600190600990565b60ff81146123bd576111a4906125ea565b50604051600254815f6123cf83610251565b808352926001811690811561245257506001146123f3575b6111a4925003826102bd565b5060025f90815290917f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace5b8183106124365750509060206111a4928201016123e7565b602091935080600191548385880101520191019091839261241e565b602092506111a494915060ff191682840152151560051b8201016123e7565b60ff8114612482576111a4906125ea565b50604051600354815f61249483610251565b808352926001811690811561245257506001146124b7576111a4925003826102bd565b5060035f90815290917fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b5b8183106124fa5750509060206111a4928201016123e7565b60209193508060019154838588010152019101909183926124e2565b81519190604183036125465761253f9250602082015190606060408401519301515f1a90612628565b9192909190565b50505f9160029190565b6004111561255a57565b634e487b7160e01b5f52602160045260245ffd5b61257781612550565b80612580575050565b61258981612550565b600181036125a05763f645eedf60e01b5f5260045ffd5b6125a981612550565b600281036125c4575063fce698f760e01b5f5260045260245ffd5b806125d0600392612550565b146125d85750565b6335e2f38360e21b5f5260045260245ffd5b60ff811690601f821161261957604051916126066040846102bd565b6020808452838101919036833783525290565b632cd44ac360e21b5f5260045ffd5b91907f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a084116126aa579160209360809260ff5f9560405194855216868401526040830152606082015282805260015afa1561269f575f516001600160a01b0381161561269557905f905f90565b505f906001905f90565b6040513d5f823e3d90fd5b5050505f916003919056fe1a27036f4eb7d046165dd3c2d29117a18b873fc3cc71b0c4320b65fbf51b4d2ba264697066735822122054eaaf8040f079b93b9b2c6565dd6962b0eb442bc80b3d30965852dda7abc8af64736f6c634300081e0033";
