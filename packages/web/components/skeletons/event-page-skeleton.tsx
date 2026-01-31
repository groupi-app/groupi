import { EventHeaderSkeleton } from './event-header-skeleton';
import { MemberListSkeleton } from './member-list-skeleton';
import { PostFeedSkeleton } from './post-card-skeleton';

/**
 * Full page skeleton for the Event Detail page.
 * Combines header, member list, and post feed skeletons.
 */
export function EventPageSkeleton() {
  return (
    <div className='container pt-6 pb-24 space-y-5'>
      <EventHeaderSkeleton />
      <div className='max-w-4xl mx-auto flex flex-col gap-4'>
        <MemberListSkeleton />
        <div>
          <h2 className='text-xl font-heading font-medium'>Posts</h2>
          <PostFeedSkeleton count={3} />
        </div>
      </div>
    </div>
  );
}
