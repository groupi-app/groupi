import { z } from 'zod';

/**
 * Standard operation success schema
 */
export const OperationSuccessSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
});

/**
 * Batch operation result schema
 */
export const BatchPayloadSchema = z.object({
  count: z.number(),
});
