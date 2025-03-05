"use client";

import { PostCard } from "@/components/post-card";
import { useEventPosts } from "@/data/event-hooks";
import { Member, ReplyAuthorPost } from "@/types";
import { $Enums } from "@prisma/client";
import { LayoutGroup, motion } from "framer-motion";

export function PostFeed({ eventId }: { eventId: string }) {
  const { data: postData } = useEventPosts(eventId);

  const {
    posts,
    userRole,
    userId,
    members,
  }: {
    posts: ReplyAuthorPost[];
    userRole: $Enums.Role;
    userId: string;
    members: Member[];
  } = postData;

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
      <h2 className="text-xl font-heading font-medium">Posts</h2>
      {posts.length > 0 ? (
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
                  <PostCard
                    userId={userId}
                    userRole={userRole}
                    post={post}
                    member={members.find((m) => m.personId === post.authorId)}
                  />
                </motion.div>
              ))}
          </LayoutGroup>
        </motion.div>
      ) : (
        <h1 className="font-heading text-lg mt-4">No posts yet!</h1>
      )}
    </div>
  );
}
