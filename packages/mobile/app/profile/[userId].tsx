import { View, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';

import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { useGlobalUser } from '@/context/global-user-context';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

export default function ProfileScreen() {
  const { userId: personId } = useLocalSearchParams<{ userId: string }>();
  const { person: currentPerson } = useGlobalUser();

  const profile = useQuery(api.users.queries.getUserProfile, { personId });
  const friendshipStatus = useQuery(
    api.friends.queries.getFriendshipStatus,
    personId ? { targetPersonId: personId } : 'skip'
  );

  const sendRequest = useMutation(api.friends.mutations.sendFriendRequest);

  const isOwnProfile = currentPerson?._id === personId;
  const isLoading = profile === undefined;

  async function handleSendFriendRequest() {
    try {
      const result = await sendRequest({ addresseePersonId: personId });
      toast.success(result?.message ?? 'Friend request sent!');
    } catch {
      toast.error('Failed to send friend request');
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
        </View>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
        </View>
        <View className='flex-1 items-center justify-center'>
          <Text className='text-base text-muted-foreground'>
            User not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const name = profile.user?.name ?? 'Unknown';
  const username = profile.user?.username;
  const image = profile.user?.image;
  const pronouns = profile.person?.pronouns;
  const bio = profile.person?.bio;

  const status = friendshipStatus?.status ?? 'none';

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-row items-center px-4 py-3'>
        <BackButton />
      </View>

      <ScrollView contentContainerClassName='items-center px-6 pb-8'>
        <Avatar src={image} name={name} size='xl' />

        <Text className='mt-4 text-xl font-bold text-foreground'>{name}</Text>
        {username ? (
          <Text className='mt-1 text-base text-muted-foreground'>
            @{username}
          </Text>
        ) : null}
        {pronouns ? (
          <Text className='mt-1 text-sm text-muted-foreground'>{pronouns}</Text>
        ) : null}
        {bio ? (
          <Text className='mt-3 text-center text-base text-muted-foreground'>
            {bio}
          </Text>
        ) : null}

        {!isOwnProfile ? (
          <View className='mt-6 w-full'>
            {status === 'none' ? (
              <Button onPress={handleSendFriendRequest}>Add Friend</Button>
            ) : status === 'pending_sent' ? (
              <Button variant='outline' disabled>
                Request Sent
              </Button>
            ) : status === 'friends' ? (
              <Button variant='secondary' disabled>
                Friends
              </Button>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
