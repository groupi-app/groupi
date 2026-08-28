import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

interface InviteSkeletonProps {
  count?: number;
}

export function InviteSkeleton({ count = 3 }: InviteSkeletonProps) {
  return (
    <View className='gap-3 px-4 pt-4'>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className='rounded-card border border-border p-4'>
          <View className='flex-row items-start gap-3'>
            <Skeleton className='h-10 w-10 rounded-full' />
            <View className='flex-1 gap-1'>
              <Skeleton className='h-5 w-2/3' />
              <Skeleton className='h-3 w-1/2' />
              <Skeleton className='mt-1 h-3 w-1/3' />
            </View>
          </View>
          <View className='mt-3 flex-row gap-2'>
            <Skeleton className='h-9 flex-1 rounded-button' />
            <Skeleton className='h-9 flex-1 rounded-button' />
          </View>
        </View>
      ))}
    </View>
  );
}
