import { render, screen } from '@testing-library/react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { expect, it, vi } from 'vitest';
import { LinkedAccountsList } from '@/app/(settings)/settings/components/linked-accounts-list';
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
it('keeps failed Discord retirement visible after the linked account disappears', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => ({
      pending: true,
      error: 'Check bot permissions.',
      externallyManaged: false,
    }),
  }));
  const mounted = render(
    <ConvexProvider client={client}>
      <LinkedAccountsList linkedAccounts={[]} userEmail='member@example.com' />
    </ConvexProvider>
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    /Replacement access is blocked/
  );
  expect(screen.getByRole('status')).toHaveTextContent(/Check bot permissions/);
  expect(screen.getByText(/contact your Group manager/)).toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('distinguishes known externally managed membership from pending cleanup', async () => {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => ({ pending: false, externallyManaged: true }),
  }));
  const mounted = render(
    <ConvexProvider client={client}>
      <LinkedAccountsList linkedAccounts={[]} userEmail='member@example.com' />
    </ConvexProvider>
  );
  expect(
    screen.getByText(/membership remains externally managed/)
  ).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
