import { PostCard } from "../post-card";

export function PostFeedSkeleton() {
  return (
    <div>
      <h2 className="text-xl font-heading font-medium">Posts</h2>
      <div className="flex flex-col gap-4 py-2">
        <PostCard.Skeleton />
        <PostCard.Skeleton />
        <PostCard.Skeleton />
        <PostCard.Skeleton />
        <PostCard.Skeleton />
        <PostCard.Skeleton />
        <PostCard.Skeleton />
        <PostCard.Skeleton />
      </div>
    </div>
  );
}
