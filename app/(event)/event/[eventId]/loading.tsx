import { PostCard } from "@/components/post-card";

export default function Page() {
  return (
    <div className="container py-12">
      <div className="w-full flex flex-col items-center gap-3">
        <PostCard.Skeleton />
        <PostCard.Skeleton />
        <PostCard.Skeleton />
        <PostCard.Skeleton />
        <PostCard.Skeleton />
      </div>
    </div>
  );
}
