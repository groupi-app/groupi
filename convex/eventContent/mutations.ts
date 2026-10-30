import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { visibility } from '../groupTools/contracts';
import { configInput as formConfig } from '../groupForms/contracts';
import { configInput as pollConfig } from '../groupPolls/contracts';
import { config as listConfig } from '../groupLists/contracts';
import * as forms from '../groupForms/model';
import * as polls from '../groupPolls/model';
import * as lists from '../groupLists/model';

/** Event adapters reuse the same persisted interaction models as Groups. */
export const createForm = mutation({
  args: {
    eventId: v.id('events'),
    ...formConfig,
    resultsVisibility: visibility,
  },
  returns: v.id('groupTools'),
  handler: async (ctx, args) =>
    forms.create(ctx, (await requireAuth(ctx)).person._id, args),
});
export const createPoll = mutation({
  args: {
    eventId: v.id('events'),
    ...pollConfig,
    resultsVisibility: visibility,
  },
  returns: v.id('groupTools'),
  handler: async (ctx, args) =>
    polls.create(ctx, (await requireAuth(ctx)).person._id, args),
});
export const createList = mutation({
  args: {
    eventId: v.id('events'),
    ...listConfig,
    resultsVisibility: visibility,
  },
  returns: v.id('groupTools'),
  handler: async (ctx, args) =>
    lists.create(ctx, (await requireAuth(ctx)).person._id, args),
});
