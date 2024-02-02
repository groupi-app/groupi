"use client";

import { PostCard } from "@/components/post-card";
import { useGetPosts } from "@/data/use-get-posts";
import { PostWithAuthorInfo } from "@/types";
import { auth } from "@clerk/nextjs";

export default function PostFeed({ eventId }: { eventId: string }) {
  const { data: postData } = useGetPosts(eventId);

  if (postData?.error) {
    return <h1>{postData.error}</h1>;
  }

  if (postData?.success) {
    const {
      posts,
      isMod,
      userId,
    }: { posts: PostWithAuthorInfo[]; isMod: boolean; userId: string } =
      postData.success;

    return (
      <div>
        <h2 className="text-xl font-heading">Posts</h2>
        <div className="w-full flex flex-col items-center gap-3 py-2">
          {posts
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .map((post) => (
              <PostCard
                userId={userId}
                isMod={isMod}
                key={post.id}
                post={post}
              />
            ))}
        </div>
      </div>
    );
  }
}
