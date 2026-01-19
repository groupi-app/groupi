'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Type casts needed for data transformations between Convex query result and PostCard props

import { PostCard } from '@/components/post-card';
import { LayoutGroup, motion } from 'framer-motion';
import { PostFeedSkeleton } from '@/components/skeletons';
import { Id } from '@/convex/_generated/dataModel';
import { useEventPostFeed } from '@/hooks/convex';

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

interface PostFeedClientProps {
  eventId: string;
}

/**
 * Client component with direct Convex hooks - Client-only pattern
 * - Uses useEventPostFeed hook for real-time post data
 * - Real-time updates via Convex subscriptions
 * - Optimistic updates handled by Convex mutations
 */
export function PostFeedClient({
  eventId,
}: PostFeedClientProps) {
  // Use direct Convex hook for real-time post data
  const postFeedData = useEventPostFeed(eventId as Id<"events">);

  // Loading state
  if (postFeedData === undefined) {
    return (
      <div>
        <h2 className='text-xl font-heading font-medium'>Posts</h2>
        <PostFeedSkeleton count={3} />
      </div>
    );
  }

  const { event, userMembership } = postFeedData;
  const posts = event?.posts || [];
  // Use personId directly from membership (more reliable than person._id from spread)
  const userId = userMembership.personId;
  const userRole = userMembership.role;
  const eventDateTime = event?.chosenDateTime ? new Date(event.chosenDateTime) : null;

  return (
    <div>
      <h2 className='text-xl font-heading font-medium'>Posts</h2>
      {posts.length > 0 ? (
        <motion.div
          variants={container}
          initial='hidden'
          animate='show'
          className='w-full flex flex-col items-center gap-3 py-2'
        >
          <LayoutGroup>
            {[...posts]
              .sort((a, b) => b.editedAt - a.editedAt)
              .map((post) => (
                <motion.div
                  layout
                  variants={item}
                  key={post._id}
                  className='w-full'
                >
                  <PostCard
                    postData={{
                      ...post,
                      author: post.author?.person ? {
                        ...post.author.person,
                        user: post.author.user,
                      } : {
                        _id: post.authorId,
                        _creationTime: 0,
                        userId: '' as any, // Fallback for missing person
                        user: post.author?.user || {
                          _id: '' as any,
                          _creationTime: 0,
                          name: null,
                          email: '',
                          image: null,
                          twoFactorEnabled: false,
                        },
                      },
                      replies: [], // Reply count handled separately via replyCount
                      event: {
                        ...event,
                        memberships: event.memberships.map((m: typeof event.memberships[0]) => ({
                          ...m,
                          person: m.person ? {
                            ...m.person,
                            user: m.user,
                          } : null as any,
                        })).filter((m: { person: unknown }) => m.person),
                      },
                    } as any}
                    eventDateTime={eventDateTime}
                    userId={userId}
                    userRole={userRole}
                  />
                </motion.div>
              ))}
          </LayoutGroup>
        </motion.div>
      ) : (
        <h1 className='font-heading text-lg mt-4'>No posts yet!</h1>
      )}
    </div>
  );
}
