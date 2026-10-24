'use client';
import { useConvexAuth } from 'convex/react';
import { UserInfoCard } from '@/components/molecules/user-info-card';
import { useLinkedAccounts } from '@/hooks/convex/use-accounts';
import { getInitialsFromName } from '@/lib/utils';

function DiscordProfileCard({
  linked,
  username,
  displayName,
  avatarUrl,
}: {
  linked: boolean;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}) {
  const name =
    displayName ||
    username ||
    (linked ? 'Discord account linked' : 'Discord account not linked');
  return (
    <section
      aria-label='Your Discord account'
      className='min-w-0 space-y-3 rounded-input border border-border p-4'
    >
      <h2 className='text-xs font-medium text-muted-foreground'>
        Your Discord account
      </h2>
      <UserInfoCard
        avatar={{
          src: avatarUrl,
          fallback:
            displayName || username
              ? getInitialsFromName(displayName || username, '')
              : 'D',
        }}
        name={name}
        subtitle={username ? `@${username.replace(/^@/, '')}` : undefined}
      />
    </section>
  );
}
function LinkedDiscordProfile({ accountId }: { accountId: string }) {
  const { accounts } = useLinkedAccounts();
  const account = accounts?.find(
    account =>
      account.providerId === 'discord' && account.accountId === accountId
  );
  return (
    <DiscordProfileCard
      linked
      username={account?.username}
      displayName={account?.displayName}
      avatarUrl={account?.avatarUrl}
    />
  );
}

export function DiscordIdentityCards({
  guildName,
  guildIconUrl,
  linked,
  linkedDiscordUserId,
}: {
  guildName: string;
  guildIconUrl?: string;
  linked: boolean;
  linkedDiscordUserId?: string;
}) {
  const { isAuthenticated } = useConvexAuth();
  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      <section
        aria-label='Discord server'
        className='min-w-0 space-y-3 rounded-input border border-border p-4'
      >
        <h2 className='text-xs font-medium text-muted-foreground'>
          Discord server
        </h2>
        <UserInfoCard
          avatar={{
            src: guildIconUrl,
            fallback: getInitialsFromName(guildName, ''),
          }}
          name={guildName}
        />
      </section>
      {isAuthenticated && linked && linkedDiscordUserId ? (
        <LinkedDiscordProfile
          key={linkedDiscordUserId}
          accountId={linkedDiscordUserId}
        />
      ) : (
        <DiscordProfileCard linked={linked} />
      )}
    </div>
  );
}
