/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  PostSchema,
  ReplySchema,
  UserSchema,
  EventSchema,
  MembershipSchema,
} from '../generated';

// ============================================================================
// POST DOMAIN DATA TYPES
// ============================================================================

// Basic post data
export const PostData = PostSchema.pick({
  id: true,
  title: true,
  content: true,
  authorId: true,
  eventId: true,
  createdAt: true,
  updatedAt: true,
  editedAt: true,
});

export type PostData = z.infer<typeof PostData>;

// Post with author data
export const PostWithAuthorData = PostData.extend({
  author: z.object({
    id: z.string(),
    user: UserSchema.pick({
      name: true,
      email: true,
      image: true,
      username: true,
    }),
  }),
});

export type PostWithAuthorData = z.infer<typeof PostWithAuthorData>;

// Post card data - for post lists and feeds (inline in PostFeedData)
const PostCardData = PostWithAuthorData.extend({
  replyCount: z.number(),
  replies: z.array(
    ReplySchema.pick({
      id: true,
      createdAt: true,
      updatedAt: true,
    }).extend({
      author: z.object({
        id: z.string(),
        user: UserSchema.pick({
          name: true,
          email: true,
          image: true,
          username: true,
        }),
      }),
    })
  ),
});

// Post detail data - for post detail pages
export const PostDetailData = PostWithAuthorData.extend({
  replies: z.array(
    ReplySchema.pick({
      id: true,
      text: true,
      createdAt: true,
      updatedAt: true,
    }).extend({
      author: z.object({
        id: z.string(),
        user: UserSchema.pick({
          name: true,
          email: true,
          image: true,
        }),
      }),
    })
  ),
  event: EventSchema.pick({
    id: true,
    title: true,
    chosenDateTime: true,
  }).extend({
    memberships: z.array(
      MembershipSchema.pick({
        id: true,
        role: true,
        rsvpStatus: true,
        personId: true,
        eventId: true,
      }).extend({
        person: z.object({
          id: z.string(),
          createdAt: z.date(),
          updatedAt: z.date(),
          user: UserSchema.pick({
            name: true,
            email: true,
            image: true,
            username: true,
          }),
        }),
      })
    ),
  }),
});

export type PostDetailData = z.infer<typeof PostDetailData>;

// Post feed data - for event post feeds
export const PostFeedData = z.object({
  event: EventSchema.pick({
    id: true,
    chosenDateTime: true,
  }).extend({
    posts: z.array(PostCardData),
    memberships: z.array(
      MembershipSchema.pick({
        id: true,
        role: true,
        rsvpStatus: true,
        personId: true,
        eventId: true,
      }).extend({
        person: z.object({
          id: z.string(),
          createdAt: z.date(),
          updatedAt: z.date(),
          user: UserSchema.pick({
            name: true,
            email: true,
            image: true,
            username: true,
          }),
        }),
      })
    ),
  }),
  userMembership: z.object({
    id: z.string(),
    role: z.enum(['ORGANIZER', 'MODERATOR', 'ATTENDEE']),
  }),
});

export type PostFeedData = z.infer<typeof PostFeedData>;

// ============================================================================
// PAGE-SPECIFIC DATA TYPES
// ============================================================================

// Post detail page data
export const PostDetailPageData = z.object({
  post: PostDetailData,
  userMembership: MembershipSchema.pick({
    id: true,
    role: true,
    personId: true,
  }),
});

export type PostDetailPageData = z.infer<typeof PostDetailPageData>;

// ============================================================================
// ADMIN-SPECIFIC DATA TYPES
// ============================================================================

// Post admin list item data - for admin dashboard
export const PostAdminListItemData = PostSchema.pick({
  id: true,
  title: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  editedAt: true,
}).extend({
  author: UserSchema.pick({
    id: true,
    name: true,
    email: true,
  }),
  event: EventSchema.pick({
    id: true,
    title: true,
  }),
  _count: z.object({
    replies: z.number(),
  }),
});

export type PostAdminListItemData = z.infer<typeof PostAdminListItemData>;
