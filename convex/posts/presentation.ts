import { v } from 'convex/values';
import type { QueryCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { getPersonWithUser } from '../auth';

export const discussionAuthor = v.union(
  v.object({
    id: v.id('persons'),
    user: v.object({
      id: v.string(),
      name: v.union(v.string(), v.null()),
      email: v.union(v.string(), v.null()),
      image: v.union(v.string(), v.null()),
      username: v.union(v.string(), v.null()),
    }),
  }),
  v.null()
);

/** Author projection shared by discussion transport adapters. */
export async function readDiscussionAuthor(
  ctx: QueryCtx,
  personId: Id<'persons'>
) {
  const data = await getPersonWithUser(ctx, personId);
  if (!data) return null;
  return {
    id: data.person._id,
    user: {
      id: data.user._id,
      name: data.user.name ?? null,
      email: data.user.email ?? null,
      image: data.user.image ?? null,
      username: data.user.username ?? null,
    },
  };
}
