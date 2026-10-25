import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const supportUrl = 'https://buy.stripe.com/test_groupi-support';

async function renderFooter(url?: string) {
  vi.stubEnv('NEXT_PUBLIC_SUPPORT_URL', url);
  vi.resetModules();
  const { SiteFooter } = await import('./site-footer');
  return render(<SiteFooter />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('SiteFooter', () => {
  it('offers the configured checkout without an authentication provider or account attribution', async () => {
    await renderFooter(supportUrl);

    const navigation = screen.getByRole('navigation', { name: 'Footer' });
    const support = within(navigation).getByRole('link', {
      name: 'Support Groupi',
    });
    expect(support).toHaveAttribute('href', supportUrl);
    expect(support).toHaveAttribute('target', '_blank');
    expect(support).toHaveAttribute('rel', 'noopener noreferrer');
    expect(
      within(navigation).getByRole('link', { name: 'Changelog' })
    ).toHaveAttribute('href', '/changelog');
    expect(
      within(navigation).getByRole('link', { name: 'API Reference' })
    ).toHaveAttribute('href', '/docs/api');
  });

  it.each([undefined, '', '   '])(
    'hides checkout when the URL is absent (%s)',
    async url => {
      await renderFooter(url);

      expect(
        screen.queryByRole('link', { name: 'Support Groupi' })
      ).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
    }
  );

  it('makes checkout reachable through normal keyboard navigation', async () => {
    const user = userEvent.setup();
    await renderFooter(supportUrl);

    await user.tab();
    expect(screen.getByRole('link', { name: 'Theia' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Changelog' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'API Reference' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Support Groupi' })).toHaveFocus();
  });
});
