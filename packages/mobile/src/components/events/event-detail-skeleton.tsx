import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

export function EventDetailSkeleton() {
  return (
    <View className='px-4 pt-4'>
      {/* Title */}
      <Skeleton className='h-8 w-3/4' />
      {/* Badge */}
      <Skeleton className='mt-3 h-5 w-16' />
      {/* Date */}
      <Skeleton className='mt-4 h-5 w-1/2' />
      {/* Location */}
      <Skeleton className='mt-2 h-5 w-2/5' />
      {/* Description */}
      <Skeleton className='mt-4 h-4 w-full' />
      <Skeleton className='mt-2 h-4 w-5/6' />
      <Skeleton className='mt-2 h-4 w-3/4' />

      {/* RSVP button */}
      <Skeleton className='mt-6 h-12 w-full rounded-button' />

      {/* Members section */}
      <Skeleton className='mt-8 h-5 w-24' />
      <View className='mt-3 flex-row gap-3'>
        <Skeleton className='h-14 w-14 rounded-full' />
        <Skeleton className='h-14 w-14 rounded-full' />
        <Skeleton className='h-14 w-14 rounded-full' />
        <Skeleton className='h-14 w-14 rounded-full' />
      </View>

      {/* Posts section */}
      <Skeleton className='mt-8 h-5 w-16' />
      <Skeleton className='mt-3 h-24 w-full rounded-card' />
      <Skeleton className='mt-3 h-24 w-full rounded-card' />
    </View>
  );
}
