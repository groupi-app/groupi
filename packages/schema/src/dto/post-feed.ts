import { z } from 'zod';
import {
  EventSchema,
  PostSchema,
  PersonSchema,
  MembershipSchema,
  RoleSchema,
} from '../generated';
import { createResultTuple } from '../result-tuple';

// ============================================================================
// POST FEED COMPONENT SCHEMAS
// ============================================================================

/**
 * Schema for the PostFeed component data
 * Contains only the fields needed for displaying posts
 * Based on generated Prisma schemas
 */
export const PostFeedDataSchema = z.object({
  event: EventSchema.pick({
    id: true,
    chosenDateTime: true,
  }).extend({
    posts: z.array(
      PostSchema.pick({
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      }).extend({
        author: PersonSchema.pick({
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          imageUrl: true,
        }),
        _count: z.object({
          replies: z.number(),
        }),
      })
    ),
  }),
  userMembership: MembershipSchema.pick({
    id: true,
    role: true,
  }),
});

export type PostFeedData = z.infer<typeof PostFeedDataSchema>;

// ============================================================================
// ERROR TYPES
// ============================================================================

export const PostFeedErrorSchema = z.discriminatedUnion('_tag', [
  z.object({
    _tag: z.literal('EventNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('EventUserNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('EventUserNotMemberError'),
    message: z.string(),
  }),
]);

export type PostFeedError = z.infer<typeof PostFeedErrorSchema>;

// ============================================================================
// RESULT TUPLE - Discriminated Union (Error OR Data, never both, never neither)
// ============================================================================

export const PostFeedResultSchema = createResultTuple(
  PostFeedErrorSchema,
  PostFeedDataSchema
);

export type PostFeedResult = z.infer<typeof PostFeedResultSchema>;
