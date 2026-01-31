import { Skeleton } from '../ui/skeleton';

/**
 * Skeleton for the reply list
 * Uses design tokens for consistent spacing
 */
export function ReplyListSkeleton() {
  return (
    <div className='flex flex-col gap-3'>
      <ReplySkeleton />
      <ReplySkeleton />
      <ReplySkeleton />
      <ReplySkeleton />
    </div>
  );
}

/**
 * Skeleton for a single reply item
 * Matches the structure of the Reply component:
 * - Avatar (size-10, rounded-avatar)
 * - Content area with name + timestamp + text
 */
export function ReplySkeleton() {
  return (
    <div className='flex items-start gap-3 py-3 px-2'>
      {/* Avatar - uses avatar token (size-10 = 40px, rounded-avatar = 50%) */}
      <Skeleton className='size-10 rounded-avatar shrink-0' />
      <div className='flex-1 min-w-0'>
        {/* Name + timestamp row */}
        <div className='flex items-baseline gap-2 mb-1'>
          <Skeleton className='h-4 w-24 rounded-subtle' />
          <Skeleton className='h-3 w-16 rounded-subtle' />
        </div>
        {/* Reply text content */}
        <Skeleton className='h-4 w-full rounded-subtle' />
        <Skeleton className='h-4 w-4/5 mt-1 rounded-subtle' />
      </div>
    </div>
  );
}

/**
 * Skeleton for the reply form
 * Matches the structure of ReplyForm component:
 * - Attachment button on left (size-9)
 * - Editor container with inline submit button
 */
export function ReplyFormSkeleton() {
  return (
    <div className='px-2 pb-4 pt-2'>
      <div className='flex items-start gap-1'>
        {/* Attachment button - uses button token radius */}
        <Skeleton className='size-9 mt-2 rounded-button flex-shrink-0' />
        {/* Editor container with submit button inside */}
        <div className='relative flex-1'>
          {/* Editor area - uses input token radius */}
          <Skeleton className='h-12 w-full rounded-input' />
          {/* Submit button - positioned inside editor, uses button token radius */}
          <Skeleton className='absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-button' />
        </div>
      </div>
    </div>
  );
}
