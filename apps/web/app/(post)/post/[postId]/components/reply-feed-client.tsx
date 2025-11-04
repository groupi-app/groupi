'use client';

import Reply from './reply';
import type { PostDetailPageData } from '@groupi/schema/data';
import { LayoutGroup, motion } from 'framer-motion';
import { useState } from 'react';
import { useRealtimeSync } from '@/hooks/use-realtime-sync';

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

type Reply_Type = PostDetailPageData['post']['replies'][0];
type UserMembership = PostDetailPageData['userMembership'];
type Post = PostDetailPageData['post'];

interface ReplyFeedClientProps {
  replies: Reply_Type[];
  userMembership: UserMembership;
  userId: string;
  post: Post;
}

/**
 * Client component with hybrid caching + realtime
 * - Receives cached initial data from server for fast load
 * - Syncs with realtime database changes for live updates
 */
export function ReplyFeedClient({
  replies: initialReplies,
  userMembership,
  userId,
  post,
}: ReplyFeedClientProps) {
  const [replies, setReplies] = useState(initialReplies);

  // Sync with realtime reply changes
  useRealtimeSync({
    channel: `post-${post.id}-replies`,
    table: 'Reply',
    filter: `postId=eq.${post.id}`,
    onInsert: payload => {
      // Optimistically add new reply
      setReplies(prev => [...prev, payload.new as Reply_Type]);
    },
    onUpdate: payload => {
      // Optimistically update existing reply
      setReplies(prev =>
        prev.map(r =>
          r.id === payload.new.id ? (payload.new as Reply_Type) : r
        )
      );
    },
    onDelete: payload => {
      // Optimistically remove deleted reply
      setReplies(prev => prev.filter(r => r.id !== payload.old.id));
    },
    refreshOnChange: true, // Also refresh cache in background
  });

  if (replies.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No replies yet. Be the first to reply!
      </div>
    );
  }

  return (
    <motion.div
      initial='hidden'
      animate='show'
      variants={container}
      className='flex flex-col gap-4'
    >
      <LayoutGroup>
        {replies.map(reply => (
          <motion.div layout variants={item} key={reply.id}>
            <Reply
              key={reply.id}
              reply={reply}
              member={undefined} // Member data not included in reply
              userId={userId}
              userRole={userMembership.role}
              eventDateTime={post.event.chosenDateTime}
            />
          </motion.div>
        ))}
      </LayoutGroup>
    </motion.div>
  );
}
