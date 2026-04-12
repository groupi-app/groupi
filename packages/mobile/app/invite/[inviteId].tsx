import { ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';

import { Button } from '@/components/ui/button';
import { useGlobalUser } from '@/context/global-user-context';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

export default function AcceptInviteScreen() {
  const { inviteId: token } = useLocalSearchParams<{ inviteId: string }>();
  const { isAuthenticated } = useGlobalUser();

  const inviteData = useQuery(
    api.invites.queries.getInviteByToken,
    token ? { token } : 'skip'
  );
  const acceptInvite = useMutation(api.invites.mutations.acceptInvite);

  if (!isAuthenticated) {
    return (
      <SafeAreaView className='flex-1 items-center justify-center bg-background px-6'>
        <Text className='text-xl font-bold text-foreground'>
          Sign in to accept invite
        </Text>
        <Button
          onPress={() => router.replace('/(auth)/sign-in')}
          className='mt-6'
        >
          Sign In
        </Button>
      </SafeAreaView>
    );
  }

  if (inviteData === undefined) {
    return (
      <SafeAreaView className='flex-1 items-center justify-center bg-background'>
        <ActivityIndicator size='large' />
      </SafeAreaView>
    );
  }

  if (!inviteData) {
    return (
      <SafeAreaView className='flex-1 items-center justify-center bg-background px-6'>
        <Text className='text-xl font-bold text-foreground'>
          Invalid Invite
        </Text>
        <Text className='mt-2 text-center text-base text-muted-foreground'>
          This invite link is invalid or has expired.
        </Text>
        <Button onPress={() => router.replace('/(tabs)')} className='mt-6'>
          Go Home
        </Button>
      </SafeAreaView>
    );
  }

  async function handleAccept() {
    try {
      await acceptInvite({ token: token! });
      toast.success('Joined event!');
      if (inviteData?.eventId) {
        router.replace(`/event/${inviteData.eventId}`);
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      toast.error('Failed to join event');
    }
  }

  return (
    <SafeAreaView className='flex-1 items-center justify-center bg-background px-6'>
      <Text className='text-2xl font-bold text-foreground'>
        {inviteData.event?.title ?? 'Event Invitation'}
      </Text>
      {inviteData.event?.description ? (
        <Text className='mt-2 text-center text-base text-muted-foreground'>
          {inviteData.event.description}
        </Text>
      ) : null}
      <Text className='mt-4 text-base text-muted-foreground'>
        You&apos;ve been invited to join this event
      </Text>
      <Button onPress={handleAccept} className='mt-8 w-full'>
        Join Event
      </Button>
      <Button
        variant='ghost'
        onPress={() => router.replace('/(tabs)')}
        className='mt-3 w-full'
      >
        Maybe Later
      </Button>
    </SafeAreaView>
  );
}
