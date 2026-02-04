'use client';

import { createContext, useContext, ReactNode, useMemo, useRef } from 'react';
import { useQuery, useConvexAuth } from 'convex/react';
import { useSession } from '@/lib/auth-client';
import { useIsActive } from '@/providers/visibility-provider';

/* eslint-disable react-hooks/refs -- This file uses intentional caching pattern for visibility optimization */

// Dynamic require to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let userQueries: any;

function initApi() {
  if (!authQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    authQueries = api.auth?.queries ?? {};
    userQueries = api.users?.queries ?? {};
  }
}
initApi();

// ===== Types =====

// User and person data from getCurrentUserAndPerson
interface UserAndPerson {
  user: {
    _id: string;
    email: string;
    name: string | null;
    image: string | null;
    username: string | null;
    role: string;
  };
  person: {
    _id: string;
    bio: string | null;
  } | null;
}

interface GlobalUserContextValue {
  // User data from getCurrentUserAndPerson
  userAndPerson: UserAndPerson | null | undefined;

  // Onboarding state
  needsOnboarding: boolean | null | undefined;

  // Session from Better Auth (for checking auth state before Convex syncs)
  session: { user: { id: string } } | null;
  isSessionPending: boolean;

  // Convex auth state
  isConvexAuthenticated: boolean;
  isConvexAuthLoading: boolean;

  // Computed states
  isLoading: boolean;
  isAuthenticated: boolean;

  // Convenience accessors
  user: UserAndPerson['user'] | null;
  person: UserAndPerson['person'] | null;
  isAdmin: boolean;
}

// ===== Context =====

const GlobalUserContext = createContext<GlobalUserContextValue | null>(null);

// ===== Provider =====

interface GlobalUserProviderProps {
  children: ReactNode;
}

/**
 * Provides global user data to all components via context.
 * Data is fetched once at the root layout level and shared across:
 * - Navigation components (MobileNavigation, UserProfile, ProfileDropdown)
 * - Onboarding redirect wrapper
 * - Global presence tracker
 * - Any other component needing user data
 *
 * This eliminates 4-5 duplicate queries that were previously made by
 * individual navigation components.
 */
export function GlobalUserProvider({ children }: GlobalUserProviderProps) {
  // Better Auth session (reflects auth state before Convex syncs)
  const { data: session, isPending: isSessionPending } = useSession();

  // Convex auth state (reflects when Convex has validated the token)
  const {
    isLoading: isConvexAuthLoading,
    isAuthenticated: isConvexAuthenticated,
  } = useConvexAuth();

  // Visibility-aware caching to prevent skeleton flashing on tab switch
  const isActive = useIsActive();
  const cachedUserAndPersonRef = useRef<UserAndPerson | null | undefined>(
    undefined
  );
  const cachedNeedsOnboardingRef = useRef<boolean | null | undefined>(
    undefined
  );

  // Fetch user data - visibility-aware to prevent re-subscription flash
  // When tab is hidden, we skip the query but return cached data
  const userAndPersonResult = useQuery(
    authQueries.getCurrentUserAndPerson,
    isConvexAuthenticated && isActive ? {} : 'skip'
  );

  // Cache the result when we get fresh data
  if (userAndPersonResult !== undefined) {
    cachedUserAndPersonRef.current = userAndPersonResult;
  }

  // Stale-while-revalidate: return cached data when result is undefined
  // This prevents loading flash when user tabs back in
  const userAndPerson =
    userAndPersonResult === undefined
      ? cachedUserAndPersonRef.current
      : userAndPersonResult;

  // Check if user needs onboarding - also visibility-aware
  const needsOnboardingResult = useQuery(
    userQueries.checkNeedsOnboarding,
    isConvexAuthenticated && isActive ? {} : 'skip'
  );

  // Cache the onboarding result
  if (needsOnboardingResult !== undefined) {
    cachedNeedsOnboardingRef.current = needsOnboardingResult;
  }

  // Stale-while-revalidate: return cached data when result is undefined
  const needsOnboarding =
    needsOnboardingResult === undefined
      ? cachedNeedsOnboardingRef.current
      : needsOnboardingResult;

  // Compute loading state
  // Loading if:
  // 1. Session is pending (Better Auth hasn't determined auth state)
  // 2. Convex auth is loading (validating token)
  // 3. Authenticated but user query is still loading
  const isLoading =
    isSessionPending ||
    isConvexAuthLoading ||
    (isConvexAuthenticated && userAndPerson === undefined);

  // Compute authenticated state
  const isAuthenticated = isConvexAuthenticated && !!userAndPerson?.user;

  // Convenience accessors
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

/**
 * Access the full global user context.
 * Must be used within a GlobalUserProvider.
 */
export function useGlobalUser() {
  const context = useContext(GlobalUserContext);
  if (!context) {
    throw new Error('useGlobalUser must be used within a GlobalUserProvider');
  }
  return context;
}

/**
 * Access user and person data from context.
 * Returns the same shape as useQuery(authQueries.getCurrentUserAndPerson).
 */
export function useUserAndPersonFromContext() {
  const { userAndPerson, isLoading } = useGlobalUser();
  return { data: userAndPerson, isLoading };
}

/**
 * Access onboarding state from context.
 * Returns the same shape as useQuery(userQueries.checkNeedsOnboarding).
 */
export function useNeedsOnboardingFromContext() {
  const { needsOnboarding, isLoading } = useGlobalUser();
  return { data: needsOnboarding, isLoading };
}

/**
 * Access auth state from context.
 * Provides a unified view of authentication state from both Better Auth and Convex.
 */
export function useAuthStateFromContext() {
  const { isAuthenticated, isLoading, user, person, isConvexAuthenticated } =
    useGlobalUser();
  return {
    isAuthenticated,
    isLoading,
    user,
    person,
    isConvexAuthenticated,
  };
}

/**
 * Check if current user is an admin.
 */
export function useIsAdminFromContext() {
  const { isAdmin, isLoading } = useGlobalUser();
  return { isAdmin, isLoading };
}
