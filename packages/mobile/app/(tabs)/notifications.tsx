import { useState, useCallback } from 'react';
import { View, FlatList, Pressable, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useQuery, useMutation } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useGlobalUser } from '@/context/global-user-context';
import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Notification = any;

const NOTIFICATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  NEW_POST: 'chatbubble',
  NEW_REPLY: 'arrow-undo',
  EVENT_EDITED: 'create',
  DATE_CHOSEN: 'calendar',
  DATE_CHANGED: 'calendar',
  DATE_RESET: 'calendar-outline',
  USER_JOINED: 'person-add',
  USER_LEFT: 'person-remove',
  USER_PROMOTED: 'arrow-up-circle',
  USER_DEMOTED: 'arrow-down-circle',
  USER_RSVP: 'checkmark-circle',
  USER_MENTIONED: 'at',
  EVENT_REMINDER: 'alarm',
  FRIEND_REQUEST_RECEIVED: 'people',
  FRIEND_REQUEST_ACCEPTED: 'people',
  EVENT_INVITE_RECEIVED: 'mail',
  EVENT_INVITE_ACCEPTED: 'mail-open',
};

function getNotificationIcon(type: string): keyof typeof Ionicons.glyphMap {
  return NOTIFICATION_ICONS[type] ?? 'notifications';
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export default function NotificationsScreen() {
  const { isAuthenticated } = useGlobalUser();
  const [refreshing, setRefreshing] = useState(false);

  const notificationsData = useQuery(
    api.notifications.queries.fetchNotificationsForPerson,
    isAuthenticated ? { limit: 50 } : 'skip'
  );
  const markAsRead = useMutation(
    api.notifications.mutations.markNotificationAsRead
  );
  const markAllAsRead = useMutation(
    api.notifications.mutations.markAllNotificationsAsRead
  );

  const notifications = notificationsData?.notifications ?? [];
  const isLoading = notificationsData === undefined;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  function handleNotificationPress(notification: Notification) {
    // Mark as read
    if (!notification.readAt) {
      markAsRead({ notificationId: notification._id }).catch(() => {});
    }

    // Navigate based on type
    if (notification.eventId) {
      if (notification.postId) {
        router.push(
          `/event/${notification.eventId}/post/${notification.postId}`
        );
      } else {
        router.push(`/event/${notification.eventId}`);
      }
    } else if (
      notification.type === 'FRIEND_REQUEST_RECEIVED' ||
      notification.type === 'FRIEND_REQUEST_ACCEPTED'
    ) {
      router.push('/friends');
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead({});
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center justify-between px-4 py-4'>
          <Text className='text-2xl font-bold text-foreground'>
            Notifications
          </Text>
        </View>
        <View className='gap-4 px-4'>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} className='flex-row items-center gap-3'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <View className='flex-1 gap-1'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/3' />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-row items-center justify-between px-4 py-4'>
        <Text className='text-2xl font-bold text-foreground'>
          Notifications
        </Text>
        {notifications.length > 0 ? (
          <Pressable onPress={handleMarkAllRead}>
            <Text className='text-sm font-medium text-primary'>
              Mark all read
            </Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item: Notification) => item._id}
        renderItem={({ item }: { item: Notification }) => (
          <Pressable
            onPress={() => handleNotificationPress(item)}
            className={`flex-row items-start gap-3 border-b border-border px-4 py-3 ${
              !item.readAt ? 'bg-primary/5' : ''
            }`}
          >
            {item.author?.image ? (
              <Avatar
                src={item.author.image}
                name={item.author.name}
                size='md'
              />
            ) : (
              <View className='h-10 w-10 items-center justify-center rounded-full bg-muted'>
                <Ionicons
                  name={getNotificationIcon(item.type)}
                  size={18}
                  color='#9ca3af'
                />
              </View>
            )}
            <View className='flex-1'>
              <Text
                className={`text-base ${!item.readAt ? 'font-semibold text-foreground' : 'text-foreground'}`}
              >
                {item.message ?? item.title ?? 'Notification'}
              </Text>
              <Text className='mt-0.5 text-sm text-muted-foreground'>
                {formatTimeAgo(item._creationTime)}
              </Text>
            </View>
            {!item.readAt ? (
              <View className='mt-2 h-2 w-2 rounded-full bg-primary' />
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon='notifications-outline'
            title='No notifications'
            description="You're all caught up!"
          />
        }
        contentContainerStyle={
          notifications.length === 0 ? { flex: 1 } : undefined
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}
