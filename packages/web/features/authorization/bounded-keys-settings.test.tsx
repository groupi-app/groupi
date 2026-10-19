import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation, useQuery } from 'convex/react';
import { BoundedKeysSettings } from './bounded-keys-settings';

vi.mock('@/convex/_generated/api', () => ({
  api: {
    authorization: {
      queries: {
        list: 'list',
        eligibleEvents: 'events',
        catalog: 'catalog',
        audit: 'audit',
      },
      mutations: {
        issue: 'issue',
        revoke: 'revoke',
        replaceBounds: 'replace',
        revokeUserCredentials: 'recover',
      },
    },
  },
}));

describe('bounded API key settings', () => {
  beforeEach(() => {
    vi.mocked(useMutation).mockReturnValue(vi.fn() as never);
    vi.mocked(useQuery).mockImplementation((...args) => {
      const reference = args[0];
      if (reference === ('list' as never)) return [];
      if (reference === ('events' as never))
        return [{ _id: 'event-1', title: 'Dinner', role: 'ORGANIZER' }];
      if (reference === ('catalog' as never))
        return [
          {
            action: 'events.read',
            supported: true,
            principalKinds: ['user', 'integration'],
          },
        ];
      return [];
    });
  });

  it('requires explicit actions and event bounds before creating a named key', async () => {
    const user = userEvent.setup();
    render(<BoundedKeysSettings />);
    await user.click(
      screen.getByRole('button', { name: 'Create bounded key' })
    );
    await user.type(screen.getByLabelText('Key name'), 'Calendar');
    expect(screen.getByRole('button', { name: 'Create key' })).toBeDisabled();
    await user.click(screen.getByLabelText('Read events'));
    expect(screen.getByRole('button', { name: 'Create key' })).toBeDisabled();
    await user.click(screen.getByLabelText('Dinner'));
    expect(screen.getByRole('button', { name: 'Create key' })).toBeEnabled();
  });
  it('shows a newly issued secret only until the create dialog closes', async () => {
    const issue = vi.fn().mockResolvedValue({ key: 'test-secret-once' });
    vi.mocked(useMutation).mockReturnValue(issue as never);
    const user = userEvent.setup();
    render(<BoundedKeysSettings />);
    await user.click(
      screen.getByRole('button', { name: 'Create bounded key' })
    );
    await user.type(screen.getByLabelText('Key name'), 'Calendar');
    await user.click(screen.getByLabelText('Read events'));
    await user.click(screen.getByLabelText('Dinner'));
    await user.click(screen.getByRole('button', { name: 'Create key' }));
    expect(await screen.findByText('test-secret-once')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    await user.click(
      screen.getByRole('button', { name: 'Create bounded key' })
    );
    expect(screen.queryByText('test-secret-once')).not.toBeInTheDocument();
    expect(issue).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Calendar',
        principalKind: 'user',
        actions: ['events.read'],
        selector: { kind: 'selected', eventIds: ['event-1'] },
      })
    );
  });

  it('acknowledges revocation only after the request completes', async () => {
    vi.mocked(useQuery).mockReturnValue([
      {
        grantId: 'grant-1',
        name: 'Calendar',
        principalKind: 'user',
        actions: ['events.read'],
        selector: { kind: 'selected', eventIds: [] },
        expiresAt: null,
        revokedAt: null,
      },
    ]);
    const revoke = vi.fn().mockResolvedValue({ revokedAt: 100 });
    vi.mocked(useMutation).mockReturnValue(revoke as never);
    const user = userEvent.setup();
    render(<BoundedKeysSettings />);
    await user.click(screen.getByRole('button', { name: 'Revoke Calendar' }));
    expect(
      screen.queryByText('Key revoked. New requests will be denied.')
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Confirm revocation' })
    );
    expect(
      await screen.findByText('Key revoked. New requests will be denied.')
    ).toBeInTheDocument();
  });
  it('allows an owner to replace a key’s action and event bounds without issuing another secret', async () => {
    vi.mocked(useQuery).mockImplementation((...args) => {
      if (args[0] === ('list' as never))
        return [
          {
            grantId: 'grant-1',
            name: 'Calendar',
            principalKind: 'user',
            actions: ['events.read'],
            selector: { kind: 'all-current-and-future' },
            expiresAt: null,
            revokedAt: null,
          },
        ];
      if (args[0] === ('catalog' as never))
        return [
          { action: 'events.read', supported: true, principalKinds: ['user'] },
        ];
      if (args[0] === ('events' as never))
        return [{ _id: 'event-1', title: 'Dinner', role: 'ORGANIZER' }];
      return [];
    });
    const replace = vi.fn().mockResolvedValue({ updatedAt: 1 });
    vi.mocked(useMutation).mockReturnValue(replace as never);
    const user = userEvent.setup();
    render(<BoundedKeysSettings />);
    await user.click(
      screen.getByRole('button', { name: 'Edit access for Calendar' })
    );
    await user.click(
      screen.getByLabelText(
        'All current and future events within my current authority'
      )
    );
    await user.click(screen.getByLabelText('Dinner'));
    await user.click(screen.getByRole('button', { name: 'Save access' }));
    expect(replace).toHaveBeenCalledWith({
      grantId: 'grant-1',
      actions: ['events.read'],
      selector: { kind: 'selected', eventIds: ['event-1'] },
    });
    expect(await screen.findByText('Key access updated.')).toBeInTheDocument();
  });

  it('explains that account recovery revokes user credentials while preserving integrations', async () => {
    const recover = vi.fn().mockResolvedValue({ revokedCount: 2 });
    vi.mocked(useMutation).mockReturnValue(recover as never);
    const user = userEvent.setup();
    render(<BoundedKeysSettings />);
    await user.click(
      screen.getByRole('button', { name: 'Revoke my user credentials' })
    );
    expect(
      screen.getByText(/Integration keys keep their separate controls/)
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Confirm user credential recovery' })
    );
    expect(
      await screen.findByText(
        'User credentials revoked. Integration keys were preserved.'
      )
    ).toBeInTheDocument();
  });
});

it('updates a displayed active key to expired when time passes without a subscription change', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2030-01-01T12:00:00Z'));
  vi.mocked(useQuery).mockReturnValue([
    {
      grantId: 'grant-clock',
      name: 'Clock key',
      principalKind: 'user',
      actions: ['events.read'],
      selector: { kind: 'selected', eventIds: [] },
      expiresAt: Date.now() + 30_000,
      revokedAt: null,
    },
  ]);
  const view = render(<BoundedKeysSettings />);
  try {
    expect(screen.getByText(/^Active/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByText(/^Expired/)).toBeInTheDocument();
  } finally {
    view.unmount();
    vi.useRealTimers();
  }
});

it('creates an identity-only user key without events while event actions still require an event', async () => {
  vi.mocked(useQuery).mockImplementation((...args) => {
    if (args[0] === ('catalog' as never))
      return [
        {
          action: 'identity.display-name',
          supported: true,
          principalKinds: ['user'],
        },
        {
          action: 'events.read',
          supported: true,
          principalKinds: ['user', 'integration'],
        },
      ];
    return [];
  });
  const issue = vi.fn().mockResolvedValue({ key: 'identity-secret' });
  vi.mocked(useMutation).mockReturnValue(issue as never);
  const user = userEvent.setup();
  render(<BoundedKeysSettings />);
  await user.click(screen.getByRole('button', { name: 'Create bounded key' }));
  await user.type(screen.getByLabelText('Key name'), 'Identity reader');
  await user.click(screen.getByLabelText('Read events'));
  expect(screen.getByRole('button', { name: 'Create key' })).toBeDisabled();
  await user.click(screen.getByLabelText('Named integration'));
  await user.click(screen.getByLabelText('Read events'));
  expect(screen.getByRole('button', { name: 'Create key' })).toBeDisabled();
  await user.click(screen.getByLabelText('Your account'));
  await user.click(screen.getByLabelText('Read events'));
  await user.click(screen.getByLabelText('Read your display name'));
  expect(screen.getByRole('button', { name: 'Create key' })).toBeEnabled();
  await user.click(screen.getByRole('button', { name: 'Create key' }));
  expect(issue).toHaveBeenCalledWith(
    expect.objectContaining({
      principalKind: 'user',
      actions: ['identity.display-name'],
      selector: { kind: 'selected', eventIds: [] },
    })
  );
});
