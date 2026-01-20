'use client';

import Reply from './reply';
import { LayoutGroup, motion } from 'framer-motion';
import {
  usePostReplies,
  useMarkPostNotificationsAsRead,
} from '@/hooks/convex/use-replies';
import { ReplyListSkeleton } from '@/components/skeletons';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { useEffect, useRef, RefObject, useMemo } from 'react';
import { User } from '@/convex/types';

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

// Type for membership with nested person and user (person is required, not null)
type MembershipWithPerson = Doc<'memberships'> & {
  person: Doc<'persons'> & {
    user: User;
  };
};

// Type for post with event and memberships (from Convex, person can be null but we filter)
type PostMembership = Doc<'memberships'> & {
  person:
    | (Doc<'persons'> & {
        user: User;
      })
    | null;
};

// Type for post with event and memberships
type PostWithEvent = Doc<'posts'> & {
  event: Doc<'events'> & {
    memberships: PostMembership[];
  };
};

/**
 * Reply feed component with Convex real-time subscriptions
 * - Uses Convex hooks for real-time data with automatic updates
 * - No need for React Query or Pusher - Convex handles everything
 */
export function ReplyFeedClient({
  userId,
  postId,
  userRole,
  eventDateTime,
  newestReplyRef,
  post,
  editingReplyId,
  onClearEditing,
}: {
  userId: string;
  postId: string;
  userRole: string;
  eventDateTime: Date | null;
  newestReplyRef: RefObject<HTMLDivElement | null>;
  post?: PostWithEvent;
  editingReplyId?: string | null;
  onClearEditing?: () => void;
}) {
  // Debounce timer for marking notifications as read
  const markAsReadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const markPostNotificationsAsRead = useMarkPostNotificationsAsRead();

  // Use Convex hooks for real-time replies
  const { replies, isLoading } = usePostReplies(postId as Id<'posts'>);

  // Auto-mark NEW_REPLY notifications as read
  useEffect(() => {
    if (replies.length > 0) {
      // Debounce to batch multiple rapid replies (500ms window)
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
      markAsReadTimeoutRef.current = setTimeout(async () => {
        try {
          await markPostNotificationsAsRead(postId as Id<'posts'>);
        } catch (err) {
          console.error('Failed to mark NEW_REPLY notification as read:', err);
        }
      }, 500);
    }
  }, [replies.length, postId, markPostNotificationsAsRead]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
  }, []);

  // Create a map of personId -> membership for quick lookup
  // Only include memberships where person is not null
  // IMPORTANT: This hook must be called before any early returns
  const memberships = post?.event?.memberships;
  const membershipByPersonId = useMemo(() => {
    const map = new Map<string, MembershipWithPerson>();
    if (memberships) {
      for (const membership of memberships) {
        if (membership.person) {
          // TypeScript now knows person is not null, so we can safely cast
          map.set(membership.person._id, membership as MembershipWithPerson);
        }
      }
    }
    return map;
  }, [memberships]);

  if (isLoading) {
    return <ReplyListSkeleton />;
  }

  if (replies.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No replies yet. Be the first to reply!
      </div>
    );
  }

  // Sort replies oldest first, newest last
  const sortedReplies = [...replies].sort(
    (a, b) => a._creationTime - b._creationTime
  );

  // Get the newest reply (last in array)
  const newestReply =
    sortedReplies.length > 0 ? sortedReplies[sortedReplies.length - 1] : null;

  return (
    <div className='flex flex-col'>
      <LayoutGroup>
        {sortedReplies.map(reply => {
          const isNewest = newestReply && reply._id === newestReply._id;

          // Find the membership for this reply's author
          const authorPersonId = reply.author?.person?._id;
          const authorMembership = authorPersonId
            ? membershipByPersonId.get(authorPersonId)
            : undefined;

          return (
            <motion.div
              key={reply._id}
              layout
              variants={item}
              initial={false}
              animate='show'
              ref={isNewest && newestReplyRef ? newestReplyRef : undefined}
            >
              <Reply
                reply={{
                  id: reply._id,
                  _id: reply._id,
                  text: reply.text,
                  createdAt: new Date(reply._creationTime),
                  updatedAt: new Date(reply.updatedAt ?? reply._creationTime),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  author: reply.author?.person as any,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  attachments: (reply as any).attachments,
                }}
                member={authorMembership}
                userId={userId}
                userRole={userRole}
                eventDateTime={eventDateTime}
                postId={postId}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                post={post as any}
                isEditing={editingReplyId === reply._id}
                onClearEditing={onClearEditing}
              />
            </motion.div>
          );
        })}
      </LayoutGroup>
    </div>
  );
}
