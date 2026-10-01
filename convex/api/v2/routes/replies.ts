import { createDiscussionRoutes } from './discussion';
export function createReplyRoutes() {
  return createDiscussionRoutes('replies');
}
