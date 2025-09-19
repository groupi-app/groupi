import { z } from 'zod';

export const OperationSuccessSchema = z.object({
  message: z.string(),
});

export const BatchPayloadSchema = z.object({
  count: z.number(),
});
