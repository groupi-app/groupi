'use client';
import type { Id } from '@/convex/_generated/dataModel';
import { useGroupDiscordSettings } from '@/hooks/convex/use-group-discord';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export function GroupDiscordSettings({ groupId }: { groupId: Id<'groups'> }) {
  const form = useGroupDiscordSettings({ groupId });
  if (form.connection === undefined)
    return <p role='status'>Loading Discord connection…</p>;
  if (form.connection)
    return (
      <section className='rounded-card border border-border p-4 space-y-4'>
        <p className='text-xl font-semibold'>Group Discord connection</p>
        <p>
          Server: {form.connection.guildName} ({form.connection.guildId}).
        </p>
        <p>Status: {form.connection.status}.</p>
        <p>
          Mode:{' '}
          {form.connection.mode === 'role'
            ? 'Group role'
            : 'Server membership only'}
          .
        </p>
        {form.connection.roleId && (
          <p>
            Dedicated role: {form.connection.roleName ?? 'Group role'} (
            {form.connection.roleId}).
          </p>
        )}
        {form.connection.landingChannelId && (
          <p>Landing channel: {form.connection.landingChannelId}.</p>
        )}
        {form.connection.status === 'blocked' && (
          <p>
            Setup needs attention. Check that the Groupi bot is installed and
            can manage the selected role. {form.connection.error}
          </p>
        )}
        {form.connection.status === 'pending' && (
          <p role='status'>Discord setup is in progress.</p>
        )}
        <p>
          Changing or removing an existing connection is not available here.
        </p>
      </section>
    );
  return (
    <form
      className='rounded-card border border-border p-4 space-y-4'
      aria-labelledby='group-discord-heading'
      onSubmit={event => {
        event.preventDefault();
        void form.save();
      }}
    >
      <h2 id='group-discord-heading' className='text-xl font-semibold'>
        Group Discord connection
      </h2>
      <p>
        Connect a server you manage where the Groupi bot is installed. Setup
        does not change channel permissions or grant staff roles. Discord role
        possession never grants Group membership or management permissions.
      </p>
      <Button
        type='button'
        disabled={form.busy || form.loadingGuilds}
        onClick={() => void form.loadGuilds()}
      >
        {form.loadingGuilds ? 'Loading servers…' : 'Load my Discord servers'}
      </Button>
      {form.guilds?.available.map(guild => (
        <Button
          key={guild.id}
          type='button'
          disabled={form.busy}
          onClick={() => form.setGuildId(guild.id)}
        >
          Choose {guild.name}
        </Button>
      ))}
      {form.guilds && form.guilds.available.length === 0 && (
        <p>
          No available servers found. Link your Discord account and install the
          Groupi bot in a server you manage, then load servers again.
        </p>
      )}
      {form.guilds?.invitable.map(guild => (
        <p key={guild.id}>
          Install the Groupi bot in {guild.name} before connecting it.
        </p>
      ))}
      <label className='block space-y-2'>
        Discord server ID
        <Input
          value={form.guildId}
          disabled={form.busy}
          onChange={event => form.setGuildId(event.target.value)}
        />
      </label>
      <p>
        {form.mode === 'role'
          ? 'Role mode removes only the dedicated Group role from enrolled members when access ends; server membership remains.'
          : 'Membership mode may remove or ban enrolled server members when access ends and requires an exclusive server binding.'}{' '}
        Neither mode purges unenrolled people or grants staff powers. Members
        must explicitly connect later before receiving Discord access.
      </p>
      <fieldset disabled={form.busy} className='space-y-2'>
        <legend>Connection mode</legend>
        <label className='flex gap-2'>
          <input
            type='radio'
            name='discord-mode'
            checked={form.mode === 'role'}
            onChange={() => form.setMode('role')}
          />
          Group role
        </label>
        <label className='flex gap-2'>
          <input
            type='radio'
            name='discord-mode'
            checked={form.mode === 'membership'}
            onChange={() => form.setMode('membership')}
          />
          Server membership only
        </label>
      </fieldset>
      {form.mode === 'role' && (
        <label className='block space-y-2'>
          Existing role ID (optional)
          <Input
            value={form.roleId}
            disabled={form.busy}
            onChange={event => form.setRoleId(event.target.value)}
          />
          <span className='text-sm text-muted-foreground'>
            Leave blank to create a dedicated Group role. Enter an ID only to
            explicitly adopt an existing role.
          </span>
        </label>
      )}
      <label className='block space-y-2'>
        Landing channel ID (optional)
        <Input
          value={form.landingChannelId}
          disabled={form.busy}
          onChange={event => form.setLandingChannelId(event.target.value)}
        />
      </label>
      <Button disabled={form.busy}>
        {form.busy ? 'Saving…' : 'Save Discord connection'}
      </Button>
      {form.message && <p role='status'>{form.message}</p>}
      {form.error && (
        <p role='alert' className='text-error'>
          {form.error}
        </p>
      )}
    </form>
  );
}
