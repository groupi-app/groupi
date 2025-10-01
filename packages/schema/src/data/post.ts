/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  PostSchema,
  ReplySchema,
  PersonSchema,
  EventSchema,
  MembershipSchema,
} from '../generated';

// ============================================================================
// POST DOMAIN DATA DTOS
// ============================================================================

// Basic post DTO
export const PostDTO = PostSchema.pick({
  id: true,
  title: true,
  content: true,
  authorId: true,
  eventId: true,
  createdAt: true,
  updatedAt: true,
  editedAt: true,
});

export type PostDTO = z.infer<typeof PostDTO>;

// Post with author DTO
export const PostWithAuthorDTO = PostDTO.extend({
  author: PersonSchema.pick({
    id: true,
    firstName: true,
    lastName: true,
    username: true,
    imageUrl: true,
  }),
});

export type PostWithAuthorDTO = z.infer<typeof PostWithAuthorDTO>;

// Post card DTO - for post lists and feeds
export const PostCardDTO = PostWithAuthorDTO.extend({
  replyCount: z.number(),
  replies: z.array(
    ReplySchema.pick({
      id: true,
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
});

export type PostCardDTO = z.infer<typeof PostCardDTO>;

// Post detail DTO - for post detail pages
export const PostDetailDTO = PostWithAuthorDTO.extend({
  replies: z.array(
    ReplySchema.pick({
      id: true,
      text: true,
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
  event: EventSchema.pick({
    id: true,
    title: true,
    chosenDateTime: true,
  }),
});

export type PostDetailDTO = z.infer<typeof PostDetailDTO>;

// Post feed DTO - for event post feeds
export const PostFeedDTO = z.object({
  event: EventSchema.pick({
    id: true,
    chosenDateTime: true,
  }).extend({
    posts: z.array(PostCardDTO),
    memberships: z.array(
      MembershipSchema.pick({
        id: true,
        role: true,
        rsvpStatus: true,
        personId: true,
        eventId: true,
      }).extend({
        person: PersonSchema.pick({
          id: true,
          createdAt: true,
          updatedAt: true,
          firstName: true,
          lastName: true,
          username: true,
          imageUrl: true,
        }),
      })
    ),
  }),
  userMembership: z.object({
    id: z.string(),
    role: z.enum(['ORGANIZER', 'MODERATOR', 'ATTENDEE']),
  }),
});

export type PostFeedDTO = z.infer<typeof PostFeedDTO>;

// ============================================================================
// PAGE-SPECIFIC DATA TYPES
// ============================================================================

// Post detail page DTO
export const PostDetailPageDTO = z.object({
  post: PostDetailDTO,
  userMembership: MembershipSchema.pick({
    id: true,
    role: true,
    personId: true,
  }),
});

export type PostDetailPageDTO = z.infer<typeof PostDetailPageDTO>;
