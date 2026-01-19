import { useQuery } from "convex/react";
import { FunctionReference } from "convex/server";

/**
 * Smart loading hook wrapper for Convex queries
 * Provides enhanced loading states and error handling
 */
export function useConvexQuery<
  Query extends FunctionReference<"query">,
  Args extends Record<string, unknown>
>(query: Query, args?: Args) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = useQuery(query, args as any);

  return {
    data: result,
    isLoading: result === undefined,
    isError: result === null,
    error: result === null ? new Error("Query failed") : null,
  };
}