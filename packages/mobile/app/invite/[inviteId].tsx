import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import { api } from 'convex/_generated/api';

import { Button } from '@/components/ui/button';
import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { useGlobalUser } from '@/context/global-user-context';
import { toast } from '@groupi/shared/platform';

function formatEventDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AcceptInviteScreen() {
  const { inviteId: token } = useLocalSearchParams<{ inviteId: string }>();
  const { isAuthenticated } = useGlobalUser();
  const [isAccepting, setIsAccepting] = useState(false);
  const primaryColor = String(
    useCSSVariable('--color-primary') ?? 'transparent'
  );
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );

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
          onPress={() =>
            router.replace({
              pathname: '/(auth)/sign-in',
              params: { returnTo: `/invite/${token}` },
            })
          }
          className='mt-6'
          accessibilityLabel='Sign in to accept this invite'
        >
          Sign In
        </Button>
      </SafeAreaView>
    );
  }

  if (inviteData === undefined) {
    return (
      <SafeAreaView className='flex-1 items-center justify-center bg-background'>
        <ActivityIndicator size='large' color={primaryColor} />
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
    if (!inviteData) return;

    if (inviteData.isAlreadyMember) {
      router.replace(`/event/${inviteData.event.id}`);
      return;
    }

    setIsAccepting(true);
    try {
      const result = await acceptInvite({ token });
      toast.success('Joined event!');
      router.replace(`/event/${result.event.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to join event'
      );
    } finally {
      setIsAccepting(false);
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
      {inviteData.event.organizer ? (
        <View className='mt-4 flex-row items-center gap-2'>
          <Avatar
            src={inviteData.event.organizer.image}
            name={inviteData.event.organizer.name}
            size='sm'
          />
          <Text className='text-sm text-muted-foreground'>
            Hosted by {inviteData.event.organizer.name ?? 'an organizer'}
          </Text>
        </View>
      ) : null}
      <View className='mt-5 w-full gap-2 rounded-card border border-border bg-card p-4'>
        {inviteData.event.location ? (
          <View className='flex-row items-center gap-2'>
            <Ionicons name='location-outline' size={18} color={mutedColor} />
            <Text className='flex-1 text-sm text-foreground'>
              {inviteData.event.location}
            </Text>
          </View>
        ) : null}
        {inviteData.event.chosenDateTime ? (
          <View className='flex-row items-center gap-2'>
            <Ionicons name='calendar-outline' size={18} color={mutedColor} />
            <Text className='flex-1 text-sm text-foreground'>
              {formatEventDate(inviteData.event.chosenDateTime)}
            </Text>
          </View>
        ) : (
          <Text className='text-sm text-muted-foreground'>
            Date is still being decided.
          </Text>
        )}
        <View className='flex-row items-center gap-2'>
          <Ionicons name='people-outline' size={18} color={mutedColor} />
          <Text className='text-sm text-foreground'>
            {inviteData.event.memberCount}{' '}
            {inviteData.event.memberCount === 1 ? 'member' : 'members'}
          </Text>
        </View>
      </View>
      <Text className='mt-4 text-base text-muted-foreground'>
        {inviteData.isAlreadyMember
          ? "You're already a member of this event."
          : "You've been invited to join this event."}
      </Text>
      <Button
        onPress={handleAccept}
        className='mt-8 w-full'
        isLoading={isAccepting}
        loadingText='Joining…'
        accessibilityLabel={
          inviteData.isAlreadyMember ? 'View event' : 'Join event'
        }
      >
        {inviteData.isAlreadyMember ? 'View Event' : 'Join Event'}
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
