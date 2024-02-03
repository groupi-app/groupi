"use client";

import { PostCard } from "@/components/post-card";
import { useEventPosts } from "@/data/event-hooks";
import { PostWithAuthorInfo } from "@/types";

export default function PostFeed({ eventId }: { eventId: string }) {
  const { data: postData } = useEventPosts(eventId);

  const {
    posts,
    isMod,
    userId,
  }: { posts: PostWithAuthorInfo[]; isMod: boolean; userId: string } = postData;

  return (
    <div>
      <h2 className="text-xl font-heading">Posts</h2>
      <div className="w-full flex flex-col items-center gap-3 py-2">
        {posts
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .map((post) => (
            <PostCard userId={userId} isMod={isMod} key={post.id} post={post} />
          ))}
      </div>
    </div>
  );
}
