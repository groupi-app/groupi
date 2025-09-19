/**
 * @groupi/api
 *
 * tRPC API package with safe-wrapper tuple pattern
 * Returns [error, result] tuples from services to components
 */

// Export the main app router and its type
export { appRouter, type AppRouter } from './root';

// Export tRPC setup utilities for app integration
export {
  createTRPCContext,
  type Context,
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  loggedProcedure,
  protectedLoggedProcedure,
} from './trpc';

// Export individual router types for granular imports if needed
export type { NotificationRouter } from './routers/notification';
export type { PersonRouter } from './routers/person';
export type { EventRouter } from './routers/event';
export type { MemberRouter } from './routers/member';
export type { InviteRouter } from './routers/invite';
export type { PostRouter } from './routers/post';
export type { AvailabilityRouter } from './routers/availability';
export type { ReplyRouter } from './routers/reply';
