import { PostCardSkeleton } from '@/components/post-card';

export function PostFeedSkeleton() {
  return (
    <div>
      <h2 className='text-xl font-heading font-medium'>Posts</h2>
      <div className='flex flex-col gap-4 py-2'>
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  );
}
