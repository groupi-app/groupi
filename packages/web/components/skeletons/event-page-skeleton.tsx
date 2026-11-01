import { DetailPageTemplate } from '@/components/templates/detail-page-template';
import { EventHeaderSkeleton } from './event-header-skeleton';
import { MemberListSkeleton } from './member-list-skeleton';
import { PostFeedSkeleton } from './post-card-skeleton';

/** Data-free event shell. Optional cover, add-ons and permitted actions are unknown. */
export function EventPageSkeleton() {
  return (
    <>
      <p role='status' className='sr-only'>
        Loading event…
      </p>
      <DetailPageTemplate aria-busy='true' header={<EventHeaderSkeleton />}>
        <div aria-hidden='true'>
          <MemberListSkeleton />
        </div>
        <div aria-hidden='true'>
          <h2 className='text-xl font-heading font-medium'>Posts</h2>
          <PostFeedSkeleton count={3} />
        </div>
      </DetailPageTemplate>
    </>
  );
}
