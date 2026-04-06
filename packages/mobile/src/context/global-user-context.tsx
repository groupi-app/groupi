import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useRef,
  useEffect,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQuery, useConvexAuth } from 'convex/react';
import { useSession } from '@/lib/auth-client';

// Lazy-load API to avoid deep type instantiation issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let userQueries: any;

function initApi() {
  if (!authQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('convex/_generated/api');
    authQueries = api.auth?.queries ?? {};
    userQueries = api.users?.queries ?? {};
  }
}
initApi();

// ===== Types =====
// Use permissive types to avoid deep Convex type instantiation issues.
// The actual data shape is inferred at runtime by useQuery.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserAndPersonData = any;

interface GlobalUserContextValue {
  userAndPerson: UserAndPersonData;
  needsOnboarding: boolean | null | undefined;
  session: { user: { id: string } } | null;
  isSessionPending: boolean;
  isConvexAuthenticated: boolean;
  isConvexAuthLoading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  person: any;
  isAdmin: boolean;
}

// ===== Hook: App Active State =====

function useIsAppActive() {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      setIsActive(state === 'active');
    };
    const subscription = AppState.addEventListener('change', handler);
    return () => subscription.remove();
  }, []);

  return isActive;
}

// ===== Context =====

const GlobalUserContext = createContext<GlobalUserContextValue | null>(null);

// ===== Provider =====

export function GlobalUserProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: isSessionPending } = useSession();
  const {
    isLoading: isConvexAuthLoading,
    isAuthenticated: isConvexAuthenticated,
  } = useConvexAuth();

  const isActive = useIsAppActive();
  const cachedUserAndPersonRef = useRef<UserAndPersonData>(undefined);
  const cachedNeedsOnboardingRef = useRef<boolean | null | undefined>(
    undefined
  );

  // Clear cached data when session identity changes
  const previousSessionUserIdRef = useRef(
    (session as { user?: { id?: string } } | null)?.user?.id
  );
  const currentSessionUserId = (session as { user?: { id?: string } } | null)
    ?.user?.id;
  if (currentSessionUserId !== previousSessionUserIdRef.current) {
    cachedUserAndPersonRef.current = undefined;
    cachedNeedsOnboardingRef.current = undefined;
    previousSessionUserIdRef.current = currentSessionUserId;
  }

  const userAndPersonResult = useQuery(
    authQueries.getCurrentUserAndPerson,
    isConvexAuthenticated && isActive ? {} : 'skip'
  );

  if (userAndPersonResult !== undefined) {
    cachedUserAndPersonRef.current = userAndPersonResult;
  }

  const userAndPerson =
    userAndPersonResult === undefined
      ? cachedUserAndPersonRef.current
      : userAndPersonResult;

  const needsOnboardingResult = useQuery(
    userQueries.checkNeedsOnboarding,
    isConvexAuthenticated && isActive ? {} : 'skip'
  );

  if (needsOnboardingResult !== undefined) {
    cachedNeedsOnboardingRef.current = needsOnboardingResult;
  }

  const needsOnboarding =
    needsOnboardingResult === undefined
      ? cachedNeedsOnboardingRef.current
      : needsOnboardingResult;

  const isLoading =
    isSessionPending ||
    isConvexAuthLoading ||
    (isConvexAuthenticated && userAndPerson === undefined);

  const isAuthenticated = isConvexAuthenticated && !!userAndPerson?.user;

  const user = userAndPerson?.user ?? null;
  const person = userAndPerson?.person ?? null;
  const isAdmin = user?.role === 'admin';

  const value = useMemo<GlobalUserContextValue>(
    () => ({
      userAndPerson,
      needsOnboarding,
      session: session as { user: { id: string } } | null,
      isSessionPending,
      isConvexAuthenticated,
      isConvexAuthLoading,
      isLoading,
      isAuthenticated,
      user,
      person,
      isAdmin,
    }),
    [
      userAndPerson,
      needsOnboarding,
      session,
      isSessionPending,
      isConvexAuthenticated,
      isConvexAuthLoading,
      isLoading,
      isAuthenticated,
      user,
      person,
      isAdmin,
    ]
  );

  return (
    <GlobalUserContext.Provider value={value}>
      {children}
    </GlobalUserContext.Provider>
  );
}

// ===== Consumer Hooks =====

export function useGlobalUser() {
  const context = useContext(GlobalUserContext);
  if (!context) {
    throw new Error('useGlobalUser must be used within a GlobalUserProvider');
  }
  return context;
}

export function useAuthStateFromContext() {
  const { isAuthenticated, isLoading, user, person, isConvexAuthenticated } =
    useGlobalUser();
  return { isAuthenticated, isLoading, user, person, isConvexAuthenticated };
}
