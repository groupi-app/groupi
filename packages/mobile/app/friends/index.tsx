import { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';

import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { BackButton } from '@/components/ui/back-button';
import { EmptyState } from '@/components/ui/empty-state';
import { TabBarFilter } from '@/components/molecules';
import { LoadingState } from '@/components/molecules';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  useFriendsList,
  usePendingRequests,
  useSentRequests,
  useFriendSearch,
  useFriendSuggestions,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useCancelFriendRequest,
  useRemoveFriend,
} from '@/hooks/use-friends';

type Tab = 'friends' | 'requests' | 'sent' | 'search';

const TABS = [
  { key: 'friends', label: 'Friends' },
  { key: 'requests', label: 'Requests' },
  { key: 'sent', label: 'Sent' },
  { key: 'search', label: 'Search' },
];

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const friends = useFriendsList();
  const pendingRequests = usePendingRequests();
  const sentRequests = useSentRequests();
  const { results: searchResults, debouncedTerm } = useFriendSearch(
    searchTerm,
    activeTab === 'search'
  );
  const suggestions = useFriendSuggestions();

  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const declineRequest = useDeclineFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const removeFriend = useRemoveFriend();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const requestCount = pendingRequests?.length ?? 0;
  const sentCount = sentRequests?.length ?? 0;

  const tabsWithBadges = TABS.map(tab => ({
    ...tab,
    badge:
      tab.key === 'requests'
        ? requestCount
        : tab.key === 'sent'
          ? sentCount
          : undefined,
  }));

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-row items-center justify-between border-b border-border px-4 py-3'>
        <BackButton />
        <Text className='text-lg font-semibold text-foreground'>Friends</Text>
        <View className='w-10' />
      </View>

      <TabBarFilter
        tabs={tabsWithBadges}
        activeTab={activeTab}
        onTabChange={key => setActiveTab(key as Tab)}
      />

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

      {activeTab === 'friends' ? (
        <FriendsList
          friends={friends}
          onRemove={(friendshipId: Id<'friendships'>) => {
            showConfirmDialog({
              title: 'Remove Friend',
              message: 'Are you sure you want to remove this friend?',
              confirmLabel: 'Remove',
              destructive: true,
              onConfirm: () => removeFriend(friendshipId),
            });
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : activeTab === 'requests' ? (
        <RequestsList
          requests={pendingRequests}
          onAccept={acceptRequest}
          onDecline={declineRequest}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : activeTab === 'sent' ? (
        <SentRequestsList
          requests={sentRequests}
          onCancel={(friendshipId: Id<'friendships'>) => {
            showConfirmDialog({
              title: 'Cancel Request',
              message: 'Are you sure you want to cancel this friend request?',
              confirmLabel: 'Cancel Request',
              destructive: true,
              onConfirm: () => cancelRequest(friendshipId),
            });
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <SearchResults
          results={searchResults}
          searchTerm={debouncedTerm}
          suggestions={suggestions}
          onSendRequest={sendRequest}
        />
      )}
    </SafeAreaView>
  );
}

function FriendsList({
  friends,
  onRemove,
  refreshing,
  onRefresh,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  friends: any;
  onRemove: (id: Id<'friendships'>) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (friends === undefined) {
    return <LoadingState />;
  }

  return (
    <FlatList
      data={friends}
      keyExtractor={(item: { friendshipId: Id<'friendships'> }) =>
        item.friendshipId
      }
      renderItem={({
        item,
      }: {
        item: {
          friendshipId: Id<'friendships'>;
          personId: Id<'persons'>;
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

function RequestsList({
  requests,
  onAccept,
  onDecline,
  refreshing,
  onRefresh,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requests: any;
  onAccept: (id: Id<'friendships'>) => void;
  onDecline: (id: Id<'friendships'>) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (requests === undefined) {
    return <LoadingState />;
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item: { friendshipId: Id<'friendships'> }) =>
        item.friendshipId
      }
      renderItem={({
        item,
      }: {
        item: {
          friendshipId: Id<'friendships'>;
          personId: Id<'persons'>;
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

function SentRequestsList({
  requests,
  onCancel,
  refreshing,
  onRefresh,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requests: any;
  onCancel: (id: Id<'friendships'>) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (requests === undefined) {
    return <LoadingState />;
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item: { friendshipId: Id<'friendships'> }) =>
        item.friendshipId
      }
      renderItem={({
        item,
      }: {
        item: {
          friendshipId: Id<'friendships'>;
          personId: Id<'persons'>;
          name: string | null;
          username: string | null;
          image: string | null;
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
            </View>
          </Pressable>
          <Pressable
            onPress={() => onCancel(item.friendshipId)}
            className='rounded-button border border-border px-3 py-1.5'
          >
            <Text className='text-sm font-medium text-muted-foreground'>
              Cancel
            </Text>
          </Pressable>
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon='paper-plane-outline'
          title='No sent requests'
          description='Sent friend requests will appear here'
        />
      }
      contentContainerStyle={
        (requests?.length ?? 0) === 0 ? { flex: 1 } : undefined
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}

function SearchResults({
  results,
  searchTerm,
  suggestions,
  onSendRequest,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results: any;
  searchTerm: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suggestions: any;
  onSendRequest: (id: Id<'persons'>) => void;
}) {
  // Show suggestions when no search term
  if (!searchTerm || searchTerm.length < 3) {
    if (suggestions && suggestions.length > 0) {
      return (
        <FlatList
          data={suggestions}
          keyExtractor={(item: { personId: Id<'persons'> }) => item.personId}
          ListHeaderComponent={
            <View className='px-4 py-3'>
              <Text className='text-base font-semibold text-foreground'>
                People from your events
              </Text>
              <Text className='mt-0.5 text-sm text-muted-foreground'>
                Type at least 3 characters to search by username
              </Text>
            </View>
          }
          renderItem={({
            item,
          }: {
            item: {
              personId: Id<'persons'>;
              name: string | null;
              username: string | null;
              image: string | null;
              mutualEventCount: number;
              friendshipStatus: string;
            };
          }) => {
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
                    <Text className='text-sm text-muted-foreground'>
                      {item.mutualEventCount} mutual{' '}
                      {item.mutualEventCount === 1 ? 'event' : 'events'}
                    </Text>
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
                ) : null}
              </View>
            );
          }}
        />
      );
    }

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
    return <LoadingState />;
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item: { personId: Id<'persons'> }) => item.personId}
      renderItem={({
        item,
      }: {
        item: {
          personId: Id<'persons'>;
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
