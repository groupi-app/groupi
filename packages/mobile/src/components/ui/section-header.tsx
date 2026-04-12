import { View, Pressable } from 'react-native';
import { Text } from './text';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  count?: number;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  count,
}: SectionHeaderProps) {
  return (
    <View className='flex-row items-center justify-between px-4 py-2'>
      <View className='flex-row items-center gap-2'>
        <Text variant='large'>{title}</Text>
        {count !== undefined ? (
          <View className='rounded-badge bg-muted px-1.5 py-0.5'>
            <Text variant='muted' className='text-xs'>
              {count}
            </Text>
          </View>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <Text className='text-sm font-medium text-primary'>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
