import { ConvexError, v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth } from '../auth';
import {
  listCollection,
  listDetail,
  peopleCollection,
  reviewResult,
  currentPeopleCollection,
} from './contracts';
import { reviewRecipientsForPerson } from './sending';
import {
  getListForPerson,
  listListsForPerson,
  searchPeopleForPerson,
  friendChoicesForPerson,
  resolvePeople,
} from './model';

export const getPeopleByIds = query({
  args: { personIds: v.array(v.id('persons')) },
  returns: currentPeopleCollection,
  handler: async (ctx, { personIds }) => {
    await requireAuth(ctx);
    const ids = [...new Set(personIds)];
    if (ids.length > 100)
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Choose at most 100 distinct people',
      });
    return { items: await resolvePeople(ctx, ids) };
  },
});

export const listInviteLists = query({
  args: {},
  returns: listCollection,
  handler: async ctx => {
    const { person } = await requireAuth(ctx);
    return listListsForPerson(ctx, person._id);
  },
});

export const getInviteList = query({
  args: { inviteListId: v.id('inviteLists') },
  returns: listDetail,
  handler: async (ctx, { inviteListId }) => {
    const { person } = await requireAuth(ctx);
    return getListForPerson(ctx, person._id, inviteListId);
  },
});

export const searchPeople = query({
  args: { searchTerm: v.string() },
  returns: peopleCollection,
  handler: async (ctx, { searchTerm }) => {
    const { person } = await requireAuth(ctx);
    return searchPeopleForPerson(ctx, person._id, searchTerm);
  },
});

export const getFriendChoices = query({
  args: {},
  returns: peopleCollection,
  handler: async ctx => {
    const { person } = await requireAuth(ctx);
    return friendChoicesForPerson(ctx, person._id);
  },
});
export const reviewInviteListRecipients = query({
  args: { eventId: v.id('events'), personIds: v.array(v.id('persons')) },
  returns: reviewResult,
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    return reviewRecipientsForPerson(ctx, person._id, args);
  },
});
