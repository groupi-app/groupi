'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Type casts needed for data transformations between Convex query result and PostCard props

import { PostCard } from '@/components/post-card';
import { LayoutGroup, motion } from 'framer-motion';
import { useEventPostFeed } from '@/hooks/convex';
import { MutedPostsProvider } from '@/hooks/convex/use-muting';

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

// Type for the data prop (inferred from useEventPostFeed return type)
type PostFeedDataType = NonNullable<ReturnType<typeof useEventPostFeed>>;

interface PostFeedProps {
  data: PostFeedDataType;
}

/**
 * Post feed component - receives data from context
 * - Data is pre-loaded by EventDataProvider in layout
 * - Real-time updates still work via Convex subscriptions in provider
 * - No loading state needed - data is guaranteed
 */
export function PostFeed({ data }: PostFeedProps) {
  // Data is guaranteed by parent - no loading checks needed
  const { event, userMembership } = data;
  const posts = event?.posts || [];
  // Use personId directly from membership (more reliable than person._id from spread)
  const userId = userMembership.personId;
  const userRole = userMembership.role;
  const eventDateTime = event?.chosenDateTime
    ? new Date(event.chosenDateTime)
    : null;

  return (
    <MutedPostsProvider>
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
                .map(post => (
                  <motion.div
                    layout
                    variants={item}
                    key={post._id}
                    className='w-full'
                  >
                    <PostCard
                      postData={
                        {
                          ...post,
                          author: post.author?.person
                            ? {
                                ...post.author.person,
                                user: post.author.user,
                              }
                            : {
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
                          replies: (post.recentReplyAuthors || []).map(
                            (author: {
                              id: string;
                              _creationTime: number;
                              user: {
                                name: string | null;
                                email: string;
                                image: string | null;
                              } | null;
                            }) => ({
                              _creationTime: author._creationTime,
                              author: {
                                id: author.id,
                                user: author.user,
                              },
                            })
                          ),
                          event: {
                            ...event,
                            memberships: event.memberships
                              .map((m: (typeof event.memberships)[0]) => ({
                                ...m,
                                person: m.person
                                  ? {
                                      ...m.person,
                                      user: m.user,
                                    }
                                  : (null as any),
                              }))
                              .filter((m: { person: unknown }) => m.person),
                          },
                        } as any
                      }
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
    </MutedPostsProvider>
  );
}
