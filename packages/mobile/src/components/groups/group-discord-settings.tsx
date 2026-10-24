import { View, TextInput } from 'react-native';
import type { Id } from 'convex/_generated/dataModel';
import { useGroupDiscordSettings } from '@/hooks/use-group-discord';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
export function GroupDiscordSettings({ groupId }: { groupId: Id<'groups'> }) {
  const form = useGroupDiscordSettings({ groupId });
  if (form.connection === undefined)
    return <Text>Loading Discord connection…</Text>;
  if (form.connection)
    return (
      <View className='gap-3 rounded-card border border-border p-3'>
        <Text accessibilityRole='header'>Group Discord connection</Text>
        <Text>
          Server: {form.connection.guildName} ({form.connection.guildId}).
        </Text>
        <Text>Status: {form.connection.status}.</Text>
        <Text>
          Mode:{' '}
          {form.connection.mode === 'role'
            ? 'Group role'
            : 'Server membership only'}
          .
        </Text>
        {form.connection.roleId && (
          <Text>
            Dedicated role: {form.connection.roleName ?? 'Group role'} (
            {form.connection.roleId}).
          </Text>
        )}
        {form.connection.landingChannelId && (
          <Text>Landing channel: {form.connection.landingChannelId}.</Text>
        )}
        {form.connection.synchronizationError && (
          <Text accessibilityLiveRegion='polite'>
            {form.connection.synchronizationError}
          </Text>
        )}
        {form.connection.status === 'blocked' && (
          <Text>
            {form.connection.mode === 'membership'
              ? 'Setup needs attention. Check that the Groupi bot is installed with Kick Members and Ban Members permissions, and its role is above enrolled members.'
              : 'Setup needs attention. Check that the Groupi bot is installed and can manage the selected role.'}{' '}
            {form.connection.error}
          </Text>
        )}
        {form.connection.status === 'pending' && (
          <Text accessibilityLiveRegion='polite'>
            Discord setup is in progress.
          </Text>
        )}
        <Text>
          Changing or removing an existing connection is not available here.
        </Text>
      </View>
    );
  return (
    <View className='gap-3 rounded-card border border-border p-3'>
      <Text accessibilityRole='header'>Group Discord connection</Text>
      <Text>
        Connect a server you manage where the Groupi bot is installed. Setup
        does not change channel permissions or grant staff roles. Discord role
        possession never grants Group membership or management permissions.
      </Text>
      <Button
        accessibilityLabel='Load my Discord servers'
        disabled={form.busy || form.loadingGuilds}
        onPress={() => void form.loadGuilds()}
      >
        {form.loadingGuilds ? 'Loading servers…' : 'Load my Discord servers'}
      </Button>
      {form.guilds?.available.map(guild => (
        <Button
          key={guild.id}
          accessibilityLabel={`Choose ${guild.name}`}
          disabled={form.busy}
          onPress={() => form.setGuildId(guild.id)}
        >
          Choose {guild.name}
        </Button>
      ))}
      {form.guilds && form.guilds.available.length === 0 && (
        <Text>
          No available servers found. Link your Discord account and install the
          Groupi bot in a server you manage, then load servers again.
        </Text>
      )}
      {form.guilds?.invitable.map(guild => (
        <Text key={guild.id}>
          Install the Groupi bot in {guild.name} before connecting it.
        </Text>
      ))}
      <Text>Discord server ID</Text>
      <TextInput
        accessibilityLabel='Discord server ID'
        className='rounded-input border border-border p-3 text-foreground'
        editable={!form.busy}
        value={form.guildId}
        onChangeText={form.setGuildId}
      />
      <Text>
        {form.mode === 'role'
          ? 'Role mode removes only the dedicated Group role from enrolled members when access ends; server membership remains.'
          : 'Membership mode may remove or ban enrolled server members when access ends and requires an exclusive server binding. The bot needs Kick Members and Ban Members permissions. Server owners and accounts at or above the bot’s role require Discord staff to manage their access.'}{' '}
        Neither mode purges unenrolled people or grants staff powers. Members
        must explicitly connect later before receiving Discord access.
      </Text>
      <Text>Connection mode</Text>
      {(['role', 'membership'] as const).map(mode => (
        <Button
          key={mode}
          accessibilityLabel={
            mode === 'role' ? 'Group role' : 'Server membership only'
          }
          accessibilityRole='radio'
          role='radio'
          accessibilityState={{
            checked: form.mode === mode,
            disabled: form.busy,
          }}
          disabled={form.busy}
          variant={form.mode === mode ? 'default' : 'outline'}
          onPress={() => form.setMode(mode)}
        >
          {mode === 'role' ? 'Group role' : 'Server membership only'}
        </Button>
      ))}
      {form.mode === 'role' && (
        <View className='gap-2'>
          <Text>Existing role ID (optional)</Text>
          <TextInput
            accessibilityLabel='Existing role ID (optional)'
            className='rounded-input border border-border p-3 text-foreground'
            editable={!form.busy}
            value={form.roleId}
            onChangeText={form.setRoleId}
          />
          <Text>
            Leave blank to create a dedicated Group role. Enter an ID only to
            explicitly adopt an existing role.
          </Text>
        </View>
      )}
      <Text>Landing channel ID (optional)</Text>
      <TextInput
        accessibilityLabel='Landing channel ID (optional)'
        className='rounded-input border border-border p-3 text-foreground'
        editable={!form.busy}
        value={form.landingChannelId}
        onChangeText={form.setLandingChannelId}
      />
      <Button
        accessibilityLabel='Save Discord connection'
        disabled={form.busy}
        onPress={() => void form.save()}
      >
        {form.busy ? 'Saving…' : 'Save Discord connection'}
      </Button>
      {form.message ? (
        <Text accessibilityRole='alert'>{form.message}</Text>
      ) : null}
      {form.error ? <Text accessibilityRole='alert'>{form.error}</Text> : null}
    </View>
  );
}
