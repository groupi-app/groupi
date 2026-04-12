import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './text';
import { Button } from './button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'folder-open-outline',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className='flex-1 items-center justify-center px-6'>
      <View className='mb-4 h-20 w-20 items-center justify-center rounded-full bg-muted'>
        <Ionicons name={icon} size={36} color='#9ca3af' />
      </View>
      <Text variant='h4'>{title}</Text>
      {description ? (
        <Text variant='muted' className='mt-2 text-center'>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className='mt-6'>
          <Button onPress={onAction}>{actionLabel}</Button>
        </View>
      ) : null}
    </View>
  );
}
