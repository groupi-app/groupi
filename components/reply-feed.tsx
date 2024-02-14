"use client";

import Reply from "@/components/reply";
import { usePostReplies } from "@/data/post-hooks";
import { AuthorReply, Member } from "@/types";
import { auth } from "@clerk/nextjs";
import { $Enums } from "@prisma/client";

export default function ReplyFeed({ postId }: { postId: string }) {
  const { data: replyData } = usePostReplies(postId);
  const {
    replies,
    members,
    userId,
    userRole,
  }: {
    replies: AuthorReply[];
    members: Member[];
    userId: string;
    userRole: $Enums.Role;
  } = replyData;
  return (
    <div className="flex flex-col gap-4">
      {replies
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((reply, i) => (
          <Reply
            key={i}
            reply={reply}
            member={members.find((m) => m.personId === reply.authorId)}
            userId={userId}
            userRole={userRole}
          />
        ))}
    </div>
  );
}
