/** Versioned Red Room integration contract. G1 and G3 operations are callable; later milestones remain proposed. */
export type Question = {
  id: string;
  label: string;
  required: boolean;
  type:
    | 'SHORT_ANSWER'
    | 'LONG_ANSWER'
    | 'MULTIPLE_CHOICE'
    | 'CHECKBOXES'
    | 'NUMBER'
    | 'DROPDOWN'
    | 'YES_NO';
  options?: string[];
};
export type Answers = Record<string, string | number | boolean | string[]>;
export type ApplicationStatus =
  | 'PENDING'
  | 'WITHDRAWN'
  | 'APPROVED'
  | 'DECLINED';
export type OwnApplication = {
  id: string;
  status: ApplicationStatus;
  revision: number;
  decisionDelivery?: 'queued' | 'sending' | 'sent' | 'failed' | 'suppressed';
  questions: Question[];
  answers: Answers;
  submittedAt: number;
  decisions: { status: ApplicationStatus; at: number }[];
};
export type CommunityAction =
  | 'groups.context.read'
  | 'groups.applications.submit'
  | 'groups.applications.edit'
  | 'groups.applications.withdraw'
  | 'groups.events.read'
  | 'groups.events.join'
  | 'groups.events.rsvp'
  | 'groups.events.leave'
  | 'groups.leave'
  | 'groups.announcements.preferences.update'
  | 'groups.expulsions.create'
  | 'groups.expulsions.reinstate';
export type CommunityContext = {
  contractVersion: 'red-room.v1';
  group: { id: string; name: string };
  form: { enabled: boolean; revision: string; questions: Question[] };
  membership: { role: 'OWNER' | 'MODERATOR' | 'MEMBER' } | null;
  eligibility: {
    canApply: boolean;
    canAccessMemberContent: boolean;
    banned: boolean;
  };
  applications: OwnApplication[];
  nextCursor: string | null;
  grantedActions: string[];
  allowedActions: string[];
  announcementPreference:
    | { supported: false; subscribed: null }
    | { supported: true; subscribed: boolean };
};
export type Participation = {
  membershipId: string;
  revision: number;
  rsvp: 'PENDING' | 'YES' | 'NO' | 'MAYBE';
} | null;
export type CurrentEvent =
  | { kind: 'none' }
  | { kind: 'conflict'; code: 'STAFF_CONFIGURATION_CONFLICT' }
  | {
      kind: 'event';
      supportedRsvpChoices: ('PENDING' | 'YES' | 'NO' | 'MAYBE')[];
      allowedRsvpTransitions: ('PENDING' | 'YES' | 'NO' | 'MAYBE')[];
      event: {
        id: string;
        title: string;
        location: string | null;
        description: string | null;
        timezone: string;
        startsAt: number | null;
        endsAt: number | null;
        ongoing: boolean;
        roster: { displayName: string }[] | null;
      };
      participation: Participation;
      allowedActions: string[];
    };
export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED'
  | 'CONNECTION_REVOKED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'STALE_REVISION'
  | 'CONFLICT'
  | 'PROTECTED_OWNER'
  | 'PROTECTED_ORGANIZER'
  | 'STAFF_CONFIGURATION_CONFLICT'
  | 'UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'UNKNOWN_OUTCOME'
  | 'IDEMPOTENCY_CONFLICT'
  | 'IDEMPOTENCY_EXPIRED';
export type ContractError = {
  error: {
    code: ErrorCode;
    message: string;
    retryAfter?: number;
    renew?: boolean;
    reconcile?: string;
  };
};
export type MutationIntent<T> = {
  operationId: string;
  expectedRevision?: string | number;
  payload: T;
};
export type Committed<T> = {
  operationId: string;
  outcome: 'committed';
  result: T;
  effects: {
    email: 'not-requested' | 'queued';
    cleanup: 'not-requested' | 'queued' | 'blocked' | 'complete';
  };
};
export type ProposedOperations = {
  submitApplication: {
    input: MutationIntent<{
      groupId: string;
      formRevision: string;
      answers: Answers;
    }>;
    result: Committed<{
      applicationId: string;
      status: ApplicationStatus;
      revision: number;
    }>;
  };
  editApplication: {
    input: MutationIntent<{
      groupId: string;
      applicationId: string;
      answers: Answers;
    }> & { expectedRevision: number };
    result: Committed<{
      applicationId: string;
      status: ApplicationStatus;
      revision: number;
    }>;
  };
  withdrawApplication: {
    input: MutationIntent<{ groupId: string; applicationId: string }> & {
      expectedRevision: number;
    };
    result: Committed<{
      applicationId: string;
      status: 'WITHDRAWN';
      revision: number;
    }>;
  };
  readCurrentEvent: { input: { groupId: string }; result: CurrentEvent };
  joinEvent: {
    input: MutationIntent<{ groupId: string; eventId: string }>;
    result: Committed<{ eventId: string; participation: Participation }>;
  };
  changeRsvp: {
    input: MutationIntent<{
      groupId: string;
      eventId: string;
      rsvp: 'YES' | 'NO' | 'MAYBE' | 'PENDING';
    }> & { expectedRevision: number };
    result: Committed<{ eventId: string; participation: Participation }>;
  };
  leaveEvent: {
    input: MutationIntent<{ groupId: string; eventId: string }>;
    result: Committed<{ eventId: string; participation: null }>;
  };
  leaveGroup: {
    input: MutationIntent<{ groupId: string }>;
    result: Committed<{
      membership: null;
      retainsIndependentEventParticipation: true;
    }>;
  };
  preference: {
    input: MutationIntent<{ groupId: string; subscribed: boolean }>;
    result: Committed<{ subscribed: boolean }>;
  };
  expel: {
    input: MutationIntent<{
      groupId: string;
      personId: string;
      policy: 'coordinated';
    }>;
    result: Committed<{
      generation: number;
      state: 'blocked' | 'progress' | 'complete';
      events: { eventId: string; state: 'queued' | 'blocked' | 'complete' }[];
    }>;
  };
  reinstate: {
    input: MutationIntent<{
      groupId: string;
      personId: string;
      generation: number;
    }>;
    result: Committed<{
      generation: number;
      eligible: boolean;
      restoredParticipation: false;
    }>;
  };
};
export const communityContractVersion: 'red-room.v1';
export const communityOperations: Readonly<
  Record<
    string,
    {
      action: CommunityAction;
      method: string;
      path: string;
      sdk: string;
      status: 'implemented' | 'proposed';
      milestone: string;
    }
  >
>;
export const communityFixtures: Readonly<
  Record<
    string,
    {
      synthetic: true;
      status: 'implemented' | 'proposed';
      milestone: string;
      context?: CommunityContext;
      event?: CurrentEvent;
      error?: ContractError;
      mutation?: Committed<Record<string, unknown>>;
    }
  >
>;

export const communityActionCatalog: Readonly<
  Record<
    CommunityAction,
    {
      status: 'implemented' | 'proposed';
      milestone: string;
      applicant: boolean;
    }
  >
>;
