import { v } from 'convex/values';
import type { QueryCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { getPersonWithUser } from '../auth';

export const discussionAuthor = v.union(
  v.object({
    id: v.union(v.id('persons'), v.id('authorizationPrincipals')),
    kind: v.optional(v.union(v.literal('user'), v.literal('integration'))),
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
export async function getDiscussionActorWithUser(ctx: QueryCtx, id: string) {
  const integrationId = ctx.db.normalizeId('authorizationPrincipals', id);
  if (integrationId) {
    const integration = await ctx.db.get(integrationId);
    if (!integration || integration.kind !== 'integration') return null;
    return {
      kind: 'integration' as const,
      person: { _id: integration._id },
      user: {
        _id: integration._id,
        name: integration.name,
        email: null,
        image: null,
        username: null,
      },
    };
  }
  const data = await getPersonWithUser(ctx, id);
  return data ? { ...data, kind: 'user' as const } : null;
}
export async function readDiscussionAuthor(
  ctx: QueryCtx,
  personId: Id<'persons'> | Id<'authorizationPrincipals'>
) {
  const data = await getDiscussionActorWithUser(ctx, personId);
  if (!data) return null;
  return {
    id: data.person._id,
    kind: data.kind,
    user: {
      id: data.user._id,
      name: data.user.name ?? null,
      email: data.user.email ?? null,
      image: data.user.image ?? null,
      username: data.user.username ?? null,
    },
  };
}
