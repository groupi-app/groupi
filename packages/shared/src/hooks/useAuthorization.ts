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
    'groups.context.read': 'Read your own community context',
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
