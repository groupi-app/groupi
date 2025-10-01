/**
 * Utility functions for working with tRPC query keys
 */

/**
 * Creates a predicate function to check if a query key matches specific tRPC router names
 *
 * tRPC query keys have the structure: [['router', 'procedure'], { input, type }]
 * This utility helps create proper predicates for query invalidation
 *
 * @param routerNames - Array of router names to match against
 * @returns Predicate function for use with React Query
 *
 * @example
 * // Single router
 * queryClient.invalidateQueries({
 *   predicate: createTRPCRouterPredicate(['invite'])
 * });
 *
 * // Multiple routers
 * queryClient.invalidateQueries({
 *   predicate: createTRPCRouterPredicate(['invite', 'event', 'person'])
 * });
 */
export function createTRPCRouterPredicate(routerNames: string[]) {
  return (query: { queryKey: readonly unknown[] }) => {
    // tRPC query keys are nested: [['router', 'procedure'], { input, type }]
    const routerAndProcedure = query.queryKey[0];
    return (
      Array.isArray(routerAndProcedure) &&
      routerNames.includes(routerAndProcedure[0])
    );
  };
}

/**
 * Creates a predicate function to check if a query key matches a specific tRPC procedure
 *
 * @param router - Router name to match
 * @param procedure - Procedure name to match
 * @returns Predicate function for use with React Query
 *
 * @example
 * queryClient.invalidateQueries({
 *   predicate: createTRPCProcedurePredicate('invite', 'getEventInvitePageData')
 * });
 */
export function createTRPCProcedurePredicate(
  router: string,
  procedure: string
) {
  return (query: { queryKey: readonly unknown[] }) => {
    // tRPC query keys are nested: [['router', 'procedure'], { input, type }]
    const routerAndProcedure = query.queryKey[0];
    return (
      Array.isArray(routerAndProcedure) &&
      routerAndProcedure[0] === router &&
      routerAndProcedure[1] === procedure
    );
  };
}
