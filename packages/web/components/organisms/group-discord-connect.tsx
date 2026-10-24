'use client';
import type { Id } from '@/convex/_generated/dataModel';
import { useGroupDiscordEnrollment } from '@/hooks/convex/use-group-discord';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { ContextHelp } from '@/components/molecules/context-help';

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
      className='rounded-card border border-border p-4 space-y-3'
      aria-label='Your Discord access'
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='space-y-1'>
          <h2 className='font-heading text-lg font-semibold'>
            Your Discord access
          </h2>
          <p className='text-sm text-muted-foreground'>{status.guildName}</p>
        </div>
        <ContextHelp label='About your Discord access'>
          <div className='space-y-3'>
            <p>
              Linking your Discord account does not connect it to this Group’s
              server. Select Connect Discord to give consent.
            </p>
            <p>
              {status.mode === 'membership'
                ? 'Discord staff must remove any Discord ban before you can reconnect. Groupi cannot remove server owners or accounts at or above the bot’s role.'
                : 'Discord staff control bans and server rules. Other roles and channel permissions can preserve independent Discord access.'}
            </p>
            <p>
              If the server requires membership screening, complete it in
              Discord to finish connecting. Discord access does not grant Group
              membership or management permissions.
            </p>
            {status.externalException && (
              <p>
                Externally managed access: {status.externalException}. Discord
                staff manage this account’s access.
              </p>
            )}
          </div>
        </ContextHelp>
      </div>
      {status.linked && (
        <p className='text-sm text-muted-foreground'>
          {status.linkedDiscordUserId
            ? `Linked Discord account ID: ${status.linkedDiscordUserId}`
            : 'Discord account linked.'}
        </p>
      )}
      {(status.status === 'not_connected' || status.status === 'blocked') && (
        <p className='text-sm leading-relaxed'>
          {status.mode === 'membership'
            ? 'Connect joins this server and lets Groupi manage your membership. Losing Group access can remove you from the server; a Group ban or coordinated exclusion can ban your Discord account.'
            : 'Connect joins this server and lets Groupi manage your Group role. Losing Group access removes that role; you stay in the server.'}
        </p>
      )}
      {status.eligible === false && (
        <p className='text-sm'>
          Complete required Group onboarding before connecting.
        </p>
      )}
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
        <p className='text-sm text-muted-foreground'>
          {status.externalException.toLowerCase().includes('owner')
            ? 'Server owner access is managed in Discord.'
            : 'This account’s access is managed in Discord.'}
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
