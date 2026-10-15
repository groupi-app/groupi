import { ConvexError, v } from 'convex/values';
import { sendListForPerson } from './sending';
import { internalMutation, internalQuery } from '../_generated/server';
import {
  listCollection,
  listDetail,
  peopleCollection,
  deleteResult,
  sendResult,
} from './contracts';
import {
  createListForPerson,
  getListForPerson,
  listListsForPerson,
  searchPeopleForPerson,
  friendChoicesForPerson,
  updateListForPerson,
  deleteListForPerson,
} from './model';

export const create = internalMutation({
  args: {
    creatorId: v.id('persons'),
    name: v.string(),
    personIds: v.array(v.string()),
  },
  returns: listDetail,
  handler: async (ctx, { creatorId, name, personIds }) => {
    const ids = personIds.map(id => {
      const personId = ctx.db.normalizeId('persons', id);
      if (!personId)
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: 'Invite lists can contain only existing users',
        });
      return personId;
    });
    return createListForPerson(ctx, creatorId, { name, personIds: ids });
  },
});
export const update = internalMutation({
  args: {
    creatorId: v.id('persons'),
    inviteListId: v.string(),
    name: v.optional(v.string()),
    personIds: v.optional(v.array(v.string())),
  },
  returns: listDetail,
  handler: async (ctx, { creatorId, inviteListId, name, personIds }) => {
    const id = ctx.db.normalizeId('inviteLists', inviteListId);
    if (!id)
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Invite list not found',
      });
    // Ownership is checked before interpreting any submitted identities.
    await getListForPerson(ctx, creatorId, id);
    const ids = personIds?.map(value => {
      const personId = ctx.db.normalizeId('persons', value);
      if (!personId)
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: 'Invite lists can contain only existing users',
        });
      return personId;
    });
    return updateListForPerson(ctx, creatorId, {
      inviteListId: id,
      name,
      personIds: ids,
    });
  },
});
export const remove = internalMutation({
  args: { creatorId: v.id('persons'), inviteListId: v.string() },
  returns: deleteResult,
  handler: (ctx, { creatorId, inviteListId }) => {
    const id = ctx.db.normalizeId('inviteLists', inviteListId);
    if (!id)
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Invite list not found',
      });
    return deleteListForPerson(ctx, creatorId, id);
  },
});
export const list = internalQuery({
  args: { creatorId: v.id('persons') },
  returns: listCollection,
  handler: (ctx, { creatorId }) => listListsForPerson(ctx, creatorId),
});
export const get = internalQuery({
  args: { creatorId: v.id('persons'), inviteListId: v.string() },
  returns: listDetail,
  handler: (ctx, { creatorId, inviteListId }) => {
    const id = ctx.db.normalizeId('inviteLists', inviteListId);
    if (!id)
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Invite list not found',
      });
    return getListForPerson(ctx, creatorId, id);
  },
});
export const searchPeople = internalQuery({
  args: { personId: v.id('persons'), searchTerm: v.string() },
  returns: peopleCollection,
  handler: (ctx, { personId, searchTerm }) =>
    searchPeopleForPerson(ctx, personId, searchTerm),
});
export const friendChoices = internalQuery({
  args: { personId: v.id('persons') },
  returns: peopleCollection,
  handler: (ctx, { personId }) => friendChoicesForPerson(ctx, personId),
});
export const inviteToEvent = internalMutation({
  args: {
    personId: v.id('persons'),
    userId: v.string(),
    inviteListId: v.string(),
    eventId: v.string(),
    role: v.optional(v.union(v.literal('ATTENDEE'), v.literal('MODERATOR'))),
    message: v.optional(v.string()),
    requestId: v.optional(v.string()),
  },
  returns: sendResult,
  handler: async (
    ctx,
    { personId, userId, inviteListId, eventId, ...args }
  ) => {
    const listId = ctx.db.normalizeId('inviteLists', inviteListId);
    if (!listId)
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Invite list not found',
      });
    const event = ctx.db.normalizeId('events', eventId);
    if (!event)
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid event ID',
      });
    return sendListForPerson(
      ctx,
      personId,
      { ...args, inviteListId: listId, eventId: event },
      userId
    );
  },
});
