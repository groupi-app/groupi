'use client';
import { api } from '@/convex/_generated/api';
import { createAuthorizationHooks } from '@groupi/shared/hooks';
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
