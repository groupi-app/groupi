import { Skeleton } from '../ui/skeleton';

/**
 * EventListSkeleton - Generic skeleton loader for event lists
 *
 * Note: The My Events page uses a custom inline skeleton that includes
 * actual interactive filter controls. This component is for other contexts
 * where a standalone skeleton is needed.
 */
export function EventListSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Welcome header skeleton */}
      <div className='space-y-2'>
        {/* "Hey, Name!" title */}
        <Skeleton className='h-10 w-48' />
        {/* Event stats */}
        <div className='flex items-center gap-4'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-5 w-28' />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className='flex flex-wrap items-center gap-4'>
        {/* Time filter tabs */}
        <div className='flex gap-1 p-1 rounded-button bg-muted'>
          <Skeleton className='h-8 w-24 rounded-button' />
          <Skeleton className='h-8 w-24 rounded-button' />
        </div>

        {/* Only my events toggle */}
        <div className='flex items-center gap-2'>
          <Skeleton className='h-5 w-9 rounded-full' />
          <Skeleton className='h-4 w-28' />
        </div>

        {/* Sort dropdown */}
        <div className='ml-auto'>
          <Skeleton className='h-10 w-[160px] rounded-input' />
        </div>
      </div>

      {/* Event grid skeleton - matches 1/2/3 column responsive grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        <VisualEventCardSkeleton />
        <VisualEventCardSkeleton />
        <VisualEventCardSkeleton />
        <VisualEventCardSkeleton />
        <VisualEventCardSkeleton />
        <VisualEventCardSkeleton />
      </div>
    </div>
  );
}

/**
 * VisualEventCardSkeleton - Skeleton for the visual event card
 * Matches VisualEventCard: cover image, title, description, date, location, organizer
 */
export function VisualEventCardSkeleton() {
  return (
    <div className='flex flex-col overflow-hidden rounded-card shadow-raised bg-card'>
      {/* Cover image area - 16:9 aspect ratio */}
      <Skeleton className='aspect-[16/9] w-full rounded-none' />

      {/* Content area */}
      <div className='p-4 flex flex-col gap-2'>
        {/* Title */}
        <Skeleton className='h-6 w-3/4' />

        {/* Description (2 lines) */}
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-2/3' />

        {/* Date */}
        <div className='flex items-center gap-1.5'>
          <Skeleton className='size-4 rounded-full' />
          <Skeleton className='h-4 w-32' />
        </div>

        {/* Location */}
        <div className='flex items-center gap-1.5'>
          <Skeleton className='size-4 rounded-full' />
          <Skeleton className='h-4 w-40' />
        </div>

        {/* Organizer */}
        <div className='flex items-center gap-2 mt-1'>
          <Skeleton className='size-5 rounded-full' />
          <Skeleton className='h-4 w-24' />
        </div>
      </div>
    </div>
  );
}

/**
 * @deprecated Use VisualEventCardSkeleton instead
 * Legacy EventCardSkeleton for backwards compatibility
 */
export function EventCardSkeleton() {
  return (
    <div className='flex flex-col gap-2 border border-border shadow-raised p-4 px-6 rounded-card'>
      <div className='flex flex-col md:flex-row gap-2 md:gap-8'>
        {/* Title and description */}
        <div className='flex flex-col grow gap-2 md:w-1/2'>
          <Skeleton className='h-8 w-3/4' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
        </div>

        {/* Location, date, and timestamps */}
        <div className='flex flex-col md:w-1/2 justify-between gap-2'>
          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-1'>
              <Skeleton className='size-6 rounded-full' />
              <Skeleton className='h-4 w-32' />
            </div>
            <div className='flex items-center gap-1'>
              <Skeleton className='size-6 rounded-full' />
              <Skeleton className='h-4 w-48' />
            </div>
          </div>
          <div className='flex flex-col gap-1'>
            <Skeleton className='h-3 w-32' />
            <Skeleton className='h-3 w-36' />
          </div>
        </div>
      </div>
    </div>
  );
}
