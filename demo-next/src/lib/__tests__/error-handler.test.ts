import { describe, expect, it } from 'vitest';
import { getBlockchainErrorMessage } from '@/lib/error-handler';

describe('getBlockchainErrorMessage', () => {
  it('maps ERC2612InvalidSigner selector to friendly message', () => {
    const rawMessage =
      'The contract function "permit" reverted with the following signature: 0x4b800e46 ' +
      'Unable to decode signature "0x4b800e46" as it was not found on the provided ABI. ' +
      'Contract Call: function: permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)';

    expect(getBlockchainErrorMessage(new Error(rawMessage))).toBe(
      'permit 서명자가 owner와 일치하지 않습니다. 서명 지갑/owner/v-r-s를 확인해주세요'
    );
  });

  it('returns fallback message with selector when custom error is unknown', () => {
    const rawMessage = 'execution reverted with signature: 0x1234abcd';

    expect(getBlockchainErrorMessage(new Error(rawMessage))).toBe(
      '컨트랙트 실행이 실패했습니다 (오류 코드: 0x1234abcd)'
    );
  });
});
