import { View, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  className?: string;
}

export function LoadingState({
  message,
  size = 'large',
  className,
}: LoadingStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center', className)}>
      {/* Sticker journal aesthetic — spinner in sticker container with white border */}
      <View className='items-center justify-center rounded-full border-[3px] border-white bg-muted p-3 shadow-raised'>
        <ActivityIndicator size={size} />
      </View>
      {message ? (
        <Text className='mt-3 text-base text-muted-foreground'>{message}</Text>
      ) : null}
    </View>
  );
}
