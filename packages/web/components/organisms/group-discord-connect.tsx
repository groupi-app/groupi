'use client';
import type { Id } from '@/convex/_generated/dataModel';
import { useGroupDiscordEnrollment } from '@/hooks/convex/use-group-discord';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export function GroupDiscordConnect({ groupId }: { groupId: Id<'groups'> }) {
  const form = useGroupDiscordEnrollment({ groupId }, async () => {
    const result = await authClient.linkSocial({
      provider: 'discord',
      scopes: ['identify', 'guilds', 'guilds.join'],
      callbackURL: `/groups/${encodeURIComponent(groupId)}`,
    });
    if (result.error)
      throw new Error(
        result.error.message || 'Discord authorization was not completed.'
      );
  });
  const status = form.enrollment;
  if (status === undefined)
    return <p role='status'>Loading your Discord access…</p>;
  if (!status) return null;
  return (
    <section
      className='rounded-card border border-border p-4 space-y-4'
      aria-label='Your Discord access'
    >
      <h2 className='text-xl font-semibold'>Your Discord access</h2>
      <p>{status.guildName}</p>
      {status.linkedDiscordUserId && (
        <p>Linked Discord account ID: {status.linkedDiscordUserId}</p>
      )}
      <p>
        {status.linked
          ? 'Your Discord account is linked. Linking an account does not enroll you in this Group’s Discord access.'
          : 'Connect your Discord account to request access to this Group’s server.'}
      </p>
      <p>
        {status.mode === 'membership'
          ? 'By selecting Connect Discord, you allow Groupi to join you to this server and manage your server membership. When Group access ends, Groupi can remove you from the server. A Group ban or coordinated exclusion can ban your Discord account from this server. Discord staff must review and remove Discord bans before you can connect again.'
          : 'Connecting lets Groupi join you to this server and manage its dedicated Group role. When Group access ends, Groupi removes that role; your server membership remains. Discord staff control bans and server rules. Other roles and channel permissions can preserve independent Discord access.'}{' '}
        Complete required Group onboarding before connecting.
      </p>
      <p role='status'>
        {status.status === 'not_connected'
          ? 'Not connected to this Group’s Discord.'
          : status.status === 'connected'
            ? 'Connected to this Group’s Discord.'
            : status.status === 'pending'
              ? 'Discord connection is pending.'
              : status.status === 'screening'
                ? 'Complete the server’s membership screening in Discord to finish connecting.'
                : 'Discord access needs attention. Contact a Group manager or Discord staff before trying again.'}
      </p>
      {status.error && <p role='alert'>{status.error}</p>}
      {status.externalException && (
        <p>
          Externally managed access: {status.externalException}. Discord staff
          manage this account’s access.
          {status.mode === 'membership' &&
            ' Groupi cannot remove server owners or accounts at or above the bot’s role. This exception does not grant Group membership or management permissions.'}
        </p>
      )}
      {(status.status === 'not_connected' || status.status === 'blocked') && (
        <Button
          disabled={form.busy || status.eligible === false}
          onClick={() => void form.connect()}
        >
          {form.busy ? 'Connecting…' : 'Connect Discord'}
        </Button>
      )}
      {status.status === 'screening' && (
        <Button
          disabled={form.busy || status.eligible === false}
          onClick={() => void form.connect()}
        >
          {form.busy ? 'Checking…' : 'Check Discord access'}
        </Button>
      )}
      {(status.status === 'connected' || status.status === 'screening') && (
        <a
          className='text-primary underline underline-offset-4'
          href={status.openUrl}
          target='_blank'
          rel='noopener noreferrer'
        >
          Open Discord
        </a>
      )}
      {form.message && <p role='status'>{form.message}</p>}
      {form.error && <p role='alert'>{form.error}</p>}
    </section>
  );
}
