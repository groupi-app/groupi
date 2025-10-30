/* eslint-disable no-redeclare */
import { z } from 'zod';
import { ReplySchema, UserSchema } from '../generated';

// ============================================================================
// REPLY DOMAIN DATA DTOS
// ============================================================================

// Basic reply DTO
export const ReplyDTO = ReplySchema.pick({
  id: true,
  text: true,
  authorId: true,
  postId: true,
  createdAt: true,
  updatedAt: true,
});

export type ReplyDTO = z.infer<typeof ReplyDTO>;

// Reply with author DTO
export const ReplyWithAuthorDTO = ReplyDTO.extend({
  author: z.object({
    id: z.string(),
    user: UserSchema.pick({
      name: true,
      email: true,
      image: true,
    }),
  }),
});

export type ReplyWithAuthorDTO = z.infer<typeof ReplyWithAuthorDTO>;

// Reply feed DTO - for displaying reply lists
export const ReplyFeedDTO = z.array(ReplyWithAuthorDTO);
export type ReplyFeedDTO = z.infer<typeof ReplyFeedDTO>;

// ============================================================================
// ADMIN-SPECIFIC DTOS
// ============================================================================

// Reply admin list item DTO - for admin dashboard
export const ReplyAdminListItemDTO = ReplySchema.pick({
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

export type ReplyAdminListItemDTO = z.infer<typeof ReplyAdminListItemDTO>;
