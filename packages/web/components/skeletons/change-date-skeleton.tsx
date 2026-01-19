import { Skeleton } from '../ui/skeleton';
import { CalendarSkeleton } from './calendar-skeleton';

/**
 * Skeleton for the change date type selection page
 * Shows options to choose between single date or poll
 */
export function ChangeDateTypeSkeleton() {
  return (
    <div className='container max-w-4xl'>
      {/* Back button */}
      <div className='w-max my-2'>
        <Skeleton className='h-10 w-40' />
      </div>

      {/* Title */}
      <Skeleton className='h-10 w-64 mt-10' />

      {/* Option buttons */}
      <div className='flex my-12 gap-4 justify-center flex-col md:flex-row items-center'>
        <Skeleton className='h-24 w-full max-w-md rounded-lg' />
        <Skeleton className='h-24 w-full max-w-md rounded-lg' />
      </div>
    </div>
  );
}

/**
 * Skeleton for single date selection page
 */
export function ChangeDateSingleSkeleton() {
  return (
    <div className='container max-w-4xl'>
      {/* Title */}
      <Skeleton className='h-10 w-48 mt-10' />

      {/* Calendar and time picker */}
      <div className='my-8 flex flex-col gap-4'>
        <CalendarSkeleton />
        <div className='text-center'>
          <Skeleton className='h-10 w-32 mx-auto' />
          <Skeleton className='h-4 w-48 mx-auto mt-2' />
        </div>
        {/* Selected date display */}
        <Skeleton className='h-16 w-80 mx-auto rounded-lg' />
        {/* Buttons */}
        <div className='flex justify-between mt-2'>
          <Skeleton className='h-10 w-20' />
          <Skeleton className='h-10 w-24' />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for multi-date selection page
 */
export function ChangeDateMultiSkeleton() {
  return (
    <div className='container max-w-4xl'>
      {/* Title */}
      <Skeleton className='h-10 w-64 mt-10' />

      {/* Calendar and options list */}
      <div className='my-8 flex flex-col gap-6'>
        <div className='flex items-start gap-5 flex-col md:flex-row md:justify-evenly'>
          {/* Calendar side */}
          <div className='flex flex-col gap-4'>
            <CalendarSkeleton />
            <Skeleton className='h-10 w-32 mx-auto' />
            <Skeleton className='h-10 w-64 mx-auto' />
          </div>
          {/* Options list side */}
          <div>
            <Skeleton className='h-80 w-72 rounded-md' />
          </div>
        </div>
        {/* Buttons */}
        <div className='flex justify-between'>
          <Skeleton className='h-10 w-20' />
          <Skeleton className='h-10 w-24' />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for date selection page (choosing from available dates)
 */
export function DateSelectSkeleton() {
  return (
    <div className='container max-w-5xl py-4 flex flex-col'>
      {/* Back button */}
      <div className='w-max my-2'>
        <Skeleton className='h-10 w-36' />
      </div>

      {/* Title */}
      <Skeleton className='h-10 w-96 my-4' />

      {/* Date cards list */}
      <div className='flex flex-col gap-4'>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className='border rounded-lg p-4'>
            <div className='flex justify-between items-start'>
              <div className='space-y-2'>
                <Skeleton className='h-6 w-48' />
                <Skeleton className='h-4 w-32' />
              </div>
              <Skeleton className='h-10 w-24' />
            </div>
            {/* Availability bar */}
            <div className='mt-4'>
              <Skeleton className='h-4 w-full rounded-full' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for invite management page
 */
export function InvitePageSkeleton() {
  return (
    <div className='container max-w-5xl py-4'>
      {/* Back button */}
      <Skeleton className='h-10 w-36' />

      {/* Title */}
      <Skeleton className='h-8 w-48 my-4' />

      {/* Add invite button */}
      <Skeleton className='h-10 w-32 mb-4' />

      {/* Invite cards */}
      <div className='grid gap-4 md:grid-cols-2'>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className='border rounded-lg p-4 space-y-3'>
            <div className='flex justify-between items-center'>
              <Skeleton className='h-5 w-32' />
              <Skeleton className='h-8 w-8 rounded' />
            </div>
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-4 w-24' />
          </div>
        ))}
      </div>
    </div>
  );
}
