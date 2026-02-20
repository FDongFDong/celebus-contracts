import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TransactionTracker } from '../TransactionTracker';

const TX_HASH =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

describe('TransactionTracker', () => {
  it('renders tx id and explorer button in confirmed state', () => {
    const html = renderToStaticMarkup(
      <TransactionTracker status="confirmed" txHash={TX_HASH} chainId={5611} />
    );

    expect(html).toContain('트랜잭션 완료');
    expect(html).toContain('TX ID:');
    expect(html).toContain('블록 탐색기에서 보기');
  });

  it('shows tx id and hides explorer on unsupported chain', () => {
    const html = renderToStaticMarkup(
      <TransactionTracker status="confirmed" txHash={TX_HASH} chainId={9999} />
    );

    expect(html).toContain('TX ID:');
    expect(html).not.toContain('블록 탐색기에서 보기');
  });
});
