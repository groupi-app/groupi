import * as z from "zod";

export const postPatchSchema = z.object({
  title: z.string().max(128),

  // TODO: Type this properly from editorjs block types?
  content: z.any(),
  authorId: z.string(),
});
