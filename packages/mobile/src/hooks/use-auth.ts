import { createAuthHooks } from '@groupi/shared/hooks';
import { api } from 'convex/_generated/api';

const authHooks = createAuthHooks(api);

export const {
  useCurrentUser,
  useAuthState,
  useUserProfile,
  useUserMembership,
  useUserPermissions,
  useAuthGuard,
  useEventAccessGuard,
} = authHooks;
