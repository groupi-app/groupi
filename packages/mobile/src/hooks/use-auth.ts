import { createAuthHooks } from '@groupi/shared/hooks';

// Lazy-load API to avoid deep type instantiation issues
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

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
