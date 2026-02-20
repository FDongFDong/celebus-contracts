import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { formatTxHash } from '@/lib/format';
import { copyTxHashToClipboard, TxHashDisplay } from '../TxHashDisplay';

const TX_HASH =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

describe('TxHashDisplay', () => {
  it('renders formatted tx id and explorer button', () => {
    const html = renderToStaticMarkup(
      <TxHashDisplay txHash={TX_HASH} chainId={5611} />
    );

    expect(html).toContain('TX ID:');
    expect(html).toContain(formatTxHash(TX_HASH));
    expect(html).toContain('블록 탐색기에서 보기');
  });

  it('copies full tx hash', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      configurable: true,
    });

    const copied = await copyTxHashToClipboard(TX_HASH);

    expect(copied).toBe(true);
    expect(writeText).toHaveBeenCalledWith(TX_HASH);
  });

  it('hides explorer button for unsupported chain but keeps tx id', () => {
    const html = renderToStaticMarkup(
      <TxHashDisplay txHash={TX_HASH} chainId={9999} />
    );

    expect(html).toContain('TX ID:');
    expect(html).toContain(formatTxHash(TX_HASH));
    expect(html).not.toContain('블록 탐색기에서 보기');
  });
});
