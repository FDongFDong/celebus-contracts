export const usedUserNoncesAbi = [
  {
    name: 'usedUserNonces',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'nonce', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
