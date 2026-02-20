import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InlineStatus } from '../InlineStatus';

const TX_1 =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const TX_2 =
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd';

describe('InlineStatus', () => {
  it('renders tx id and explorer button for single tx success', () => {
    const html = renderToStaticMarkup(
      <InlineStatus
        status={{ type: 'success', message: 'Executor 설정 완료!' }}
        txHash={TX_1}
        chainId={5611}
      />
    );

    expect(html).toContain('Executor 설정 완료!');
    expect(html).toContain('TX ID:');
    expect(html).toContain('블록 탐색기에서 보기');
  });

  it('renders tx labels for multiple hashes', () => {
    const html = renderToStaticMarkup(
      <InlineStatus
        status={{ type: 'success', message: '투표 타입 설정 완료!' }}
        txHashes={[TX_1, TX_2]}
      />
    );

    expect(html).toContain('TX 1:');
    expect(html).toContain('TX 2:');
  });

  it('keeps tx id visible without explorer on unsupported chain', () => {
    const html = renderToStaticMarkup(
      <InlineStatus
        status={{ type: 'success', message: '완료' }}
        txHash={TX_1}
        chainId={9999}
      />
    );

    expect(html).toContain('TX ID:');
    expect(html).not.toContain('블록 탐색기에서 보기');
  });
});
