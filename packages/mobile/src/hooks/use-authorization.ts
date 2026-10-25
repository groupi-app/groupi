import {
  createAuthorizationHooks,
  createConnectedAppHooks,
} from '@groupi/shared/hooks';
import { api } from 'convex/_generated/api';

export const {
  useAuthorizationGrants,
  useAuthorizationEvents,
  useAuthorizationCatalog,
  useAuthorizationAudit,
  useIssueAuthorization,
  useRevokeAuthorization,
  useReplaceAuthorizationBounds,
  useRevokeUserCredentials,
} = createAuthorizationHooks(api);

export const { useConnectedApps, useDisconnectApp } =
  createConnectedAppHooks(api);
