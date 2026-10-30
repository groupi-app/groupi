'use client';
import { useState } from 'react';
import { ContextHelp } from '@/components/molecules/context-help';
import { UserInfoCard } from '@/components/molecules/user-info-card';
import { useHasLinkedProviders } from '@/hooks/convex/use-accounts';
import type { Id } from '@/convex/_generated/dataModel';
import {
  useGroupDiscordSettings,
  useGroupDiscordConnection,
} from '@/hooks/convex/use-group-discord';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export function GroupDiscordSettings({ groupId }: { groupId: Id<'groups'> }) {
  const providers = useHasLinkedProviders();
  const form = useGroupDiscordSettings(
    { groupId },
    { refreshMetadataOnMount: providers?.discord === true }
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const connection = form.connection;
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  // Match the Group backend's required capabilities; Event scheduling alone
  // does not request Kick/Ban for membership mode. Never request Administrator.
  const botPermissions = form.mode === 'role' ? '268435585' : '135';
  const installUrl = (guildId?: string) =>
    clientId
      ? `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${botPermissions}&scope=bot${guildId ? `&guild_id=${encodeURIComponent(guildId)}&disable_guild_select=true` : ''}`
      : null;
  const install = installUrl(connection?.guildId);
  const recovery = (
    <div className='flex flex-wrap gap-2'>
      <Button type='button' variant='outline' size='sm' asChild>
        <a href='/settings/account'>Link Discord</a>
      </Button>
      {install ? (
        <Button type='button' variant='outline' size='sm' asChild>
          <a href={install} target='_blank' rel='noopener noreferrer'>
            Install Bot
          </a>
        </Button>
      ) : (
        <p className='text-sm text-muted-foreground'>
          Bot installation is unavailable. Contact a Group owner.
        </p>
      )}
    </div>
  );
  const feedback = (
    <>
      {form.message && (
        <p role='status' className='text-sm'>
          {form.message}
        </p>
      )}
      {form.error && (
        <p role='alert' className='break-words text-sm text-error'>
          {form.error}
        </p>
      )}
    </>
  );
  if (connection === undefined)
    return <p role='status'>Loading Discord connection…</p>;
  if (connection && connection.status !== 'disabled')
    return (
      <section
        aria-label='Group Discord connection'
        className='min-w-0 space-y-4'
      >
        <div className='flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='min-w-0 flex-1'>
            <UserInfoCard
              className='min-w-0 w-full [&_span]:whitespace-normal [&_span]:break-words'
              avatar={{
                src: connection.guildIconUrl,
                fallback: connection.guildName.slice(0, 2),
              }}
              name={connection.guildName}
              subtitle={
                connection.mode === 'role'
                  ? connection.roleName || 'Group role'
                  : 'Server membership'
              }
            />
          </div>
          <Badge
            variant={
              connection.status === 'active'
                ? 'success'
                : connection.status === 'blocked'
                  ? 'destructive'
                  : 'warning'
            }
          >
            {connection.status === 'active'
              ? 'Connected'
              : connection.status === 'blocked'
                ? 'Needs attention'
                : 'Connecting'}
          </Badge>
        </div>
        {connection.status === 'pending' && (
          <p role='status' className='text-sm text-muted-foreground'>
            Discord setup is in progress. If it does not finish, check the bot
            installation and your linked account.
          </p>
        )}
        {connection.status === 'blocked' && (
          <p role='alert' className='break-words text-sm text-error'>
            Setup needs attention.{' '}
            {connection.mode === 'membership'
              ? 'The bot needs Kick Members and Ban Members permissions and a role above enrolled members.'
              : 'Check that the bot can manage the selected Group role.'}{' '}
            {connection.error}
          </p>
        )}
        {connection.synchronizationError && (
          <p role='status' className='break-words text-sm text-error'>
            {connection.synchronizationError}
          </p>
        )}
        {(connection.status !== 'active' ||
          form.error ||
          connection.synchronizationError) &&
          recovery}
        {connection.handedBackRoleIds?.length ? (
          <p className='text-sm text-muted-foreground'>
            Retired setup roles are managed by Discord staff.
          </p>
        ) : null}
        <AlertDialog
          open={confirmOpen}
          onOpenChange={open => {
            if (!form.busy) {
              setConfirmOpen(open);
              if (!open) form.setHandbackConfirmed(false);
            }
          }}
        >
          <AlertDialogTrigger asChild>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={form.busy}
            >
              Disable Discord connection
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disable Discord connection?</AlertDialogTitle>
              <AlertDialogDescription>
                Retained roles and server membership return to Discord staff.
                Pending removals still run. The server and bot remain. Members
                must connect again after a new setup.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <label className='flex items-start gap-2 text-sm'>
              <input
                type='checkbox'
                className='mt-1 shrink-0'
                checked={form.handbackConfirmed}
                disabled={form.busy}
                onChange={event =>
                  form.setHandbackConfirmed(event.target.checked)
                }
              />
              I understand Discord handback
            </label>
            {feedback}
            <AlertDialogFooter className='gap-2'>
              <AlertDialogCancel disabled={form.busy}>Cancel</AlertDialogCancel>
              <Button
                disabled={form.busy || !form.handbackConfirmed}
                onClick={() => void form.disable()}
              >
                {form.busy ? 'Disabling…' : 'Confirm disable'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {!confirmOpen && feedback}
      </section>
    );
  return (
    <form
      className='min-w-0 space-y-4'
      aria-label='Group Discord connection'
      onSubmit={event => {
        event.preventDefault();
        void form.save();
      }}
    >
      <div className='flex items-center gap-2'>
        <p className='text-sm text-muted-foreground'>
          Connect a server you manage.
        </p>
        <ContextHelp label='About Discord permissions'>
          Setup does not change channel permissions or grant staff roles.
          Discord roles do not grant Group membership or management permissions.
        </ContextHelp>
      </div>
      {recovery}
      {providers?.discord !== false && (
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={form.busy || form.loadingGuilds}
          onClick={() => void form.loadGuilds()}
        >
          {form.loadingGuilds ? 'Loading servers…' : 'Load my Discord servers'}
        </Button>
      )}
      <div className='space-y-2'>
        {form.guilds?.available.map(guild => (
          <button
            key={guild.id}
            type='button'
            disabled={form.busy}
            aria-label={guild.name}
            aria-pressed={form.guildId === guild.id}
            onClick={() => form.setGuildId(guild.id)}
            className='flex w-full min-w-0 items-center gap-3 rounded-input border border-border p-3 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary aria-pressed:bg-primary/10'
          >
            <UserInfoCard
              className='min-w-0 w-full [&_span]:whitespace-normal [&_span]:break-words'
              avatar={{
                src: guild.icon
                  ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`
                  : undefined,
                fallback: guild.name.slice(0, 2),
              }}
              name={guild.name}
            />
          </button>
        ))}
      </div>
      {form.guilds && form.guilds.available.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          No available servers. Install the bot in a server you manage, then
          load servers again.
        </p>
      )}
      {form.guilds?.invitable.map(guild => {
        const url = installUrl(guild.id);
        return (
          <div
            key={guild.id}
            className='flex min-w-0 flex-wrap items-center gap-2'
          >
            <span className='min-w-0 flex-1 break-words text-sm'>
              {guild.name}
            </span>
            {url && (
              <Button type='button' size='sm' variant='outline' asChild>
                <a
                  aria-label={`Install Bot in ${guild.name}`}
                  href={url}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Install Bot
                </a>
              </Button>
            )}
          </div>
        );
      })}
      <fieldset disabled={form.busy} className='space-y-2'>
        <legend className='mb-2 text-sm font-medium'>Connection mode</legend>
        <label className='flex gap-2 text-sm'>
          <input
            type='radio'
            name={`discord-mode-${groupId}`}
            checked={form.mode === 'role'}
            onChange={() => form.setMode('role')}
          />
          Group role
        </label>
        <label className='flex gap-2 text-sm'>
          <input
            type='radio'
            name={`discord-mode-${groupId}`}
            checked={form.mode === 'membership'}
            onChange={() => form.setMode('membership')}
          />
          Server membership only
        </label>
      </fieldset>
      <p className='text-sm text-muted-foreground'>
        {form.mode === 'role'
          ? 'When access ends, only the Group role is removed. Server membership remains.'
          : 'When access ends, Groupi may remove or ban enrolled server members. This requires an exclusive server binding, Kick Members and Ban Members permissions. Discord staff must manage accounts at or above the bot’s role.'}
      </p>
      <label className='block space-y-2 text-sm font-medium'>
        Landing channel ID (optional)
        <Input
          value={form.landingChannelId}
          disabled={form.busy}
          onChange={event => form.setLandingChannelId(event.target.value)}
        />
      </label>
      <details className='space-y-3 text-sm'>
        <summary className='cursor-pointer font-medium'>Advanced setup</summary>
        <label className='block space-y-2'>
          Discord server ID
          <Input
            value={form.guildId}
            disabled={form.busy}
            onChange={event => form.setGuildId(event.target.value)}
          />
        </label>
        {form.mode === 'role' && (
          <label className='block space-y-2'>
            Existing role ID (optional)
            <Input
              value={form.roleId}
              disabled={form.busy}
              onChange={event => form.setRoleId(event.target.value)}
            />
            <span className='block text-xs text-muted-foreground'>
              Leave blank to create a Group role. An ID adopts an existing role.
            </span>
          </label>
        )}
      </details>
      {connection?.handedBackRoleIds?.length ? (
        <p className='text-sm text-muted-foreground'>
          Retired setup roles are managed by Discord staff.
        </p>
      ) : null}
      {connection?.synchronizationError && (
        <p role='status' className='break-words text-sm text-error'>
          {connection.synchronizationError}
        </p>
      )}
      <Button disabled={form.busy || !form.guildId.trim()}>
        {form.busy ? 'Saving…' : 'Save Discord connection'}
      </Button>
      {feedback}
    </form>
  );
}

export function GroupDiscordRetiredStatus({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const connection = useGroupDiscordConnection({ groupId, retiredOnly: true });
  if (!connection) return null;
  return (
    <section
      aria-label='Retired Discord connection'
      className='space-y-2 rounded-card border border-border p-4'
    >
      <h2>Discord handback</h2>
      <p>
        Retained roles and server membership are managed by Discord staff. The
        server and bot remain.
      </p>
      <p role='status'>
        {connection.cleanupPending
          ? (connection.synchronizationError ??
            'Discord removal is pending. Removal has not been confirmed.')
          : 'No Discord removals remain pending. Handback does not remove retained access.'}
      </p>
      {connection.handedBackRoleIds?.length ? (
        <p>Retired setup roles are managed by Discord staff.</p>
      ) : null}
    </section>
  );
}
