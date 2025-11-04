/* eslint-disable no-redeclare */
import { z } from 'zod';
import { ReplySchema, UserSchema } from '../generated';

// ============================================================================
// REPLY DOMAIN DATA TYPES
// ============================================================================

// Basic reply data
export const ReplyData = ReplySchema.pick({
  id: true,
  text: true,
  authorId: true,
  postId: true,
  createdAt: true,
  updatedAt: true,
});

export type ReplyData = z.infer<typeof ReplyData>;

// Reply with author data
export const ReplyWithAuthorData = ReplyData.extend({
  author: z.object({
    id: z.string(),
    user: UserSchema.pick({
      name: true,
      email: true,
      image: true,
    }),
  }),
});

export type ReplyWithAuthorData = z.infer<typeof ReplyWithAuthorData>;

// Reply feed data - for displaying reply lists
export const ReplyFeedData = z.array(ReplyWithAuthorData);
export type ReplyFeedData = z.infer<typeof ReplyFeedData>;

// ============================================================================
// ADMIN-SPECIFIC DATA TYPES
// ============================================================================

// Reply admin list item data - for admin dashboard
export const ReplyAdminListItemData = ReplySchema.pick({
  id: true,
  text: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  author: UserSchema.pick({
    id: true,
    name: true,
    email: true,
  }),
  post: z.object({
    id: z.string(),
    title: z.string(),
    event: z.object({
      id: z.string(),
      title: z.string(),
    }),
  }),
});

export type ReplyAdminListItemData = z.infer<typeof ReplyAdminListItemData>;
