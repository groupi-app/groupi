import { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useQuery, useMutation } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { BackButton } from '@/components/ui/back-button';
import { EmptyState } from '@/components/ui/empty-state';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

type Tab = 'friends' | 'requests' | 'search';

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const friends = useQuery(api.friends.queries.getFriends, {});
  const pendingRequests = useQuery(api.friends.queries.getPendingRequests, {});
  const searchResults = useQuery(
    api.friends.queries.searchUsersByUsername,
    activeTab === 'search' && debouncedSearch.length >= 3
      ? { searchTerm: debouncedSearch }
      : 'skip'
  );

  const sendRequest = useMutation(api.friends.mutations.sendFriendRequest);
  const acceptRequest = useMutation(api.friends.mutations.acceptFriendRequest);
  const declineRequest = useMutation(
    api.friends.mutations.declineFriendRequest
  );
  const removeFriend = useMutation(api.friends.mutations.removeFriend);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const requestCount = pendingRequests?.length ?? 0;

  return (
    <SafeAreaView className='flex-1 bg-background'>
      {/* Header */}
      <View className='flex-row items-center justify-between border-b border-border px-4 py-3'>
        <BackButton />
        <Text className='text-lg font-semibold text-foreground'>Friends</Text>
        <View className='w-10' />
      </View>

      {/* Tabs */}
      <View className='flex-row border-b border-border'>
        {[
          { key: 'friends' as const, label: 'Friends' },
          {
            key: 'requests' as const,
            label: `Requests${requestCount > 0 ? ` (${requestCount})` : ''}`,
          },
          { key: 'search' as const, label: 'Search' },
        ].map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`flex-1 items-center py-3 ${
              activeTab === tab.key ? 'border-b-2 border-primary' : ''
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === tab.key ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search bar */}
      {activeTab === 'search' ? (
        <View className='px-4 py-3'>
          <View className='flex-row items-center gap-2 rounded-input border border-border bg-background px-3'>
            <Ionicons name='search' size={18} color='#9ca3af' />
            <TextInput
              className='flex-1 py-2.5 text-base text-foreground'
              placeholder='Search by username...'
              placeholderTextColor='#9ca3af'
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCapitalize='none'
              autoCorrect={false}
            />
            {searchTerm ? (
              <Pressable onPress={() => setSearchTerm('')}>
                <Ionicons name='close-circle' size={18} color='#9ca3af' />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Content */}
      {activeTab === 'friends' ? (
        <FriendsList
          friends={friends}
          onRemove={async (friendshipId: string) => {
            showConfirmDialog({
              title: 'Remove Friend',
              message: 'Are you sure you want to remove this friend?',
              confirmLabel: 'Remove',
              destructive: true,
              onConfirm: async () => {
                try {
                  await removeFriend({ friendshipId });
                  toast.success('Friend removed');
                } catch {
                  toast.error('Failed to remove friend');
                }
              },
            });
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : activeTab === 'requests' ? (
        <RequestsList
          requests={pendingRequests}
          onAccept={async (friendshipId: string) => {
            try {
              await acceptRequest({ friendshipId });
              toast.success('Friend request accepted!');
            } catch {
              toast.error('Failed to accept request');
            }
          }}
          onDecline={async (friendshipId: string) => {
            try {
              await declineRequest({ friendshipId });
              toast.info('Request declined');
            } catch {
              toast.error('Failed to decline request');
            }
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <SearchResults
          results={searchResults}
          searchTerm={debouncedSearch}
          onSendRequest={async (addresseePersonId: string) => {
            try {
              const result = await sendRequest({ addresseePersonId });
              toast.success(result.message ?? 'Friend request sent!');
            } catch {
              toast.error('Failed to send request');
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FriendsList({
  friends,
  onRemove,
  refreshing,
  onRefresh,
}: {
  friends: any;
  onRemove: (id: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (friends === undefined) {
    return (
      <View className='flex-1 items-center justify-center'>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  return (
    <FlatList
      data={friends}
      keyExtractor={(item: { friendshipId: string }) => item.friendshipId}
      renderItem={({
        item,
      }: {
        item: {
          friendshipId: string;
          personId: string;
          name: string | null;
          username: string | null;
          image: string | null;
        };
      }) => (
        <Pressable
          onPress={() => router.push(`/profile/${item.personId}`)}
          className='flex-row items-center gap-3 border-b border-border px-4 py-3'
        >
          <Avatar src={item.image} name={item.name} size='md' />
          <View className='flex-1'>
            <Text className='text-base font-medium text-foreground'>
              {item.name ?? 'Unknown'}
            </Text>
            {item.username ? (
              <Text className='text-sm text-muted-foreground'>
                @{item.username}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => onRemove(item.friendshipId)}
            className='p-2'
          >
            <Ionicons name='person-remove-outline' size={18} color='#9ca3af' />
          </Pressable>
        </Pressable>
      )}
      ListEmptyComponent={
        <EmptyState
          icon='people-outline'
          title='No friends yet'
          description='Search for users to add friends'
        />
      }
      contentContainerStyle={friends.length === 0 ? { flex: 1 } : undefined}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RequestsList({
  requests,
  onAccept,
  onDecline,
  refreshing,
  onRefresh,
}: {
  requests: any;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (requests === undefined) {
    return (
      <View className='flex-1 items-center justify-center'>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item: { friendshipId: string }) => item.friendshipId}
      renderItem={({
        item,
      }: {
        item: {
          friendshipId: string;
          personId: string;
          name: string | null;
          username: string | null;
          image: string | null;
          mutualEventCount: number;
        };
      }) => (
        <View className='flex-row items-center gap-3 border-b border-border px-4 py-3'>
          <Pressable
            onPress={() => router.push(`/profile/${item.personId}`)}
            className='flex-row flex-1 items-center gap-3'
          >
            <Avatar src={item.image} name={item.name} size='md' />
            <View className='flex-1'>
              <Text className='text-base font-medium text-foreground'>
                {item.name ?? 'Unknown'}
              </Text>
              {item.username ? (
                <Text className='text-sm text-muted-foreground'>
                  @{item.username}
                </Text>
              ) : null}
              {item.mutualEventCount > 0 ? (
                <Text className='text-xs text-muted-foreground'>
                  {item.mutualEventCount} mutual{' '}
                  {item.mutualEventCount === 1 ? 'event' : 'events'}
                </Text>
              ) : null}
            </View>
          </Pressable>
          <View className='flex-row gap-2'>
            <Pressable
              onPress={() => onAccept(item.friendshipId)}
              className='rounded-button bg-primary px-3 py-1.5'
            >
              <Text className='text-sm font-medium text-primary-foreground'>
                Accept
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onDecline(item.friendshipId)}
              className='rounded-button border border-border px-3 py-1.5'
            >
              <Text className='text-sm font-medium text-foreground'>
                Decline
              </Text>
            </Pressable>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon='mail-outline'
          title='No pending requests'
          description='Friend requests will appear here'
        />
      }
      contentContainerStyle={requests.length === 0 ? { flex: 1 } : undefined}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SearchResults({
  results,
  searchTerm,
  onSendRequest,
}: {
  results: any;
  searchTerm: string;
  onSendRequest: (id: string) => void;
}) {
  if (!searchTerm || searchTerm.length < 3) {
    return (
      <View className='flex-1 items-center justify-center px-6'>
        <Ionicons name='search' size={48} color='#9ca3af' />
        <Text className='mt-4 text-center text-base text-muted-foreground'>
          Type at least 3 characters to search
        </Text>
      </View>
    );
  }

  if (results === undefined) {
    return (
      <View className='flex-1 items-center justify-center'>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item: { personId: string }) => item.personId}
      renderItem={({
        item,
      }: {
        item: {
          personId: string;
          name: string | null;
          username: string | null;
          image: string | null;
          friendshipStatus: string;
        };
      }) => {
        const statusLabels: Record<string, string> = {
          friends: 'Friends',
          pending_sent: 'Pending',
          pending_received: 'Accept',
        };
        const statusLabel = statusLabels[item.friendshipStatus];
        const canAdd = item.friendshipStatus === 'none';

        return (
          <View className='flex-row items-center gap-3 border-b border-border px-4 py-3'>
            <Pressable
              onPress={() => router.push(`/profile/${item.personId}`)}
              className='flex-row flex-1 items-center gap-3'
            >
              <Avatar src={item.image} name={item.name} size='md' />
              <View className='flex-1'>
                <Text className='text-base font-medium text-foreground'>
                  {item.name ?? 'Unknown'}
                </Text>
                {item.username ? (
                  <Text className='text-sm text-muted-foreground'>
                    @{item.username}
                  </Text>
                ) : null}
              </View>
            </Pressable>
            {canAdd ? (
              <Pressable
                onPress={() => onSendRequest(item.personId)}
                className='rounded-button bg-primary px-3 py-1.5'
              >
                <Text className='text-sm font-medium text-primary-foreground'>
                  Add
                </Text>
              </Pressable>
            ) : statusLabel ? (
              <View className='rounded-button border border-border px-3 py-1.5'>
                <Text className='text-sm text-muted-foreground'>
                  {statusLabel}
                </Text>
              </View>
            ) : null}
          </View>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          icon='search'
          title='No results'
          description={`No users found for "${searchTerm}"`}
        />
      }
      contentContainerStyle={results.length === 0 ? { flex: 1 } : undefined}
    />
  );
}
