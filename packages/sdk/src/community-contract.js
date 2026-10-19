/** Synthetic integration development data; never a live service adapter. */
export const communityContractVersion = 'red-room.v1';
const operationActions = {
  readOwnCommunityContext: 'groups.context.read',
  submitCommunityApplication: 'groups.applications.submit',
  editCommunityApplication: 'groups.applications.edit',
  withdrawCommunityApplication: 'groups.applications.withdraw',
  readCurrentCommunityEvent: 'groups.events.read',
  joinCommunityEvent: 'groups.events.join',
  setCommunityRsvp: 'groups.events.rsvp',
  leaveCommunityEvent: 'groups.events.leave',
  leaveCommunity: 'groups.leave',
  setCommunityAnnouncementPreference: 'groups.announcements.preferences.update',
  expelCommunityMember: 'groups.expulsions.create',
  reinstateCommunityMember: 'groups.expulsions.reinstate',
};
const op = (method, path, sdk, milestone, status = 'proposed') => ({
  action: operationActions[sdk],
  method,
  path,
  sdk,
  milestone,
  status,
});
export const communityOperations = Object.freeze({
  context: op(
    'GET',
    '/groups/{groupId}/community-context',
    'readOwnCommunityContext',
    'G1',
    'implemented'
  ),
  submitApplication: op(
    'POST',
    '/groups/{groupId}/community-applications',
    'submitCommunityApplication',
    'G3',
    'implemented'
  ),
  editApplication: op(
    'PATCH',
    '/groups/{groupId}/community-applications/{applicationId}',
    'editCommunityApplication',
    'G3',
    'implemented'
  ),
  withdrawApplication: op(
    'POST',
    '/groups/{groupId}/community-applications/{applicationId}/withdraw',
    'withdrawCommunityApplication',
    'G3',
    'implemented'
  ),
  currentEvent: op(
    'GET',
    '/groups/{groupId}/current-event',
    'readCurrentCommunityEvent',
    'G4',
    'implemented'
  ),
  joinEvent: op(
    'POST',
    '/groups/{groupId}/events/{eventId}/join',
    'joinCommunityEvent',
    'G5'
  ),
  rsvp: op(
    'PUT',
    '/groups/{groupId}/events/{eventId}/own-rsvp',
    'setCommunityRsvp',
    'G5'
  ),
  leaveEvent: op(
    'POST',
    '/groups/{groupId}/events/{eventId}/leave',
    'leaveCommunityEvent',
    'G5'
  ),
  leaveGroup: op(
    'POST',
    '/groups/{groupId}/community-leave',
    'leaveCommunity',
    'G5'
  ),
  preference: op(
    'PUT',
    '/groups/{groupId}/announcement-preference',
    'setCommunityAnnouncementPreference',
    'G7',
    'implemented'
  ),
  expel: op(
    'POST',
    '/groups/{groupId}/coordinated-expulsions',
    'expelCommunityMember',
    'G8',
    'implemented'
  ),
  reinstate: op(
    'POST',
    '/groups/{groupId}/coordinated-expulsions/{personId}/reinstate',
    'reinstateCommunityMember',
    'G9'
  ),
});
/** Proposed entries are not grantable scopes until the named implementation lands. */
export const communityActionCatalog = Object.freeze(
  Object.fromEntries(
    Object.values(communityOperations).map(operation => [
      operation.action,
      {
        status: operation.status,
        milestone: operation.milestone,
        applicant: !operation.action.startsWith('groups.expulsions.'),
      },
    ])
  )
);
const question = {
  id: 'welcome',
  label: 'What brings you here?',
  required: true,
  type: 'LONG_ANSWER',
};
const context = {
  contractVersion: communityContractVersion,
  group: { id: 'synthetic-red-room', name: 'Red Room' },
  form: { enabled: true, revision: 'synthetic-form-v2', questions: [question] },
  membership: null,
  eligibility: {
    canApply: true,
    canAccessMemberContent: false,
    banned: false,
    excluded: false,
  },
  applications: [],
  nextCursor: null,
  grantedActions: ['groups.context.read'],
  allowedActions: ['groups.context.read'],
  announcementPreference: { supported: true, subscribed: false },
};
const application = status => ({
  id: 'synthetic-application',
  status,
  revision: 2,
  questions: [{ ...question, label: 'Saved question wording' }],
  answers: { welcome: 'Synthetic response' },
  submittedAt: 1800000000000,
  decisions: [{ status, at: 1800000000001 }],
});
const fixture = (value, milestone = 'G1') => ({
  synthetic: true,
  status: ['G1', 'G3', 'G4', 'G7', 'G8'].includes(milestone)
    ? 'implemented'
    : 'proposed',
  milestone,
  ...value,
});
const withContext = changes => fixture({ context: { ...context, ...changes } });
const activeEvent = {
  kind: 'event',
  supportedRsvpChoices: ['PENDING', 'YES', 'NO', 'MAYBE'],
  allowedRsvpTransitions: [],
  event: {
    id: 'synthetic-event',
    title: 'Red Room gathering',
    location: 'Synthetic venue',
    description: 'Synthetic gathering logistics',
    timezone: 'America/New_York',
    startsAt: 1800000000000,
    endsAt: null,
    ongoing: true,
    roster: null,
  },
  participation: null,
  allowedActions: ['groups.events.read'],
};
export const communityFixtures = Object.freeze({
  neverApplied: withContext({}),
  pendingSavedSnapshot: withContext({
    eligibility: { ...context.eligibility, canApply: false },
    applications: [application('PENDING')],
  }),
  declined: withContext({ applications: [application('DECLINED')] }),
  withdrawn: withContext({ applications: [application('WITHDRAWN')] }),
  historicalApprovalWithoutMembership: withContext({
    applications: [application('APPROVED')],
  }),
  member: withContext({
    membership: { role: 'MEMBER' },
    eligibility: {
      canApply: false,
      canAccessMemberContent: true,
      banned: false,
      excluded: false,
    },
  }),
  voluntarilyDeparted: fixture(
    {
      context,
      event: {
        ...activeEvent,
        participation: {
          membershipId: 'synthetic-membership',
          revision: 3,
          rsvp: 'YES',
        },
        allowedActions: [
          'groups.events.read',
          'groups.events.rsvp',
          'groups.events.leave',
        ],
      },
    },
    'G5'
  ),
  banned: withContext({
    form: { enabled: true, revision: 'synthetic-hidden', questions: [] },
    eligibility: {
      canApply: false,
      canAccessMemberContent: false,
      banned: true,
      excluded: false,
    },
  }),
  expelled: fixture(
    {
      context: {
        ...context,
        eligibility: {
          canApply: false,
          canAccessMemberContent: false,
          banned: false,
          excluded: true,
        },
      },
    },
    'G8',
    'implemented'
  ),
  reinstated: fixture({ context }, 'G9'),
  noEvent: fixture({ event: { kind: 'none' } }, 'G4', 'implemented'),
  ongoingEvent: fixture({ event: activeEvent }, 'G4', 'implemented'),
  multipleEventConflict: fixture(
    { event: { kind: 'conflict', code: 'STAFF_CONFIGURATION_CONFLICT' } },
    'G4',
    'implemented'
  ),
  joinedPending: fixture(
    {
      event: {
        ...activeEvent,
        participation: {
          membershipId: 'synthetic-membership',
          revision: 1,
          rsvp: 'PENDING',
        },
        allowedActions: [
          'groups.events.read',
          'groups.events.rsvp',
          'groups.events.leave',
        ],
      },
    },
    'G5'
  ),
  rsvpYes: fixture(
    {
      event: {
        ...activeEvent,
        participation: {
          membershipId: 'synthetic-membership',
          revision: 2,
          rsvp: 'YES',
        },
        allowedActions: [
          'groups.events.read',
          'groups.events.rsvp',
          'groups.events.leave',
        ],
      },
    },
    'G5'
  ),
  leftEvent: fixture({ event: activeEvent }, 'G5'),
  unsubscribed: fixture(
    {
      context: {
        ...context,
        announcementPreference: { supported: true, subscribed: false },
      },
    },
    'G7',
    'implemented'
  ),
  subscribed: fixture(
    {
      context: {
        ...context,
        announcementPreference: { supported: true, subscribed: true },
      },
    },
    'G7',
    'implemented'
  ),
  expired: fixture({
    error: {
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Credentials unavailable.',
        renew: true,
      },
    },
  }),
  revoked: fixture({
    error: {
      error: {
        code: 'CONNECTION_REVOKED',
        message: 'Credentials unavailable.',
        renew: true,
      },
    },
  }),
  lostResponseRecovery: fixture(
    {
      mutation: {
        operationId: '00000000-0000-4000-8000-000000000003',
        outcome: 'committed',
        result: {
          applicationId: 'synthetic-application',
          status: 'PENDING',
          revision: 2,
        },
        effects: { email: 'not-requested', cleanup: 'not-requested' },
      },
    },
    'G3'
  ),
});
