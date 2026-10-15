import { v } from 'convex/values';
import { recipientSkipReason } from '../eventInvites/contracts';

const profileFields = {
  personId: v.id('persons'),
  name: v.union(v.string(), v.null()),
  username: v.union(v.string(), v.null()),
  image: v.union(v.string(), v.null()),
};
export const listPerson = v.object({
  ...profileFields,
  available: v.boolean(),
});
export const selectablePerson = v.object({
  ...profileFields,
  available: v.literal(true),
});
const summaryFields = {
  inviteListId: v.id('inviteLists'),
  name: v.string(),
  personCount: v.number(),
  availablePersonCount: v.number(),
  needsAttention: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
};
export const listSummary = v.object(summaryFields);
export const listDetail = v.object({
  ...summaryFields,
  people: v.array(listPerson),
});
export const listCollection = v.object({ items: v.array(listSummary) });
export const peopleCollection = v.object({ items: v.array(selectablePerson) });
export const currentPeopleCollection = v.object({ items: v.array(listPerson) });
export const deleteResult = v.object({
  deleted: v.literal(true),
  inviteListId: v.id('inviteLists'),
});
export const reviewedPerson = v.union(
  v.object({
    ...profileFields,
    available: v.boolean(),
    status: v.literal('eligible'),
  }),
  v.object({
    ...profileFields,
    available: v.boolean(),
    status: v.literal('skipped'),
    reason: recipientSkipReason,
  })
);
export const reviewResult = v.object({
  eventId: v.id('events'),
  totalCount: v.number(),
  eligibleCount: v.number(),
  skippedCount: v.number(),
  results: v.array(reviewedPerson),
});
export const sendFields = {
  eventId: v.id('events'),
  role: v.optional(v.union(v.literal('ATTENDEE'), v.literal('MODERATOR'))),
  message: v.optional(v.string()),
};
export const snapshotSendArgs = v.object({
  ...sendFields,
  personIds: v.array(v.id('persons')),
  requestId: v.string(),
});
export const listSendArgs = v.object({
  ...sendFields,
  inviteListId: v.id('inviteLists'),
  requestId: v.optional(v.string()),
});
export const sendBody = v.union(
  v.object({
    ...sendFields,
    kind: v.literal('snapshot'),
    personIds: v.array(v.id('persons')),
  }),
  v.object({
    ...sendFields,
    kind: v.literal('list'),
    inviteListId: v.id('inviteLists'),
  })
);
export const sentPerson = v.union(
  v.object({
    personId: v.id('persons'),
    status: v.literal('sent'),
    inviteId: v.id('eventInvites'),
  }),
  v.object({
    personId: v.id('persons'),
    status: v.literal('skipped'),
    reason: recipientSkipReason,
  })
);
export const sendResult = v.object({
  eventId: v.id('events'),
  totalCount: v.number(),
  sentCount: v.number(),
  skippedCount: v.number(),
  results: v.array(sentPerson),
});
