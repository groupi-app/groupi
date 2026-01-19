import { EventHeaderSkeleton } from '@/components/skeletons/event-header-skeleton';
import { PostFeedSkeleton } from './components/post-feed-skeleton';

export default function EventPageLoading() {
  return (
    <div className="container pt-6 pb-24 space-y-5">
      <EventHeaderSkeleton />
      <div className="mx-auto flex flex-col gap-4 max-w-4xl">
        <PostFeedSkeleton />
      </div>
    </div>
  );
}
