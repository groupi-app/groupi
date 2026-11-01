import { ConvexError } from 'convex/values';

/** Public creation/retry is retired; historical internal queue workers remain independent. */
export function rejectAnnouncementSend(): never {
  throw new ConvexError({
    code: 'CONFLICT',
    message: 'Announcements have been retired. Use a post to share an update.',
  });
}
