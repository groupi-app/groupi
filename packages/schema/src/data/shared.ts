/* eslint-disable no-redeclare */
import { z } from 'zod';

// ============================================================================
// SHARED/GENERIC DATA TYPES
// ============================================================================

/**
 * Generic paginated data structure for admin list views
 */
export const createPaginatedData = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().optional(),
    totalCount: z.number(),
  });

export type PaginatedData<T> = {
  items: T[];
  nextCursor?: string;
  totalCount: number;
};

/**
 * Standard operation success result
 */
export const OperationResult = z.object({
  message: z.string(),
});

export type OperationResult = z.infer<typeof OperationResult>;

/**
 * Standard operation success with optional data
 */
export const createOperationResult = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    message: z.string(),
    data: dataSchema.optional(),
  });
