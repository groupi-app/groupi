import { useState, useCallback } from 'react';
import { View, FlatList, Pressable, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ListScreenTemplate } from '@/components/templates';
import { TabBarFilter } from '@/components/molecules';
import { Timestamp } from '@/components/molecules';
import { useNotificationStore } from '@/stores';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteAllNotifications,
} from '@/hooks/use-notifications';
import { showActionSheet } from '@/components/ui/action-sheet';

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

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
];

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { filter, setFilter } = useNotificationStore();

  const { notifications, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteAll = useDeleteAllNotifications();

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n: Notification) => !n.readAt)
      : notifications;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  function handleNotificationPress(notification: Notification) {
    if (!notification.readAt) {
      markAsRead(notification._id);
    }

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

  function handleHeaderActions() {
    showActionSheet({
      title: 'Notification Actions',
      options: [
        { label: 'Mark all as read', onPress: () => markAllAsRead() },
        { label: 'Delete all', onPress: () => deleteAll(), destructive: true },
      ],
    });
  }

  if (isLoading) {
    return (
      <ListScreenTemplate title='Notifications'>
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
      </ListScreenTemplate>
    );
  }

  return (
    <ListScreenTemplate
      title='Notifications'
      headerRight={
        notifications.length > 0 ? (
          <Pressable onPress={handleHeaderActions} className='p-2'>
            <Ionicons name='ellipsis-horizontal' size={20} color='#6b7280' />
          </Pressable>
        ) : undefined
      }
      controls={
        <TabBarFilter
          tabs={FILTER_TABS}
          activeTab={filter}
          onTabChange={key => setFilter(key as 'all' | 'unread')}
          className='px-0'
        />
      }
    >
      <FlatList
        data={filteredNotifications}
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
              <Timestamp time={item._creationTime} className='mt-0.5' />
            </View>
            {!item.readAt ? (
              <View className='mt-2 h-2 w-2 rounded-full bg-primary' />
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon='notifications-outline'
            title={
              filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications'
            }
            description="You're all caught up!"
          />
        }
        contentContainerStyle={
          filteredNotifications.length === 0 ? { flex: 1 } : undefined
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </ListScreenTemplate>
  );
}
