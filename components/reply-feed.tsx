"use client";

import Reply from "@/components/reply";
import { usePostReplies } from "@/data/post-hooks";
import { AuthorReply, Member } from "@/types";
import { $Enums } from "@prisma/client";
import { LayoutGroup, motion } from "framer-motion";

export default function ReplyFeed({ postId }: { postId: string }) {
  const { data: replyData } = usePostReplies(postId);
  const {
    replies,
    members,
    userId,
    userRole,
    eventDateTime,
  }: {
    replies: AuthorReply[];
    members: Member[];
    userId: string;
    userRole: $Enums.Role;
    eventDateTime: Date | null;
  } = replyData;

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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4"
    >
      <LayoutGroup>
        {replies
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .map((reply) => (
            <motion.div
              layout
              variants={item}
              key={reply.id}
              className="w-full"
            >
              <Reply
                reply={reply}
                member={members.find((m) => m.personId === reply.authorId)}
                userId={userId}
                userRole={userRole}
                eventDateTime={eventDateTime}
              />
            </motion.div>
          ))}
      </LayoutGroup>
    </motion.div>
  );
}
