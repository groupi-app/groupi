import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton() {
  return (
    <View className='items-center px-6 pt-8'>
      <Skeleton className='h-20 w-20 rounded-full' />
      <Skeleton className='mt-4 h-6 w-40' />
      <Skeleton className='mt-2 h-4 w-24' />
      <Skeleton className='mt-4 h-16 w-full' />
      <Skeleton className='mt-6 h-10 w-full rounded-button' />
    </View>
  );
}
