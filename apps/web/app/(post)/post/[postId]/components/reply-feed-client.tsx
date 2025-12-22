'use client';

import Reply from './reply';
import type { PostDetailPageData } from '@groupi/schema/data';
import { LayoutGroup, motion } from 'framer-motion';
import { usePusherRealtime } from '@/hooks/use-pusher-realtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPostDetail } from '@/lib/queries/post-queries';
import { qk } from '@/lib/query-keys';
import { useEffect, useRef } from 'react';

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
  newestReplyRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Client component that uses realtime sync for updates
 * - Receives cached initial data from server for fast load (SSR/PPR)
 * - React Query manages client-side state for optimistic updates
 * - Pusher syncs real-time updates via setQueryData (no router.refresh)
 * - Uses stable keys (database IDs) to prevent re-mounting
 */
export function ReplyFeedClient({
  replies: initialReplies,
  userMembership,
  userId,
  post,
  newestReplyRef,
}: ReplyFeedClientProps) {
  const queryClient = useQueryClient();
  
  // Debounce timer for marking notifications as read
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // React Query manages client-side state (replies are part of post detail)
  // Ensure query is initialized with full PostDetailPageData structure
  // This is critical for Pusher updates to work correctly
  const { data: postDetail } = useQuery({
    queryKey: qk.posts.detail(post.id),
    queryFn: () => fetchPostDetail(post.id),
    initialData: {
      post: { ...post, replies: initialReplies },
      userMembership,
    } as PostDetailPageData,
    staleTime: 30 * 1000, // Consider fresh for 30s (matches server cache TTL)
    select: data => data.post.replies, // Extract replies from post detail
  });

  // Ensure the query cache has the full structure initialized
  // This is critical for newly created posts where the query might not exist yet
  // or might have been initialized by FullPostClient without replies
  useEffect(() => {
    const currentData = queryClient.getQueryData<PostDetailPageData>(
      qk.posts.detail(post.id)
    );

    // Initialize query cache if needed
    if (
      !currentData ||
      !currentData.post ||
      !Array.isArray(currentData.post.replies)
    ) {
      queryClient.setQueryData<PostDetailPageData>(qk.posts.detail(post.id), {
        post: { ...post, replies: initialReplies },
        userMembership,
      });
    } else if (
      currentData.post.replies.length === 0 &&
      initialReplies.length > 0
    ) {
      // If query exists but has no replies and we have initial replies, update it
      // This handles the case where FullPostClient initialized it first with empty replies
      queryClient.setQueryData<PostDetailPageData>(qk.posts.detail(post.id), {
        ...currentData,
        post: {
          ...currentData.post,
          replies: initialReplies,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
  }, []);

  const replies = (postDetail || initialReplies).sort((a, b) => {
    const aDate =
      a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
    const bDate =
      b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    return aDate.getTime() - bDate.getTime(); // Oldest first, newest last
  });

  // Sync with Pusher reply changes using setQueryData (no router.refresh)
  // Custom handler to update post detail query with replies
  usePusherRealtime({
    channel: `post-${post.id}-replies`,
    event: 'reply-changed',
    tags: [`post-${post.id}`, `post-${post.id}-replies`],
    queryKey: qk.posts.detail(post.id),
    onInsert: data => {
      // Custom handler: Update post detail query with new reply
      // Pusher sends ReplyData (with authorId) but we need Reply_Type (with author)
      // Handle both cases: full data with author, or partial data with authorId
      const pusherData = data as
        | Reply_Type
        | (Reply_Type & { authorId?: string });
      
      // Extract authorId from Pusher data (may be in author.id or authorId field)
      // Extract this before setQueryData so we can use it for auto-mark logic
      const pusherAuthorId =
        (pusherData as Reply_Type).author?.id ||
        (pusherData as { authorId?: string }).authorId;
      
      let replyWasAdded = false;
      
      queryClient.setQueryData<PostDetailPageData>(
        qk.posts.detail(post.id),
        old => {
          // If query doesn't exist, initialize it with current post data
          if (!old) {
            return {
              post: { ...post, replies: initialReplies },
              userMembership,
            };
          }

          // Check if reply already exists (avoid duplicates)
          const exists = old.post.replies.some(r => r.id === pusherData.id);
          if (exists) {
            // Update existing reply if Pusher sent full data
            return {
              ...old,
              post: {
                ...old.post,
                replies: old.post.replies.map(r =>
                  r.id === pusherData.id ? (pusherData as Reply_Type) : r
                ),
              },
            };
          }

          // Check if there's an optimistic reply to replace (same text and author)
          // Match by text and authorId (handle both author.id and authorId field)
          const optimisticIndex = old.post.replies.findIndex(r => {
            if (!('optimistic' in r) || !r.optimistic) return false;
            if (r.text !== pusherData.text) return false;

            // Match author: optimistic has author.id, Pusher may have author.id or authorId
            const optimisticAuthorId = r.author?.id;
            return optimisticAuthorId === pusherAuthorId;
          });

          if (optimisticIndex !== -1) {
            // Replace optimistic reply with real one
            // If Pusher sent partial data without author, construct it from optimistic reply's author
            const newReply: Reply_Type = (pusherData as Reply_Type).author
              ? (pusherData as Reply_Type)
              : ({
                  ...pusherData,
                  author: old.post.replies[optimisticIndex].author!,
                } as Reply_Type);

            replyWasAdded = true;
            return {
              ...old,
              post: {
                ...old.post,
                replies: old.post.replies.map((r, idx) =>
                  idx === optimisticIndex ? newReply : r
                ),
              },
            };
          }

          // No optimistic reply to replace
          // If Pusher sent data without author, skip it (will be fetched on next refresh)
          // This prevents adding incomplete replies
          if (!(pusherData as Reply_Type).author && !pusherAuthorId) {
            return old;
          }

          // Construct full reply if author is missing but authorId exists
          // Try to find author info from existing replies or post author
          let fullReply: Reply_Type;
          if ((pusherData as Reply_Type).author) {
            fullReply = pusherData as Reply_Type;
          } else if (pusherAuthorId) {
            // Try to find author from existing replies
            const existingAuthor =
              old.post.replies.find(r => r.author?.id === pusherAuthorId)
                ?.author ||
              (old.post.author.id === pusherAuthorId ? old.post.author : null);

            if (existingAuthor) {
              fullReply = {
                ...pusherData,
                author: existingAuthor,
              } as Reply_Type;
            } else {
              // Can't construct full reply, skip it
              return old;
            }
          } else {
            return old;
          }

          replyWasAdded = true;
          // Add new reply at the end (oldest first, newest last)
          return {
            ...old,
            post: {
              ...old.post,
              replies: [...old.post.replies, fullReply],
            },
          };
        }
      );

      // Auto-mark NEW_REPLY notification as read if reply author is different from current user
      // This prevents badge spam during active conversations
      // Only mark if a new reply was actually added (not a duplicate or skipped)
      // Import action lazily to avoid bundling issues with Next.js cache components
      if (replyWasAdded && pusherAuthorId && pusherAuthorId !== userId) {
        // Debounce to batch multiple rapid replies (500ms window)
        if (markAsReadTimeoutRef.current) {
          clearTimeout(markAsReadTimeoutRef.current);
        }
        markAsReadTimeoutRef.current = setTimeout(async () => {
          try {
            const { markNotificationAsReadByPostAndTypeAction } = await import('@/actions/notification-actions');
            await markNotificationAsReadByPostAndTypeAction({
              postId: post.id,
              type: 'NEW_REPLY',
            });
          } catch (err) {
            // Silently fail - don't interrupt real-time updates
            console.error('Failed to mark NEW_REPLY notification as read:', err);
          }
        }, 500);
      }
    },
    onUpdate: data => {
      // Custom handler: Update reply in post detail
      const updatedReply = data as Reply_Type;
      queryClient.setQueryData<PostDetailPageData>(
        qk.posts.detail(post.id),
        old => {
          if (!old) return old;
          return {
            ...old,
            post: {
              ...old.post,
              replies: old.post.replies.map(r =>
                r.id === updatedReply.id ? updatedReply : r
              ),
            },
          };
        }
      );
    },
    onDelete: data => {
      // Custom handler: Remove reply from post detail
      const deletedReply = data as { id: string };
      queryClient.setQueryData<PostDetailPageData>(
        qk.posts.detail(post.id),
        old => {
          if (!old) return old;
          return {
            ...old,
            post: {
              ...old.post,
              replies: old.post.replies.filter(r => r.id !== deletedReply.id),
            },
          };
        }
      );
    },
  });

  if (replies.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No replies yet. Be the first to reply!
      </div>
    );
  }

  // Find member for each reply author
  const getMemberForReply = (replyAuthorId: string) => {
    return post.event.memberships?.find(m => m.personId === replyAuthorId);
  };

  // Get the newest reply (last in array since we're oldest-first now)
  const newestReply = replies.length > 0 ? replies[replies.length - 1] : null;

  return (
    <div className='flex flex-col'>
      <LayoutGroup>
        {replies.map((reply) => {
          const member = reply.author
            ? getMemberForReply(reply.author.id)
            : undefined;

          const isNewest = newestReply && reply.id === newestReply.id;

          return (
            <motion.div
              key={reply.id}
              layout
              variants={item}
              initial={false}
              animate='show'
              ref={isNewest && newestReplyRef ? newestReplyRef : undefined}
            >
              <Reply
                reply={reply}
                member={member}
                userId={userId}
                userRole={userMembership.role}
                eventDateTime={post.event.chosenDateTime}
                postId={post.id}
                post={post}
              />
            </motion.div>
          );
        })}
      </LayoutGroup>
    </div>
  );
}
