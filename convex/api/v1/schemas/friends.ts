import { z } from '@hono/zod-openapi';
import { TimestampSchema } from './common';

/**
 * Friends-related API schemas
 */

// Friendship status enum
export const FriendshipStatusSchema = z
  .enum([
    'none',
    'pending_sent',
    'pending_received',
    'friends',
    'declined',
    'self',
  ])
  .openapi({
    example: 'friends',
    description: 'Status of friendship between two users',
  });

// Friend summary (includes user info)
export const FriendSummarySchema = z
  .object({
    friendshipId: z.string(),
    personId: z.string(),
    userId: z.string(),
    name: z.string().nullable(),
    username: z.string().nullable(),
    image: z.string().nullable(),
    lastSeen: TimestampSchema.nullable(),
  })
  .openapi('FriendSummary');

// Friend request details
export const FriendRequestSchema = z
  .object({
    friendshipId: z.string(),
    personId: z.string(),
    userId: z.string(),
    name: z.string().nullable(),
    username: z.string().nullable(),
    image: z.string().nullable(),
    createdAt: TimestampSchema,
  })
  .openapi('FriendRequest');

// Search result for adding friends
export const UserSearchResultSchema = z
  .object({
    personId: z.string(),
    userId: z.string(),
    name: z.string().nullable(),
    username: z.string().nullable(),
    image: z.string().nullable(),
    friendshipStatus: FriendshipStatusSchema,
    friendshipId: z.string().nullable(),
  })
  .openapi('UserSearchResult');

// Friend list response
export const FriendListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(FriendSummarySchema),
  })
  .openapi('FriendListResponse');

// Friend requests list response
export const FriendRequestListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(FriendRequestSchema),
  })
  .openapi('FriendRequestListResponse');

// User search response
export const UserSearchResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(UserSearchResultSchema),
  })
  .openapi('UserSearchResponse');

// Send friend request request body
export const SendFriendRequestSchema = z
  .object({
    personId: z.string().openapi({
      description: 'Person ID of the user to send a friend request to',
    }),
  })
  .openapi('SendFriendRequest');

// Friend request response
export const FriendRequestResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      friendshipId: z.string(),
      status: z.enum(['PENDING', 'ACCEPTED']),
      message: z.string(),
    }),
  })
  .openapi('FriendRequestResponse');

// Accept/decline/cancel request response
export const FriendActionResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      message: z.string(),
    }),
  })
  .openapi('FriendActionResponse');

// Friendship status response
export const FriendshipStatusResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      status: FriendshipStatusSchema,
      friendshipId: z.string().nullable(),
    }),
  })
  .openapi('FriendshipStatusResponse');

// Friendship ID parameter
export const FriendshipIdParamSchema = z.object({
  friendshipId: z.string().openapi({
    example: 'k170xyz...',
    description: 'Friendship ID',
  }),
});

// Search query parameter
export const SearchQuerySchema = z.object({
  q: z.string().min(2).openapi({
    example: 'john',
    description: 'Search query (min 2 characters)',
  }),
});
