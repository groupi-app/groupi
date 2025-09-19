import { z } from 'zod';
import { ReplySchema } from '../generated';

export const ReplyListItemDTO = ReplySchema.pick({
  id: true,
  text: true,
  authorId: true,
  postId: true,
  createdAt: true,
  updatedAt: true,
});

export const ReplyListDTO = z.object({
  items: z.array(ReplyListItemDTO),
  nextCursor: z.string().optional(),
});
export type ReplyListDTO = z.infer<typeof ReplyListDTO>;
