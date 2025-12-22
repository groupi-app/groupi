'use client';

import { PostCard } from '@/components/post-card';
import type { PostFeedData } from '@groupi/schema/data';
import { LayoutGroup, motion } from 'framer-motion';
import { usePusherRealtime } from '@/hooks/use-pusher-realtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPostFeed } from '@/lib/queries/post-queries';
import { qk } from '@/lib/query-keys';

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

type Post = PostFeedData['event']['posts'][0];
type Event = PostFeedData['event'];
type UserMembership = PostFeedData['userMembership'];

interface PostFeedClientProps {
  posts: Post[];
  event: Event;
  userId: string;
  userRole: UserMembership['role'];
}

/**
 * Client component with hybrid caching + realtime
 * - Receives cached initial data from server for fast load (SSR/PPR)
 * - React Query manages client-side state for optimistic updates
 * - Pusher syncs real-time updates via setQueryData (no router.refresh)
 */
export function PostFeedClient({
  posts: initialPosts,
  event,
  userId,
  userRole,
}: PostFeedClientProps) {
  const eventDateTime = undefined as unknown as Date | null;
  const queryClient = useQueryClient();

  // React Query manages client-side state
  const { data: postFeedData } = useQuery({
    queryKey: qk.posts.feed(event.id),
    queryFn: () => fetchPostFeed(event.id),
    initialData: {
      event: {
        ...event,
        posts: initialPosts,
      },
      userMembership: {
        id: '', // Not used, but required for type
        role: userRole,
      },
    } as PostFeedData,
    staleTime: 30 * 1000, // Consider fresh for 30s (matches server cache TTL)
    select: data => data.event.posts, // Extract posts from feed data
  });

  const posts = postFeedData || initialPosts;

  // Sync with Pusher post changes using setQueryData (no router.refresh)
  usePusherRealtime({
    channel: `event-${event.id}-posts`,
    event: 'post-changed',
    tags: [`event-${event.id}`, `event-${event.id}-posts`],
    queryKey: qk.posts.feed(event.id),
    // Custom handlers to update PostFeedData structure
    onInsert: data => {
      // Data from Pusher is PostData (minimal), but we need PostCardData (full structure)
      const postData = data as {
        id: string;
        title: string;
        content: string;
        authorId: string;
        eventId: string;
        createdAt: Date | string;
        updatedAt: Date | string;
        editedAt?: Date | string | null;
      };

      queryClient.setQueryData<PostFeedData>(qk.posts.feed(event.id), old => {
        if (!old) return old;

        // Check if post already exists (avoid duplicates)
        const exists = old.event.posts.some(p => p.id === postData.id);
        if (exists) {
          return old;
        }

        // Find the author's membership to get user data
        const authorMembership = old.event.memberships.find(
          m => m.personId === postData.authorId
        );

        // If we can't find the author, skip adding the post
        // (it will be fetched on next refresh)
        if (!authorMembership) {
          return old;
        }

        // Transform PostData into PostCardData structure
        const newPost: Post = {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          authorId: postData.authorId,
          eventId: postData.eventId,
          createdAt:
            typeof postData.createdAt === 'string'
              ? new Date(postData.createdAt)
              : postData.createdAt,
          updatedAt:
            typeof postData.updatedAt === 'string'
              ? new Date(postData.updatedAt)
              : postData.updatedAt,
          editedAt: postData.editedAt
            ? typeof postData.editedAt === 'string'
              ? new Date(postData.editedAt)
              : postData.editedAt
            : typeof postData.updatedAt === 'string'
              ? new Date(postData.updatedAt)
              : postData.updatedAt,
          author: {
            id: authorMembership.person.id,
            user: {
              name: authorMembership.person.user.name,
              email: authorMembership.person.user.email,
              image: authorMembership.person.user.image,
              username: authorMembership.person.user.username,
            },
          },
          replies: [], // New post has no replies yet
          replyCount: 0,
        };

        return {
          ...old,
          event: {
            ...old.event,
            posts: [newPost, ...old.event.posts],
          },
        };
      });
    },
    onUpdate: data => {
      // Data from Pusher might be PostData (minimal) or PostCardData (full)
      const updateData = data as {
        id: string;
        title?: string;
        content?: string;
        authorId?: string;
        updatedAt?: Date | string;
        editedAt?: Date | string | null;
        // Full structure might also be present
        author?: Post['author'];
        replies?: Post['replies'];
        replyCount?: number;
      };

      queryClient.setQueryData<PostFeedData>(qk.posts.feed(event.id), old => {
        if (!old) return old;

        return {
          ...old,
          event: {
            ...old.event,
            posts: old.event.posts.map(p => {
              if (p.id !== updateData.id) return p;

              // If updateData has full structure, use it
              if (updateData.author && updateData.replies !== undefined) {
                return {
                  ...p,
                  ...updateData,
                  updatedAt: updateData.updatedAt
                    ? typeof updateData.updatedAt === 'string'
                      ? new Date(updateData.updatedAt)
                      : updateData.updatedAt
                    : p.updatedAt,
                  editedAt:
                    updateData.editedAt !== undefined
                      ? updateData.editedAt
                        ? typeof updateData.editedAt === 'string'
                          ? new Date(updateData.editedAt)
                          : updateData.editedAt
                        : updateData.updatedAt
                          ? typeof updateData.updatedAt === 'string'
                            ? new Date(updateData.updatedAt)
                            : updateData.updatedAt
                          : p.updatedAt
                      : p.editedAt,
                } as Post;
              }

              // Otherwise, merge minimal update with existing post structure
              return {
                ...p,
                title: updateData.title ?? p.title,
                content: updateData.content ?? p.content,
                updatedAt: updateData.updatedAt
                  ? typeof updateData.updatedAt === 'string'
                    ? new Date(updateData.updatedAt)
                    : updateData.updatedAt
                  : p.updatedAt,
                editedAt:
                  updateData.editedAt !== undefined
                    ? updateData.editedAt
                      ? typeof updateData.editedAt === 'string'
                        ? new Date(updateData.editedAt)
                        : updateData.editedAt
                      : updateData.updatedAt
                        ? typeof updateData.updatedAt === 'string'
                          ? new Date(updateData.updatedAt)
                          : updateData.updatedAt
                        : p.updatedAt
                    : p.editedAt,
              };
            }),
          },
        };
      });
    },
    onDelete: data => {
      const deletedPost = data as { id: string };
      queryClient.setQueryData<PostFeedData>(qk.posts.feed(event.id), old => {
        if (!old) return old;
        return {
          ...old,
          event: {
            ...old.event,
            posts: old.event.posts.filter(p => p.id !== deletedPost.id),
          },
        };
      });
    },
  });

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
            {posts
              .sort(
                (a: Post, b: Post) =>
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime()
              )
              .map((post: Post) => (
                <motion.div
                  layout
                  variants={item}
                  key={post.id}
                  className='w-full'
                >
                  <PostCard
                    postData={{ ...post, event }}
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
