"use client";

import { PostCard } from "@/components/post-card";
import { useEventPosts } from "@/data/event-hooks";
import { PostWithAuthorInfo } from "@/types";
import { motion, LayoutGroup } from "framer-motion";

export function PostFeed({ eventId }: { eventId: string }) {
  const { data: postData } = useEventPosts(eventId);

  const {
    posts,
    isMod,
    userId,
  }: { posts: PostWithAuthorInfo[]; isMod: boolean; userId: string } = postData;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div>
      <h2 className="text-xl font-heading">Posts</h2>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full flex flex-col items-center gap-3 py-2"
      >
        <LayoutGroup>
          {posts
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .map((post) => (
              <motion.div
                layout
                variants={item}
                key={post.id}
                className="w-full"
              >
                <PostCard userId={userId} isMod={isMod} post={post} />
              </motion.div>
            ))}
        </LayoutGroup>
      </motion.div>
    </div>
  );
}
