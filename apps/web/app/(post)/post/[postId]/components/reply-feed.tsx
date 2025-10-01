'use client';

import Reply from './reply';
import { usePostDetail } from '@groupi/hooks';
import { useAuth } from '@clerk/nextjs';
import type { PostDetailDTO } from '@groupi/schema';
import { LayoutGroup, motion } from 'framer-motion';

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

export default function ReplyFeed({ postId }: { postId: string }) {
  const { userId } = useAuth();
  const { data, isLoading } = usePostDetail(postId);

  if (isLoading || !data) {
    return <div>Loading replies...</div>;
  }

  const [error, postData] = data;

  if (error) {
    return <div>Error loading replies</div>;
  }

  const { post, userMembership } = postData;
  const replies: PostDetailDTO['replies'] = post.replies || [];

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
              userId={userId || ''}
              userRole={userMembership.role}
              eventDateTime={post.event.chosenDateTime}
            />
          </motion.div>
        ))}
      </LayoutGroup>
    </motion.div>
  );
}
