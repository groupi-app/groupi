/**
 * Type abstractions for Convex integration
 * Allows the shared package to work with any Convex schema
 *
 * These are intentionally typed as 'any' because:
 * 1. The shared package must work with any Convex schema without knowing the exact types
 * 2. The consuming app (web/mobile) provides the actual typed API at runtime
 * 3. Using 'unknown' would require extensive casting throughout the codebase
 */

import type { FunctionReference } from 'convex/server';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Generic types that will be provided by the consuming app
export type ConvexApi = any;
export type ConvexDataModel = any;
export type ConvexId<T extends string> = string & { __tableName: T };

// Hook type helpers - simplified for cross-platform compatibility
export type ConvexQuery<T = unknown> = T;
export type ConvexMutation<T = unknown> = (...args: unknown[]) => Promise<T>;
/* eslint-enable @typescript-eslint/no-explicit-any */

type PublicMutation<Args extends object, Result> = FunctionReference<
  'mutation',
  'public',
  Args & Record<string, unknown>,
  Result
>;

export interface TracedMutationArgs {
  _traceId?: string;
}

export interface AttachmentMutationInput {
  storageId: ConvexId<'_storage'>;
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  isSpoiler?: boolean;
  altText?: string;
}

/**
 * The generated Convex API surface required by the shared post action hooks.
 * Keeping this domain contract explicit prevents a renamed module or changed
 * mutation payload from being hidden behind the broader `ConvexApi` escape
 * hatch used by the legacy shared hooks.
 */
export interface PostActionApi {
  posts: {
    mutations: {
      createPost: PublicMutation<
        TracedMutationArgs & {
          eventId: ConvexId<'events'>;
          title: string;
          content: string;
          attachments?: AttachmentMutationInput[];
        },
        { postId: ConvexId<'posts'>; post: unknown }
      >;
      updatePost: PublicMutation<
        TracedMutationArgs & {
          postId: ConvexId<'posts'>;
          title?: string;
          content?: string;
        },
        { post: unknown }
      >;
      deletePost: PublicMutation<
        TracedMutationArgs & { postId: ConvexId<'posts'> },
        { success: boolean }
      >;
    };
  };
  replies: {
    mutations: {
      createReply: PublicMutation<
        TracedMutationArgs & {
          postId: ConvexId<'posts'>;
          text: string;
          attachments?: AttachmentMutationInput[];
        },
        { replyId: ConvexId<'replies'> }
      >;
      updateReply: PublicMutation<
        TracedMutationArgs & { replyId: ConvexId<'replies'>; text: string },
        { reply: unknown }
      >;
      deleteReply: PublicMutation<
        TracedMutationArgs & { replyId: ConvexId<'replies'> },
        { success: boolean }
      >;
    };
  };
}

// Status and role enums (duplicated to avoid dependencies)
export type Status = 'YES' | 'MAYBE' | 'NO' | 'PENDING';
export type Role = 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
export type NotificationType =
  | 'EVENT_INVITE'
  | 'POST_MENTION'
  | 'EVENT_UPDATE'
  | 'POST_REPLY'
  | 'AVAILABILITY_REMINDER';

export const ConvexEnums = {
  Status: {
    YES: 'YES' as const,
    MAYBE: 'MAYBE' as const,
    NO: 'NO' as const,
    PENDING: 'PENDING' as const,
  },
  Role: {
    ORGANIZER: 'ORGANIZER' as const,
    MODERATOR: 'MODERATOR' as const,
    ATTENDEE: 'ATTENDEE' as const,
  },
  NotificationType: {
    EVENT_INVITE: 'EVENT_INVITE' as const,
    POST_MENTION: 'POST_MENTION' as const,
    EVENT_UPDATE: 'EVENT_UPDATE' as const,
    POST_REPLY: 'POST_REPLY' as const,
    AVAILABILITY_REMINDER: 'AVAILABILITY_REMINDER' as const,
  },
} as const;
