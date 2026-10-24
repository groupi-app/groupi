import { View, Linking } from 'react-native';
import type { Id } from 'convex/_generated/dataModel';
import { useGroupDiscordEnrollment } from '@/hooks/use-group-discord';
import { authClient } from '@/lib/auth-client';
import { getNativeAuthCallbackPath } from '@/lib/native-auth';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

export function GroupDiscordConnect({ groupId }: { groupId: Id<'groups'> }) {
  const form = useGroupDiscordEnrollment({ groupId }, async () => {
    const result = await authClient.linkSocial({
      provider: 'discord',
      scopes: ['identify', 'guilds', 'guilds.join'],
      callbackURL: getNativeAuthCallbackPath(
        `/groups/${encodeURIComponent(groupId)}`
      ),
    });
    if (result.error)
      throw new Error(
        result.error.message || 'Discord authorization was not completed.'
      );
  });
  const status = form.enrollment;
  if (status === undefined)
    return (
      <Text accessibilityLiveRegion='polite'>Loading your Discord access…</Text>
    );
  if (!status) return null;
  return (
    <View className='gap-3 rounded-card border border-border p-3'>
      <Text accessibilityRole='header'>Your Discord access</Text>
      <Text>{status.guildName}</Text>
      {status.linkedDiscordUserId && (
        <Text>Linked Discord account ID: {status.linkedDiscordUserId}</Text>
      )}
      <Text>
        {status.linked
          ? 'Your Discord account is linked. Linking an account does not enroll you in this Group’s Discord access.'
          : 'Connect your Discord account to request access to this Group’s server.'}
      </Text>
      <Text>
        {status.mode === 'membership'
          ? 'By selecting Connect Discord, you allow Groupi to join you to this server and manage your server membership. When Group access ends, Groupi can remove you from the server. A Group ban or coordinated exclusion can ban your Discord account from this server. Discord staff must review and remove Discord bans before you can connect again.'
          : 'Connecting lets Groupi join you to this server and manage its dedicated Group role. When Group access ends, Groupi removes that role; your server membership remains. Discord staff control bans and server rules. Other roles and channel permissions can preserve independent Discord access.'}{' '}
        Complete required Group onboarding before connecting.
      </Text>
      <Text accessibilityLiveRegion='polite'>
        {status.status === 'not_connected'
          ? 'Not connected to this Group’s Discord.'
          : status.status === 'connected'
            ? 'Connected to this Group’s Discord.'
            : status.status === 'pending'
              ? 'Discord connection is pending.'
              : status.status === 'screening'
                ? 'Complete the server’s membership screening in Discord to finish connecting.'
                : 'Discord access needs attention. Contact a Group manager or Discord staff before trying again.'}
      </Text>
      {status.error && <Text accessibilityRole='alert'>{status.error}</Text>}
      {status.externalException && (
        <Text>
          Externally managed access: {status.externalException}. Discord staff
          manage this account’s access.
          {status.mode === 'membership' &&
            ' Groupi cannot remove server owners or accounts at or above the bot’s role. This exception does not grant Group membership or management permissions.'}
        </Text>
      )}
      {(status.status === 'not_connected' || status.status === 'blocked') && (
        <Button
          accessibilityLabel='Connect Discord'
          disabled={form.busy || status.eligible === false}
          onPress={() => void form.connect()}
        >
          {form.busy ? 'Connecting…' : 'Connect Discord'}
        </Button>
      )}
      {status.status === 'screening' && (
        <Button
          accessibilityLabel='Check Discord access'
          disabled={form.busy || status.eligible === false}
          onPress={() => void form.connect()}
        >
          {form.busy ? 'Checking…' : 'Check Discord access'}
        </Button>
      )}
      {(status.status === 'connected' || status.status === 'screening') && (
        <Button
          accessibilityLabel='Open Discord'
          variant='outline'
          onPress={() => void Linking.openURL(status.openUrl)}
        >
          Open Discord
        </Button>
      )}
      {form.message && (
        <Text accessibilityLiveRegion='polite'>{form.message}</Text>
      )}
      {form.error && <Text accessibilityRole='alert'>{form.error}</Text>}
    </View>
  );
}
