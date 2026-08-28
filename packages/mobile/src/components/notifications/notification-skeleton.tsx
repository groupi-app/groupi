import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationSkeletonProps {
  count?: number;
}

export function NotificationSkeleton({ count = 5 }: NotificationSkeletonProps) {
  return (
    <View className='gap-4 px-4 pt-4'>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className='flex-row items-center gap-3'>
          <Skeleton className='h-10 w-10 rounded-full' />
          <View className='flex-1 gap-1'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-3 w-1/3' />
          </View>
        </View>
      ))}
    </View>
  );
}
