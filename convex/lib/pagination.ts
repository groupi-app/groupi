import type { PaginationResult } from 'convex/server';

/** Keep domain page contracts independent of Convex's optional split metadata. */
export function publicPage<T>(result: PaginationResult<T>) {
  return {
    page: result.page,
    isDone: result.isDone,
    continueCursor: result.continueCursor,
  };
}
