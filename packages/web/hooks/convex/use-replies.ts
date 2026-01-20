'use client';

import { useQuery, useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

// ===== OPTIMISTIC ATTACHMENT TYPES =====

/**
 * Attachment data for optimistic rendering
 * Uses preview URLs before real storage URLs are available
 */
export interface OptimisticAttachment {
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  isSpoiler?: boolean;
  altText?: string;
  /** Preview URL (blob URL) for immediate display */
  previewUrl?: string;
}

// ===== API REFERENCES =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let replyQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let replyMutations: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let notificationMutations: any;

function initApi() {
  if (!replyQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    replyQueries = api.replies?.queries ?? {};
    replyMutations = api.replies?.mutations ?? {};
    notificationMutations = api.notifications?.mutations ?? {};
  }
}
initApi();

// ===== REPLY QUERIES =====

/**
 * Get replies for a post with real-time updates
 */
export function useRepliesByPost(postId: Id<'posts'>) {
  return useQuery(replyQueries.getRepliesByPost, {
    postId,
  });
}

// ===== REPLY MUTATIONS =====

// Type for current user data needed for optimistic updates
export interface OptimisticUserData {
  personId: Id<'persons'>;
  name?: string;
  email?: string;
  image?: string;
  username?: string;
}

/**
 * Create a new reply with optimistic updates
 * Pass currentUser for instant optimistic UI updates
 */
export function useCreateReply(currentUser?: OptimisticUserData) {
  const baseMutation = useMutation(replyMutations.createReply);
  const { toast } = useToast();

  // Ref to hold optimistic attachments for the current mutation
  // This allows us to pass attachment data to the optimistic update
  const pendingAttachmentsRef = useRef<OptimisticAttachment[]>([]);

  // Create mutation with optimistic update if user data is provided
  const createReply = useMemo(() => {
    if (!currentUser) {
      return baseMutation;
    }

    return baseMutation.withOptimisticUpdate((localStore, args) => {
      // Get current replies from the cache
      const currentData = localStore.getQuery(replyQueries.getRepliesByPost, {
        postId: args.postId,
      });

      if (currentData === undefined) {
        return;
      }

      // Create optimistic reply that matches the expected shape
      // Using 'as unknown as' pattern for temporary optimistic data
      // eslint-disable-next-line react-hooks/purity -- Date.now() is called in mutation callback, not during render
      const now = Date.now();

      // Build optimistic attachments from the ref
      console.log(
        '[Optimistic Update] pendingAttachmentsRef.current:',
        pendingAttachmentsRef.current
      );
      const optimisticAttachments = pendingAttachmentsRef.current.map(
        (att, index) => {
          // Determine attachment type from MIME type
          let type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' = 'FILE';
          if (att.mimeType.startsWith('image/')) type = 'IMAGE';
          else if (att.mimeType.startsWith('video/')) type = 'VIDEO';
          else if (att.mimeType.startsWith('audio/')) type = 'AUDIO';

          return {
            _id: `optimistic_attachment_${now}_${index}` as unknown as Id<'attachments'>,
            type,
            filename: att.filename,
            size: att.size,
            mimeType: att.mimeType,
            width: att.width,
            height: att.height,
            isSpoiler: att.isSpoiler,
            altText: att.altText,
            // Use preview URL for immediate display
            url: att.previewUrl || null,
          };
        }
      );

      const optimisticReply = {
        _id: `optimistic_${now}` as unknown as Id<'replies'>,
        _creationTime: now,
        postId: args.postId,
        text: args.text,
        authorId: currentUser.personId,
        membershipId: `optimistic_membership` as unknown as Id<'memberships'>,
        author: {
          person: {
            _id: currentUser.personId,
            userId: currentUser.personId,
            user: {
              _id: `optimistic_user`,
              name: currentUser.name,
              email: currentUser.email || '',
              image: currentUser.image,
              username: currentUser.username,
            },
          },
          user: {
            _id: `optimistic_user`,
            name: currentUser.name,
            email: currentUser.email || '',
            image: currentUser.image,
            username: currentUser.username,
          },
        },
        // Include optimistic attachments
        attachments: optimisticAttachments,
      };

      // Add the optimistic reply to the cache
      localStore.setQuery(
        replyQueries.getRepliesByPost,
        { postId: args.postId },
        {
          ...currentData,
          replies: [...currentData.replies, optimisticReply],
        }
      );
    });
  }, [baseMutation, currentUser]);

  return useCallback(
    async (data: {
      postId: Id<'posts'>;
      text: string; // HTML content with mention spans
      /** Optional attachments for optimistic rendering */
      optimisticAttachments?: OptimisticAttachment[];
    }) => {
      try {
        // Store attachments in ref for the optimistic update to access
        console.log(
          '[createReply] data.optimisticAttachments:',
          data.optimisticAttachments
        );
        pendingAttachmentsRef.current = data.optimisticAttachments || [];

        const result = await createReply({
          postId: data.postId,
          text: data.text,
        });

        // Clear the ref after mutation completes
        pendingAttachmentsRef.current = [];

        // No success toast - the reply appearing instantly is feedback enough
        return result;
      } catch (error) {
        // Clear the ref on error too
        pendingAttachmentsRef.current = [];

        toast({
          title: 'Error',
          description: 'Failed to add reply. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [createReply, toast]
  );
}

/**
 * Update an existing reply with optimistic updates
 */
export function useUpdateReply(postId?: Id<'posts'>) {
  const baseMutation = useMutation(replyMutations.updateReply);
  const { toast } = useToast();

  // Create mutation with optimistic update if postId is provided
  const updateReply = useMemo(() => {
    if (!postId) {
      return baseMutation;
    }

    return baseMutation.withOptimisticUpdate((localStore, args) => {
      const currentData = localStore.getQuery(replyQueries.getRepliesByPost, {
        postId,
      });

      if (currentData === undefined) {
        return;
      }

      // Update the reply in the cache
      const updatedReplies = currentData.replies.map(
        (reply: { _id: Id<'replies'>; text: string }) =>
          reply._id === args.replyId
            ? { ...reply, text: args.text, updatedAt: Date.now() }
            : reply
      );

      localStore.setQuery(
        replyQueries.getRepliesByPost,
        { postId },
        {
          ...currentData,
          replies: updatedReplies,
        }
      );
    });
  }, [baseMutation, postId]);

  return useCallback(
    async (data: { replyId: Id<'replies'>; text: string }) => {
      try {
        const result = await updateReply({
          replyId: data.replyId,
          text: data.text,
        });

        // No success toast - instant update is feedback enough
        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update reply. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [updateReply, toast]
  );
}

/**
 * Delete a reply with optimistic updates
 */
export function useDeleteReply(postId?: Id<'posts'>) {
  const baseMutation = useMutation(replyMutations.deleteReply);
  const { toast } = useToast();

  // Create mutation with optimistic update if postId is provided
  const deleteReply = useMemo(() => {
    if (!postId) {
      return baseMutation;
    }

    return baseMutation.withOptimisticUpdate((localStore, args) => {
      const currentData = localStore.getQuery(replyQueries.getRepliesByPost, {
        postId,
      });

      if (currentData === undefined) {
        return;
      }

      // Remove the reply from the cache
      const filteredReplies = currentData.replies.filter(
        (reply: { _id: Id<'replies'> }) => reply._id !== args.replyId
      );

      localStore.setQuery(
        replyQueries.getRepliesByPost,
        { postId },
        {
          ...currentData,
          replies: filteredReplies,
        }
      );
    });
  }, [baseMutation, postId]);

  return useCallback(
    async (replyId: Id<'replies'>) => {
      try {
        const result = await deleteReply({ replyId });

        // No success toast - instant removal is feedback enough
        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete reply. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [deleteReply, toast]
  );
}

// ===== NOTIFICATION MUTATIONS =====

/**
 * Mark post notifications as read
 */
export function useMarkPostNotificationsAsRead() {
  const markAsRead = useMutation(
    notificationMutations.markPostNotificationsAsRead
  );

  return useCallback(
    async (postId: Id<'posts'>) => {
      try {
        await markAsRead({ postId });
      } catch (error) {
        // Silent fail for notification marking
        console.warn('Failed to mark notifications as read:', error);
      }
    },
    [markAsRead]
  );
}

// ===== COMBINED HOOKS =====

/**
 * Complete reply management for a post with optimistic updates
 * Pass currentUser for instant optimistic UI updates
 */
export function usePostReplies(
  postId: Id<'posts'>,
  currentUser?: OptimisticUserData
) {
  const repliesData = useRepliesByPost(postId);

  const createReply = useCreateReply(currentUser);
  const updateReply = useUpdateReply(postId);
  const deleteReply = useDeleteReply(postId);

  const createReplyWithPostId = useCallback(
    async (text: string) => {
      return createReply({ postId, text });
    },
    [postId, createReply]
  );

  return {
    // Data
    replies: repliesData?.replies || [],

    // Loading state
    isLoading: repliesData === undefined,

    // Actions
    createReply: createReplyWithPostId,
    updateReply,
    deleteReply,
  };
}
