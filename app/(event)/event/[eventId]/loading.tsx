import { PostCard } from "@/components/post-card";
import { EventHeaderSkeleton } from "@/components/skeletons/event-header-skeleton";
import { MemberListSkeleton } from "@/components/skeletons/member-list-skeleton";
import { PostFeedSkeleton } from "@/components/skeletons/post-feed-skeleton";

export default function Page() {
  return (
    <div className="container pt-6 pb-24 space-y-5">
      <EventHeaderSkeleton />
      <div className="mx-auto flex flex-col gap-4 max-w-4xl">
        <MemberListSkeleton />
        <PostFeedSkeleton />
      </div>
    </div>
  );
}
