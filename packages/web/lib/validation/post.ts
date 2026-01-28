import * as z from 'zod';

export const postPatchSchema = z.object({
  title: z.string().max(128),

  // Content is HTML string from TipTap editor
  content: z.string(),
  authorId: z.string(),
});
