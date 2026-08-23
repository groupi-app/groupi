import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCSSVariable } from 'uniwind';

import { EmptyState } from '@/components/ui/empty-state';
import { showActionSheet } from '@/components/ui/action-sheet';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { UserAvatar } from '@/components/ui/user-avatar';
import { TabBarFilter, Timestamp } from '@/components/molecules';
import { ListScreenTemplate } from '@/components/templates';
import {
  type NotificationItem,
  useDeleteAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useMarkNotificationAsUnread,
  useNotifications,
} from '@/hooks/use-notifications';
import {
  getNotificationDestination,
  getNotificationMessage,
} from '@/lib/notification-presentation';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores';

const NOTIFICATION_ICONS: Record<
  NotificationItem['type'],
  keyof typeof Ionicons.glyphMap
> = {
  NEW_POST: 'chatbubble-outline',
  NEW_REPLY: 'arrow-undo-outline',
  EVENT_EDITED: 'create-outline',
  DATE_CHOSEN: 'calendar',
  DATE_CHANGED: 'calendar-outline',
  DATE_RESET: 'calendar-clear-outline',
  USER_JOINED: 'person-add-outline',
  USER_LEFT: 'person-remove-outline',
  USER_PROMOTED: 'arrow-up-circle-outline',
  USER_DEMOTED: 'arrow-down-circle-outline',
  USER_RSVP: 'checkmark-circle-outline',
  USER_MENTIONED: 'at',
  EVENT_REMINDER: 'alarm-outline',
  FRIEND_REQUEST_RECEIVED: 'people-outline',
  FRIEND_REQUEST_ACCEPTED: 'people',
  EVENT_INVITE_RECEIVED: 'mail-outline',
  EVENT_INVITE_ACCEPTED: 'mail-open-outline',
  ADDON_CONFIG_RESET: 'extension-puzzle-outline',
  ADDON_AUTOMATION: 'sparkles-outline',
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
];

export default function NotificationsScreen() {
  const { filter, setFilter } = useNotificationStore();
  const { notifications, isLoading, isLoadingMore, hasMore, loadMore, error } =
    useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAsUnread = useMarkNotificationAsUnread();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();
  const deleteAll = useDeleteAllNotifications();
  const mutedColor = String(useCSSVariable('--color-muted-foreground'));
  const primaryColor = String(useCSSVariable('--color-primary'));

  const filteredNotifications = useMemo(
    () =>
      filter === 'unread'
        ? notifications.filter(notification => !notification.read)
        : notifications,
    [filter, notifications]
  );
  const hasUnread = notifications.some(notification => !notification.read);

  function handleNotificationPress(notification: NotificationItem) {
    if (!notification.read) void markAsRead(notification._id);
    const destination = getNotificationDestination(notification);
    if (destination) router.push(destination);
  }

  function handleNotificationActions(notification: NotificationItem) {
    showActionSheet({
      title: 'Notification options',
      message: getNotificationMessage(notification),
      options: [
        notification.read
          ? {
              label: 'Mark as unread',
              onPress: () => void markAsUnread(notification._id),
            }
          : {
              label: 'Mark as read',
              onPress: () => void markAsRead(notification._id),
            },
        {
          label: 'Delete notification',
          onPress: () => void deleteNotification(notification._id),
          destructive: true,
        },
      ],
    });
  }

  function handleHeaderActions() {
    showActionSheet({
      title: 'Notification options',
      options: [
        ...(hasUnread
          ? [
              {
                label: 'Mark all as read',
                onPress: () => void markAllAsRead(),
              },
            ]
          : []),
        {
          label: 'Delete all notifications',
          onPress: () =>
            showConfirmDialog({
              title: 'Delete all notifications?',
              message:
                'This permanently removes every notification from your activity feed.',
              confirmLabel: 'Delete all',
              destructive: true,
              onConfirm: () => void deleteAll(),
            }),
          destructive: true,
        },
      ],
    });
  }

  if (isLoading) {
    return (
      <ListScreenTemplate title='Notifications'>
        <View className='gap-4 px-4 pt-3'>
          {Array.from({ length: 5 }).map((_, index) => (
            <View key={index} className='flex-row items-center gap-3'>
              <Skeleton className='h-10 w-10 rounded-badge' />
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
      subtitle={
        hasUnread ? 'New activity is waiting for you' : 'You’re all caught up'
      }
      headerRight={
        notifications.length > 0 ? (
          <Pressable
            onPress={handleHeaderActions}
            className='h-10 w-10 items-center justify-center rounded-button active:bg-accent'
            accessibilityRole='button'
            accessibilityLabel='Notification options'
          >
            <Ionicons name='ellipsis-horizontal' size={22} color={mutedColor} />
          </Pressable>
        ) : undefined
      }
      controls={
        <TabBarFilter
          tabs={FILTER_TABS}
          activeTab={filter}
          onTabChange={key => setFilter(key === 'unread' ? 'unread' : 'all')}
          className='px-0'
        />
      }
    >
      {error ? (
        <View className='mx-4 mb-2 rounded-card bg-bg-error-subtle px-4 py-3'>
          <Text className='text-sm text-error'>
            Notifications couldn’t be loaded. Try again in a moment.
          </Text>
        </View>
      ) : null}
      <FlatList
        data={filteredNotifications}
        keyExtractor={item => item._id}
        renderItem={({ item }) => {
          const message = getNotificationMessage(item);
          const authorName =
            item.author?.user.name ||
            item.author?.user.username ||
            item.author?.user.email ||
            null;

          return (
            <Pressable
              onPress={() => handleNotificationPress(item)}
              onLongPress={() => handleNotificationActions(item)}
              accessibilityRole='button'
              accessibilityLabel={`${item.read ? '' : 'Unread notification. '}${message}`}
              accessibilityHint='Opens the related activity. Long press for more options.'
              className={cn(
                'mx-3 mb-2 flex-row items-start gap-3 rounded-card px-3 py-3 active:bg-accent/70',
                item.read ? 'bg-card' : 'bg-primary/5'
              )}
            >
              {item.author ? (
                <UserAvatar
                  src={item.author.user.image}
                  name={authorName}
                  size='md'
                />
              ) : (
                <View className='h-10 w-10 items-center justify-center rounded-badge bg-muted'>
                  <Ionicons
                    name={NOTIFICATION_ICONS[item.type]}
                    size={19}
                    color={item.read ? mutedColor : primaryColor}
                  />
                </View>
              )}
              <View className='flex-1 pt-0.5'>
                <Text
                  className={cn(
                    'text-[15px] leading-5 text-foreground',
                    !item.read && 'font-semibold'
                  )}
                >
                  {message}
                </Text>
                <Timestamp time={item.createdAt} className='mt-1 text-xs' />
              </View>
              <Pressable
                onPress={event => {
                  event.stopPropagation();
                  handleNotificationActions(item);
                }}
                hitSlop={8}
                className='h-9 w-9 items-center justify-center rounded-button active:bg-accent'
                accessibilityRole='button'
                accessibilityLabel={`More options for ${message}`}
              >
                <Ionicons
                  name='ellipsis-horizontal'
                  size={18}
                  color={mutedColor}
                />
              </Pressable>
              {!item.read ? (
                <View
                  className='absolute left-1 top-1/2 h-2 w-2 rounded-badge bg-primary'
                  accessibilityElementsHidden
                />
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon='notifications-outline'
            title={
              filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'
            }
            description={
              filter === 'unread'
                ? 'You’re all caught up.'
                : 'Event and social updates will appear here.'
            }
          />
        }
        ListFooterComponent={
          hasMore ? (
            <Pressable
              onPress={loadMore}
              disabled={isLoadingMore}
              className='mx-4 my-3 h-11 items-center justify-center rounded-button border border-border bg-card active:bg-accent'
              accessibilityRole='button'
              accessibilityLabel='Load older notifications'
              accessibilityState={{ disabled: isLoadingMore }}
            >
              {isLoadingMore ? (
                <ActivityIndicator colorClassName='accent-primary' />
              ) : (
                <Text className='font-semibold text-foreground'>
                  Load older notifications
                </Text>
              )}
            </Pressable>
          ) : null
        }
        contentContainerClassName={
          filteredNotifications.length === 0 ? 'flex-1' : 'pb-6'
        }
      />
    </ListScreenTemplate>
  );
}
