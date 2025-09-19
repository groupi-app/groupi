import { z } from 'zod';
import {
  PostSchema,
  ReplySchema,
  PersonSchema,
  EventSchema,
} from '../generated';
import { createResultTuple } from '../result-tuple';

// ============================================================================
// POST DETAIL COMPONENT SCHEMAS
// ============================================================================

/**
 * Schema for the PostDetail page (FullPost + Replies components)
 * Contains post data with replies and author information
 * Based on generated Prisma schemas
 */
export const PostDetailDataSchema = z.object({
  post: PostSchema.pick({
    id: true,
    title: true,
    content: true,
    createdAt: true,
    updatedAt: true,
    editedAt: true,
  }).extend({
    author: PersonSchema.pick({
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      imageUrl: true,
    }),
    event: EventSchema.pick({
      id: true,
      title: true,
      chosenDateTime: true,
    }),
    replies: z.array(
      ReplySchema.pick({
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
      })
    ),
    _count: z.object({
      replies: z.number(),
    }),
  }),
  userMembership: z.object({
    id: z.string(),
    role: z.enum(['ORGANIZER', 'MODERATOR', 'ATTENDEE']),
  }),
});

export type PostDetailData = z.infer<typeof PostDetailDataSchema>;

// ============================================================================
// ERROR TYPES
// ============================================================================

export const PostDetailErrorSchema = z.discriminatedUnion('_tag', [
  z.object({
    _tag: z.literal('PostNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('PostUserNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('PostUserNotMemberError'),
    message: z.string(),
  }),
]);

export type PostDetailError = z.infer<typeof PostDetailErrorSchema>;

// ============================================================================
// RESULT TUPLE - Discriminated Union (Error OR Data, never both, never neither)
// ============================================================================

export const PostDetailResultSchema = createResultTuple(
  PostDetailErrorSchema,
  PostDetailDataSchema
);

export type PostDetailResult = z.infer<typeof PostDetailResultSchema>;
