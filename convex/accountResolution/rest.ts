import { internalMutation, internalQuery } from '../_generated/server';
import { paginationOptsValidator } from 'convex/server';
import { ConvexError, v } from 'convex/values';
import { authComponent, type AuthUserId } from '../auth';
import { deleteResolvedAccount } from '../users/mutations';
import * as contracts from './contracts';
import * as model from './model';
export const listOwned = internalQuery({
  args: {
    personId: v.id('persons'),
    kind: contracts.kind,
    paginationOpts: paginationOptsValidator,
  },
  returns: contracts.page,
  handler: (ctx, args) =>
    model.listForPerson(ctx, args.personId, args.kind, args.paginationOpts),
});
export const readiness = internalQuery({
  args: { personId: v.id('persons') },
  returns: contracts.readiness,
  handler: (ctx, args) => model.readinessForPerson(ctx, args.personId),
});
export const deleteAccount = internalMutation({
  args: {
    personId: v.id('persons'),
    userId: v.string(),
    confirmation: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const person = await ctx.db.get(args.personId);
    const user = await authComponent.getAnyUserById(
      ctx,
      args.userId as AuthUserId
    );
    if (!person || person.userId !== args.userId || !user || user.banned)
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Current eligible account required.',
      });
    if (
      !user.username ||
      args.confirmation.trim().toLowerCase() !==
        user.username.trim().toLowerCase()
    )
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Type your current username to confirm account deletion.',
      });
    return deleteResolvedAccount(ctx, person, user);
  },
});
export const deleteOwnedEvent = internalMutation({
  args: { personId: v.id('persons'), eventId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const eventId = ctx.db.normalizeId('events', args.eventId);
    if (!eventId)
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid Event ID.',
      });
    return model.deleteOwnedEventForPerson(ctx, args.personId, eventId);
  },
});
