import { createTRPCRouter } from './trpc';
import { notificationRouter } from './routers/notification';
import { personRouter } from './routers/person';
import { eventRouter } from './routers/event';
import { memberRouter } from './routers/member';
import { inviteRouter } from './routers/invite';
import { postRouter } from './routers/post';
import { availabilityRouter } from './routers/availability';
import { replyRouter } from './routers/reply';
import { settingsRouter } from './routers/settings';

/**
 * Main tRPC router for the Groupi API
 *
 * All procedures return [error, result] tuples from safe-wrapper services
 * Components handle these tuples directly for consistent error handling
 */
export const appRouter = createTRPCRouter({
  notification: notificationRouter,
  person: personRouter,
  event: eventRouter,
  member: memberRouter,
  invite: inviteRouter,
  post: postRouter,
  availability: availabilityRouter,
  reply: replyRouter,
  settings: settingsRouter,
});

/**
 * Export the app router type for use in client setup
 */
export type AppRouter = typeof appRouter;
