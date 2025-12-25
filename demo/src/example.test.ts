import { describe, it, expect } from 'vitest';

// Foundry ABI import 테스트
// import CelbTokenAbi from '@contracts/CelbToken.sol/CelbToken.json';

describe('Foundry ABI Import Test', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  // ABI import 테스트 (npm install 후 활성화)
  // it('should import Foundry ABI', () => {
  //   expect(CelbTokenAbi).toBeDefined();
  //   expect(CelbTokenAbi.abi).toBeDefined();
  // });
});
