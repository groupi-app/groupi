import { useMutation, useQuery } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import type { ConvexId } from './types';

type Query<Result> = FunctionReference<
  'query',
  'public',
  Record<string, never>,
  Result
>;
type Selector =
  | { kind: 'selected-group'; groupId: ConvexId<'groups'> }
  | { kind: 'selected'; eventIds: ConvexId<'events'>[] }
  | { kind: 'all-current-and-future' };

/** Both platforms bind the same live authorization management interface. */
export function createAuthorizationHooks<
  List,
  Events,
  Catalog,
  Audit,
  Action extends string,
  IssueResult,
  RevokeResult,
  ReplaceResult,
  RecoveryResult,
>(api: {
  authorization: {
    queries: {
      list: Query<List>;
      eligibleEvents: Query<Events>;
      catalog: Query<Catalog>;
      audit: FunctionReference<
        'query',
        'public',
        { grantId: ConvexId<'authorizationGrants'> },
        Audit
      >;
    };
    mutations: {
      issue: FunctionReference<
        'mutation',
        'public',
        {
          name: string;
          principalKind: 'user' | 'integration';
          actions: Action[];
          selector: Selector;
          expiresAt?: number;
        },
        IssueResult
      >;
      revoke: FunctionReference<
        'mutation',
        'public',
        { grantId: ConvexId<'authorizationGrants'> },
        RevokeResult
      >;
      replaceBounds: FunctionReference<
        'mutation',
        'public',
        {
          grantId: ConvexId<'authorizationGrants'>;
          actions: Action[];
          selector: Selector;
        },
        ReplaceResult
      >;
      revokeUserCredentials: FunctionReference<
        'mutation',
        'public',
        Record<string, never>,
        RecoveryResult
      >;
    };
  };
}) {
  return {
    useAuthorizationGrants: () => useQuery(api.authorization.queries.list, {}),
    useAuthorizationEvents: () =>
      useQuery(api.authorization.queries.eligibleEvents, {}),
    useAuthorizationCatalog: () =>
      useQuery(api.authorization.queries.catalog, {}),
    useAuthorizationAudit: (grantId?: ConvexId<'authorizationGrants'>) =>
      useQuery(api.authorization.queries.audit, grantId ? { grantId } : 'skip'),
    useIssueAuthorization: () => useMutation(api.authorization.mutations.issue),
    useRevokeAuthorization: () =>
      useMutation(api.authorization.mutations.revoke),
    useReplaceAuthorizationBounds: () =>
      useMutation(api.authorization.mutations.replaceBounds),
    useRevokeUserCredentials: () =>
      useMutation(api.authorization.mutations.revokeUserCredentials),
  };
}

/** Stable descriptions shared by credential and delegated-consent screens. */
export function authorizationActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'groups.events.read': 'Read your current community Event and own RSVP',
    'groups.events.join': 'Join your current community Event with Pending RSVP',
    'groups.events.rsvp': 'Change your own community Event RSVP',
    'groups.events.leave': 'Leave your community Event',
    'groups.leave':
      'Leave your selected Group while retaining Event participation',
    'groups.context.read': 'Read your own community context',
    'groups.applications.submit': 'Submit your own Group application',
    'groups.applications.edit': 'Edit your pending Group application',
    'groups.applications.withdraw': 'Withdraw your pending Group application',
    'identity.display-name': 'Read your display name',
    'identity.email': 'Read your email address',
    'events.read': 'Read events',
    'events.update': 'Update events',
    'members.read': 'Read event members',
    'discussion.read': 'Read posts and replies',
    'discussion.create': 'Create posts and replies',
    'discussion.update': 'Edit posts and replies',
    'discussion.delete': 'Delete posts and replies',
    'files.read': 'Read event files',
    'files.upload': 'Upload event files',
    'profiles.read': 'Read event member profiles',
  };
  return labels[action] ?? action;
}
