import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TabNavigation } from '@/components/layout/TabNavigation';

vi.mock('next/navigation', () => ({
  usePathname: () => '/erc20',
  useRouter: () => ({ push: vi.fn() }),
}));

describe('TabNavigation', () => {
  it('renders ERC20 tab label', () => {
    const html = renderToStaticMarkup(<TabNavigation />);

    expect(html).toContain('ERC20');
    expect(html).toContain('Main Voting');
    expect(html).toContain('Boosting');
  });
});
