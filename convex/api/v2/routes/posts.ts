import { createDiscussionRoutes } from './discussion';
export function createPostRoutes() {
  return createDiscussionRoutes('posts');
}
