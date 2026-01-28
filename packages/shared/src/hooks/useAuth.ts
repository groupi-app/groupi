/**
 * Platform-agnostic authentication hooks
 * These hooks work on both web (Next.js) and mobile (React Native)
 */

import { useConvexAuth, useQuery } from 'convex/react';
import type { ConvexApi, ConvexId } from './types';

/**
 * Auth hooks factory - accepts api and returns auth hooks
 */
export function createAuthHooks(api: ConvexApi) {
  /**
   * Get current authenticated user
   * Works on web and mobile
   */
  function useCurrentUser() {
    const { isAuthenticated } = useConvexAuth();

    // Only fetch user data if authenticated
    return useQuery(
      api.users.queries.getCurrentUser,
      isAuthenticated ? {} : 'skip'
    );
  }

  /**
   * Get authentication state
   * Works on web and mobile
   */
  function useAuthState() {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const user = useCurrentUser();

    return {
      isLoading,
      isAuthenticated,
      user,
      isReady: !isLoading && isAuthenticated && user !== undefined,
      hasUser: user !== null && user !== undefined,
    };
  }

  /**
   * Get user profile data
   * Works on web and mobile
   */
  function useUserProfile(userId?: ConvexId<'users'>) {
    return useQuery(
      api.users.queries.getUserProfile,
      userId ? { userId } : 'skip'
    );
  }

  /**
   * Get current user's membership for a specific event
   * Works on web and mobile
   * @param eventId - Event ID (optional, will skip query if not provided)
   */
  function useUserMembership(eventId?: ConvexId<'events'>) {
    const user = useCurrentUser();

    return useQuery(
      api.memberships.queries.getUserMembership,
      user && eventId ? { eventId } : 'skip'
    );
  }

  /**
   * Check if user has specific permissions
   * Works on web and mobile
   */
  function useUserPermissions(eventId?: ConvexId<'events'>) {
    // Always call the hook unconditionally - it handles skip internally
    const membership = useUserMembership(eventId);
    const role = membership?.role;

    return {
      role,
      isOrganizer: role === 'ORGANIZER',
      isModerator: role === 'MODERATOR',
      isAttendee: role === 'ATTENDEE',
      canManageEvent: role === 'ORGANIZER' || role === 'MODERATOR',
      canDeleteEvent: role === 'ORGANIZER',
      isMember: membership !== null && membership !== undefined,
    };
  }

  /**
   * Auth guard hook - returns auth state and redirect logic
   * Works on web and mobile (platform handles actual navigation)
   */
  function useAuthGuard() {
    const { isLoading, isAuthenticated, user } = useAuthState();

    return {
      isLoading,
      isAuthenticated,
      user,
      shouldRedirectToLogin: !isLoading && !isAuthenticated,
      shouldRedirectToOnboarding: !isLoading && isAuthenticated && !user,
      isAuthorized: !isLoading && isAuthenticated && user,
    };
  }

  /**
   * Event access guard - checks if user can access event
   * Works on web and mobile (platform handles actual navigation)
   */
  function useEventAccessGuard(eventId: ConvexId<'events'>) {
    const authGuard = useAuthGuard();
    const membership = useUserMembership(eventId);

    return {
      ...authGuard,
      membership,
      hasEventAccess: authGuard.isAuthorized && membership !== null,
      shouldRedirectToLogin: authGuard.shouldRedirectToLogin,
      shouldShowNotAuthorized: authGuard.isAuthorized && membership === null,
    };
  }

  /**
   * Login hook - returns a function to perform login
   * The actual authentication is platform-specific (web uses Better Auth, mobile uses Expo Auth Session)
   * This is a placeholder that should be implemented by each platform
   * Works on web and mobile
   */
  function useLogin() {
    return async (_credentials: { email: string; password: string }) => {
      // Placeholder - actual implementation is platform-specific
      // On web: uses Better Auth signIn
      // On mobile: uses Expo Auth Session
      throw new Error(
        'useLogin must be implemented by the platform-specific auth adapter'
      );
    };
  }

  /**
   * Signup hook - returns a function to perform signup
   * The actual authentication is platform-specific
   * This is a placeholder that should be implemented by each platform
   * Works on web and mobile
   */
  function useSignup() {
    return async (_data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => {
      // Placeholder - actual implementation is platform-specific
      throw new Error(
        'useSignup must be implemented by the platform-specific auth adapter'
      );
    };
  }

  /**
   * Logout hook - returns a function to perform logout
   * The actual authentication is platform-specific
   * This is a placeholder that should be implemented by each platform
   * Works on web and mobile
   */
  function useLogout() {
    return async () => {
      // Placeholder - actual implementation is platform-specific
      throw new Error(
        'useLogout must be implemented by the platform-specific auth adapter'
      );
    };
  }

  return {
    useCurrentUser,
    useAuthState,
    useUserProfile,
    useUserMembership,
    useUserPermissions,
    useAuthGuard,
    useEventAccessGuard,
    useLogin,
    useSignup,
    useLogout,
  };
}
