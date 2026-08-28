import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCSSVariable } from 'uniwind';

import { Text } from '@/components/ui/text';

interface NotificationButtonProps {
  unreadCount: number;
}

export function NotificationButton({ unreadCount }: NotificationButtonProps) {
  const hasUnread = unreadCount > 0;
  const iconColor = String(
    useCSSVariable(
      hasUnread ? '--color-primary' : '--color-muted-foreground'
    ) ?? 'transparent'
  );
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Pressable
      testID='home-notifications-button'
      onPress={() => router.push('/notifications')}
      accessibilityRole='button'
      accessibilityLabel={
        hasUnread ? `Notifications, ${unreadCount} unread` : 'Notifications'
      }
      accessibilityHint='Opens notifications'
      className='relative h-11 w-11 items-center justify-center rounded-badge bg-muted active:scale-95 active:bg-accent'
    >
      <Ionicons
        name={hasUnread ? 'notifications' : 'notifications-outline'}
        size={21}
        color={iconColor}
      />
      {hasUnread ? (
        <View className='absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-badge border-2 border-background bg-primary px-1'>
          <Text className='text-[10px] font-bold leading-3 text-primary-foreground'>
            {badgeLabel}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
