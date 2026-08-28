import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

interface FriendsSkeletonProps {
  count?: number;
}

export function FriendsSkeleton({ count = 6 }: FriendsSkeletonProps) {
  return (
    <View className='gap-0'>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className='flex-row items-center gap-3 border-b border-border px-4 py-3'
        >
          <Skeleton className='h-10 w-10 rounded-full' />
          <View className='flex-1 gap-1'>
            <Skeleton className='h-4 w-1/2' />
            <Skeleton className='h-3 w-1/3' />
          </View>
          <Skeleton className='h-8 w-16 rounded-button' />
        </View>
      ))}
    </View>
  );
}
