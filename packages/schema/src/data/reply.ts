/* eslint-disable no-redeclare */
import { z } from 'zod';
import { ReplySchema, PersonSchema } from '../generated';

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
  author: PersonSchema.pick({
    id: true,
    firstName: true,
    lastName: true,
    username: true,
    imageUrl: true,
  }),
});

export type ReplyWithAuthorDTO = z.infer<typeof ReplyWithAuthorDTO>;

// Reply feed DTO - for displaying reply lists
export const ReplyFeedDTO = z.array(ReplyWithAuthorDTO);
export type ReplyFeedDTO = z.infer<typeof ReplyFeedDTO>;
