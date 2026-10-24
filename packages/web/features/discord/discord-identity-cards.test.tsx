import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useLinkedAccounts } from '@/hooks/convex/use-accounts';
import { DiscordIdentityCards } from './discord-identity-cards';
const viewer = vi.hoisted(() => ({ isAuthenticated: true, isLoading: false }));
vi.mock('convex/react', () => ({ useConvexAuth: () => viewer }));
vi.mock('@/hooks/convex/use-accounts', () => ({ useLinkedAccounts: vi.fn() }));
const account = {
  id: 'linked',
  providerId: 'discord',
  accountId: '123456789',
  username: 'river',
  displayName: 'River Reader',
  avatarUrl: 'https://cdn.discordapp.com/avatars/123456789/avatar.png',
  createdAt: 1,
};
const props = {
  guildName: 'Reading Circle',
  guildIconUrl: 'https://cdn.discordapp.com/icons/server/icon.png',
  linked: true,
  linkedDiscordUserId: '123456789',
};
beforeEach(() => {
  viewer.isAuthenticated = true;
  vi.clearAllMocks();
  vi.mocked(useLinkedAccounts).mockReturnValue({
    accounts: [account],
    refetch: vi.fn(),
  });
  vi.stubGlobal(
    'Image',
    class extends EventTarget {
      complete = true;
      naturalWidth = 40;
      src = '';
    }
  );
});
afterEach(() => vi.unstubAllGlobals());
it('shows the Discord server icon and matched Discord profile picture, display name and handle', async () => {
  render(<DiscordIdentityCards {...props} />);
  const server = screen.getByRole('region', { name: 'Discord server' }),
    profile = screen.getByRole('region', { name: 'Your Discord account' });
  expect(within(server).getByText('Reading Circle')).toBeVisible();
  expect(await within(server).findByRole('img')).toHaveAttribute(
    'src',
    props.guildIconUrl
  );
  expect(within(profile).getByText('River Reader')).toBeVisible();
  expect(within(profile).getByText('@river')).toBeVisible();
  expect(await within(profile).findByRole('img')).toHaveAttribute(
    'src',
    account.avatarUrl
  );
  expect(screen.queryByText('123456789')).not.toBeInTheDocument();
});
it('never substitutes a different linked account or provider for the confirmed Discord identity', () => {
  vi.mocked(useLinkedAccounts).mockReturnValue({
    accounts: [
      { ...account, accountId: 'different' },
      { ...account, providerId: 'google' },
    ],
    refetch: vi.fn(),
  });
  render(<DiscordIdentityCards {...props} />);
  expect(screen.getByText('Discord account linked')).toBeVisible();
  expect(screen.queryByText('River Reader')).not.toBeInTheDocument();
  expect(screen.queryByText('@river')).not.toBeInTheDocument();
  expect(screen.queryByText('123456789')).not.toBeInTheDocument();
});
it('keeps a generic linked identity while enrichment is unavailable', () => {
  vi.mocked(useLinkedAccounts).mockReturnValue({
    accounts: undefined,
    refetch: vi.fn(),
  });
  render(<DiscordIdentityCards {...props} />);
  expect(screen.getByText('Discord account linked')).toBeVisible();
  expect(screen.queryByText('123456789')).not.toBeInTheDocument();
});
it('does not fetch private linked accounts before authentication', () => {
  viewer.isAuthenticated = false;
  render(<DiscordIdentityCards {...props} />);
  expect(useLinkedAccounts).not.toHaveBeenCalled();
});
it('does not fetch linked profiles without a confirmed Discord account', () => {
  render(
    <DiscordIdentityCards
      {...props}
      linked={false}
      linkedDiscordUserId={undefined}
    />
  );
  expect(useLinkedAccounts).not.toHaveBeenCalled();
  expect(screen.getByText('Discord account not linked')).toBeVisible();
});

it('clears the previous profile immediately when the confirmed account changes', () => {
  const mounted = render(<DiscordIdentityCards {...props} />);
  expect(screen.getByText('@river')).toBeVisible();
  mounted.rerender(
    <DiscordIdentityCards
      {...props}
      linkedDiscordUserId='another-discord-account'
    />
  );
  expect(screen.getByText('Discord account linked')).toBeVisible();
  expect(screen.queryByText('@river')).not.toBeInTheDocument();
  expect(screen.queryByText('River Reader')).not.toBeInTheDocument();
});
