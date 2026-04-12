import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
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

  // Cache query results in state to avoid ref-during-render lint errors
  const [cachedUserAndPerson, setCachedUserAndPerson] =
    useState<UserAndPersonData>(undefined);
  const [cachedNeedsOnboarding, setCachedNeedsOnboarding] = useState<
    boolean | null | undefined
  >(undefined);
  const [prevSessionUserId, setPrevSessionUserId] = useState<
    string | undefined
  >(undefined);

  // Clear cached data when session identity changes (inline state update)
  const currentSessionUserId = (session as { user?: { id?: string } } | null)
    ?.user?.id;

  if (currentSessionUserId !== prevSessionUserId) {
    setPrevSessionUserId(currentSessionUserId);
    if (prevSessionUserId !== undefined) {
      setCachedUserAndPerson(undefined);
      setCachedNeedsOnboarding(undefined);
    }
  }

  const userAndPersonResult = useQuery(
    authQueries.getCurrentUserAndPerson,
    isConvexAuthenticated && isActive ? {} : 'skip'
  );

  // Cache query results when they arrive. This is an intentional sync pattern
  // to preserve data across Convex subscription reconnects.
  if (
    userAndPersonResult !== undefined &&
    userAndPersonResult !== cachedUserAndPerson
  ) {
    setCachedUserAndPerson(userAndPersonResult);
  }

  const userAndPerson =
    userAndPersonResult === undefined
      ? cachedUserAndPerson
      : userAndPersonResult;

  const needsOnboardingResult = useQuery(
    userQueries.checkNeedsOnboarding,
    isConvexAuthenticated && isActive ? {} : 'skip'
  );

  if (
    needsOnboardingResult !== undefined &&
    needsOnboardingResult !== cachedNeedsOnboarding
  ) {
    setCachedNeedsOnboarding(needsOnboardingResult);
  }

  const needsOnboarding =
    needsOnboardingResult === undefined
      ? cachedNeedsOnboarding
      : needsOnboardingResult;

  const isLoading = isSessionPending || isConvexAuthLoading;

  // Use isConvexAuthenticated as the primary auth check.
  // Don't require userAndPerson - users who need onboarding won't have a person record yet.
  const isAuthenticated = isConvexAuthenticated;

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
