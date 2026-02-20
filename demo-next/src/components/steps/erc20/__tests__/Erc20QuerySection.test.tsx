import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Erc20QuerySection } from '@/components/steps/erc20/sections/Erc20QuerySection';

vi.mock('@/store/useErc20Store', () => ({
  useErc20Store: (selector: (state: { tokenAddress: `0x${string}` | null }) => unknown) =>
    selector({ tokenAddress: '0x1234567890abcdef1234567890abcdef12345678' }),
}));

vi.mock('@/hooks/useErc20Query', () => ({
  useErc20Query: () => ({
    isLoading: false,
    error: null,
    snapshot: {
      name: 'CelebToken',
      symbol: 'CELEB',
      decimals: 18,
      totalSupply: 1000n,
      owner: '0x1234567890abcdef1234567890abcdef12345678',
      paused: false,
      domainSeparator: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    },
    addressQuery: {
      balance: 10n,
      nonce: 2n,
      allowance: 5n,
    },
    receipt: null,
    events: [],
    loadSnapshot: vi.fn(),
    loadAddressQuery: vi.fn(),
    loadReceiptWithEvents: vi.fn(),
    loadEventsByRange: vi.fn(),
  }),
}));

describe('Erc20QuerySection', () => {
  it('renders basic and advanced query sections', () => {
    const html = renderToStaticMarkup(<Erc20QuerySection />);

    expect(html).toContain('기본 조회');
    expect(html).toContain('고급 조회 (Tx 영수증 / 이벤트)');
    expect(html).toContain('DOMAIN_SEPARATOR');
  });
});
