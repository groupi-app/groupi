/**
 * Tests for authentication hooks factory
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createAuthHooks } from '../useAuth';
import {
  TestSetup,
  createMockConvexApi,
  TestDataFactory,
  type MockConvexApi,
} from '../../test-helpers';

// Mock Convex React hooks
const mockUseQuery = vi.fn();
const mockUseConvexAuth = vi.fn();

vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useConvexAuth: () => mockUseConvexAuth(),
}));

describe('Auth Hooks Factory', () => {
  let mockApi: MockConvexApi;

  beforeEach(() => {
    TestSetup.beforeEach();
    mockApi = createMockConvexApi();

    // Mock useConvexAuth to return authenticated state by default
    mockUseConvexAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
    });

    // Mock useQuery to return test data by default
    mockUseQuery.mockReturnValue(TestDataFactory.createUser());
  });

  afterEach(() => {
    TestSetup.afterEach();
    vi.clearAllMocks();
  });

  describe('createAuthHooks factory', () => {
    it('should create auth hooks with Convex API', () => {
      const hooks = createAuthHooks(mockApi);

      expect(hooks).toHaveProperty('useCurrentUser');
      expect(hooks).toHaveProperty('useAuthState');
      expect(hooks).toHaveProperty('useUserProfile');
      expect(hooks).toHaveProperty('useUserMembership');
      expect(hooks).toHaveProperty('useUserPermissions');
      expect(hooks).toHaveProperty('useAuthGuard');
      expect(hooks).toHaveProperty('useEventAccessGuard');

      expect(typeof hooks.useCurrentUser).toBe('function');
      expect(typeof hooks.useAuthState).toBe('function');
      expect(typeof hooks.useUserProfile).toBe('function');
    });

    it('should create all required hook functions', () => {
      const hooks = createAuthHooks(mockApi);

      // Test that all expected hooks are created
      const expectedHooks = [
        'useCurrentUser',
        'useAuthState',
        'useUserProfile',
        'useUserMembership',
        'useUserPermissions',
        'useAuthGuard',
        'useEventAccessGuard',
      ];

      expectedHooks.forEach(hookName => {
        expect(hooks).toHaveProperty(hookName);
        expect(typeof (hooks as any)[hookName]).toBe('function');
      });
    });

    it('should accept proper parameters', () => {
      const hooks = createAuthHooks(mockApi);

      // Test that hooks can be called with expected parameters without error
      // Using `as any` for test IDs since actual validation happens at runtime
      expect(() => hooks.useUserProfile('user_123' as any)).not.toThrow();
      expect(() => hooks.useUserProfile(undefined)).not.toThrow();
      expect(() => hooks.useUserMembership('event_123' as any)).not.toThrow();
      // Note: useUserMembership requires eventId parameter
    });

    it('should work with different API configurations', () => {
      const alternativeApi = createMockConvexApi();
      const hooks = createAuthHooks(alternativeApi);

      expect(hooks).toHaveProperty('useCurrentUser');
      expect(hooks).toHaveProperty('useAuthState');
      expect(typeof hooks.useCurrentUser).toBe('function');
      expect(typeof hooks.useAuthState).toBe('function');
    });
  });

  describe('Hook Factory Structure', () => {
    it('should maintain consistent API across all hooks', () => {
      const hooks = createAuthHooks(mockApi);

      // All hooks should be functions
      Object.values(hooks).forEach(hook => {
        expect(typeof hook).toBe('function');
      });
    });

    it('should handle API dependency injection', () => {
      const hooks1 = createAuthHooks(mockApi);
      const mockApi2 = createMockConvexApi();
      const hooks2 = createAuthHooks(mockApi2);

      // Both should create valid hook objects
      expect(hooks1).toBeTruthy();
      expect(hooks2).toBeTruthy();
      expect(typeof hooks1.useCurrentUser).toBe('function');
      expect(typeof hooks2.useCurrentUser).toBe('function');
    });
  });

  describe('Type Safety', () => {
    it('should provide properly typed hook functions', () => {
      const hooks = createAuthHooks(mockApi);

      // Test that the hooks can be called and return objects
      // Note: We're not calling the actual React hooks, just the factory functions
      expect(hooks.useCurrentUser).toBeInstanceOf(Function);
      expect(hooks.useUserProfile).toBeInstanceOf(Function);
      expect(hooks.useUserMembership).toBeInstanceOf(Function);
    });

    it('should handle optional parameters correctly', () => {
      const hooks = createAuthHooks(mockApi);

      // These should not throw when called with various parameter types
      // Using `as any` for test IDs since actual validation happens at runtime
      expect(() => hooks.useUserProfile('string-id' as any)).not.toThrow();
      expect(() => hooks.useUserProfile(undefined)).not.toThrow();

      // useUserMembership has a required eventId parameter
      expect(() => hooks.useUserMembership('event-id' as any)).not.toThrow();
      expect(() => hooks.useUserPermissions('event-id' as any)).not.toThrow();
      expect(() => hooks.useUserPermissions(undefined)).not.toThrow();
    });
  });

  describe('Integration with Mock API', () => {
    it('should use the provided Convex API', () => {
      const hooks = createAuthHooks(mockApi);

      // Verify that the hooks are created with the mock API
      // The actual implementation will use the API for queries/mutations
      expect(hooks).toBeTruthy();
      expect(typeof hooks.useCurrentUser).toBe('function');
    });

    it('should work with test data factory', () => {
      const hooks = createAuthHooks(mockApi);
      const testUser = TestDataFactory.createUser();
      const testMembership = TestDataFactory.createMembership();

      // Verify test data is properly structured
      expect(testUser).toHaveProperty('_id');
      expect(testUser).toHaveProperty('firstName');
      expect(testMembership).toHaveProperty('role');

      // Hooks should be callable
      expect(typeof hooks.useCurrentUser).toBe('function');
      expect(typeof hooks.useUserMembership).toBe('function');
    });
  });

  describe('useCurrentUser hook', () => {
    it('should skip query when not authenticated', () => {
      mockUseConvexAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
      });

      const hooks = createAuthHooks(mockApi);
      hooks.useCurrentUser();

      // Should call useQuery with 'skip' when not authenticated
      expect(mockUseQuery).toHaveBeenCalledWith(
        mockApi.users.queries.getCurrentUser,
        'skip'
      );
    });

    it('should fetch user when authenticated', () => {
      mockUseConvexAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
      });

      const hooks = createAuthHooks(mockApi);
      hooks.useCurrentUser();

      // Should call useQuery with empty object when authenticated
      expect(mockUseQuery).toHaveBeenCalledWith(
        mockApi.users.queries.getCurrentUser,
        {}
      );
    });
  });

  describe('useAuthState hook', () => {
    it('should return correct state when loading', () => {
      mockUseConvexAuth.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
      });
      mockUseQuery.mockReturnValue(undefined);

      const hooks = createAuthHooks(mockApi);
      const state = hooks.useAuthState();

      expect(state.isLoading).toBe(true);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isReady).toBe(false);
      expect(state.hasUser).toBe(false);
    });

    it('should return correct state when authenticated with user', () => {
      mockUseConvexAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
      });
      const mockUser = TestDataFactory.createUser();
      mockUseQuery.mockReturnValue(mockUser);

      const hooks = createAuthHooks(mockApi);
      const state = hooks.useAuthState();

      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.isReady).toBe(true);
      expect(state.hasUser).toBe(true);
    });

    it('should return correct state when authenticated without user', () => {
      mockUseConvexAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
      });
      mockUseQuery.mockReturnValue(null);

      const hooks = createAuthHooks(mockApi);
      const state = hooks.useAuthState();

      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBe(null);
      expect(state.isReady).toBe(true);
      expect(state.hasUser).toBe(false);
    });

    it('should return isReady false when user is undefined', () => {
      mockUseConvexAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
      });
      mockUseQuery.mockReturnValue(undefined);

      const hooks = createAuthHooks(mockApi);
      const state = hooks.useAuthState();

      expect(state.isReady).toBe(false);
      expect(state.hasUser).toBe(false);
    });
  });

  describe('useUserProfile hook', () => {
    it('should fetch profile when userId provided', () => {
      const hooks = createAuthHooks(mockApi);
      hooks.useUserProfile('user_123' as unknown as any);

      expect(mockUseQuery).toHaveBeenCalledWith(
        mockApi.users.queries.getUserProfile,
        { userId: 'user_123' }
      );
    });

    it('should skip query when userId not provided', () => {
      const hooks = createAuthHooks(mockApi);
      hooks.useUserProfile(undefined);

      expect(mockUseQuery).toHaveBeenCalledWith(
        mockApi.users.queries.getUserProfile,
        'skip'
      );
    });
  });

  describe('useUserMembership hook', () => {
    it('should fetch membership when user and eventId exist', () => {
      const mockUser = TestDataFactory.createUser();
      mockUseQuery.mockReturnValue(mockUser);

      const hooks = createAuthHooks(mockApi);
      hooks.useUserMembership('event_123' as unknown as any);

      // Should query membership with eventId
      expect(mockUseQuery).toHaveBeenCalledWith(
        mockApi.memberships.queries.getUserMembership,
        expect.objectContaining({ eventId: 'event_123' })
      );
    });

    it('should skip query when eventId not provided', () => {
      const hooks = createAuthHooks(mockApi);
      hooks.useUserMembership(undefined);

      // One call for current user, one for membership with skip
      const calls = mockUseQuery.mock.calls;
      const membershipCall = calls.find(
        call => call[0] === mockApi.memberships.queries.getUserMembership
      );
      expect(membershipCall?.[1]).toBe('skip');
    });
  });

  describe('useUserPermissions hook', () => {
    it('should return organizer permissions', () => {
      const mockMembership = TestDataFactory.createMembership({
        role: 'ORGANIZER',
      });
      mockUseQuery.mockReturnValue(mockMembership);

      const hooks = createAuthHooks(mockApi);
      const permissions = hooks.useUserPermissions(
        'event_123' as unknown as any
      );

      expect(permissions.role).toBe('ORGANIZER');
      expect(permissions.isOrganizer).toBe(true);
      expect(permissions.isModerator).toBe(false);
      expect(permissions.isAttendee).toBe(false);
      expect(permissions.canManageEvent).toBe(true);
      expect(permissions.canDeleteEvent).toBe(true);
      expect(permissions.isMember).toBe(true);
    });

    it('should return moderator permissions', () => {
      const mockMembership = TestDataFactory.createMembership({
        role: 'MODERATOR',
      });
      mockUseQuery.mockReturnValue(mockMembership);

      const hooks = createAuthHooks(mockApi);
      const permissions = hooks.useUserPermissions(
        'event_123' as unknown as any
      );

      expect(permissions.role).toBe('MODERATOR');
      expect(permissions.isOrganizer).toBe(false);
      expect(permissions.isModerator).toBe(true);
      expect(permissions.canManageEvent).toBe(true);
      expect(permissions.canDeleteEvent).toBe(false);
    });

    it('should return attendee permissions', () => {
      const mockMembership = TestDataFactory.createMembership({
        role: 'ATTENDEE',
      });
      mockUseQuery.mockReturnValue(mockMembership);

      const hooks = createAuthHooks(mockApi);
      const permissions = hooks.useUserPermissions(
        'event_123' as unknown as any
      );

      expect(permissions.role).toBe('ATTENDEE');
      expect(permissions.isOrganizer).toBe(false);
      expect(permissions.isModerator).toBe(false);
      expect(permissions.isAttendee).toBe(true);
      expect(permissions.canManageEvent).toBe(false);
      expect(permissions.canDeleteEvent).toBe(false);
    });

    it('should return non-member permissions when no membership', () => {
      mockUseQuery.mockReturnValue(null);

      const hooks = createAuthHooks(mockApi);
      const permissions = hooks.useUserPermissions(
        'event_123' as unknown as any
      );

      expect(permissions.role).toBe(undefined);
      expect(permissions.isMember).toBe(false);
      expect(permissions.canManageEvent).toBe(false);
    });

    it('should handle undefined membership', () => {
      mockUseQuery.mockReturnValue(undefined);

      const hooks = createAuthHooks(mockApi);
      const permissions = hooks.useUserPermissions(
        'event_123' as unknown as any
      );

      expect(permissions.role).toBe(undefined);
      expect(permissions.isMember).toBe(false);
    });
  });

  describe('useAuthGuard hook', () => {
    it('should indicate redirect to login when not authenticated', () => {
      mockUseConvexAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
      });
      mockUseQuery.mockImplementation(() => undefined);

      const hooks = createAuthHooks(mockApi);
      const guard = hooks.useAuthGuard();

      expect(guard.shouldRedirectToLogin).toBe(true);
      expect(guard.shouldRedirectToOnboarding).toBe(false);
      expect(guard.isAuthorized).toBeFalsy();
    });

    it('should indicate redirect to onboarding when authenticated but no user', () => {
      mockUseConvexAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
      });
      // User is null (exists but not set up)
      mockUseQuery.mockImplementation(() => null);

      const hooks = createAuthHooks(mockApi);
      const guard = hooks.useAuthGuard();

      expect(guard.shouldRedirectToLogin).toBe(false);
      expect(guard.shouldRedirectToOnboarding).toBe(true);
      expect(guard.isAuthorized).toBeFalsy();
    });

    it('should indicate authorized when authenticated with user', () => {
      const mockUser = TestDataFactory.createUser();
      mockUseConvexAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
      });
      mockUseQuery.mockImplementation(() => mockUser);

      const hooks = createAuthHooks(mockApi);
      const guard = hooks.useAuthGuard();

      expect(guard.shouldRedirectToLogin).toBe(false);
      expect(guard.shouldRedirectToOnboarding).toBe(false);
      expect(guard.isAuthorized).toBeTruthy();
    });

    it('should not redirect while loading', () => {
      mockUseConvexAuth.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
      });
      mockUseQuery.mockImplementation(() => undefined);

      const hooks = createAuthHooks(mockApi);
      const guard = hooks.useAuthGuard();

      expect(guard.isLoading).toBe(true);
      expect(guard.shouldRedirectToLogin).toBe(false);
      expect(guard.shouldRedirectToOnboarding).toBe(false);
    });
  });

  describe('useEventAccessGuard hook', () => {
    it('should indicate no access when not a member', () => {
      const mockUser = TestDataFactory.createUser();
      mockUseConvexAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
      });
      // Mock based on query function
      mockUseQuery.mockImplementation(query => {
        if (query === mockApi.users.queries.getCurrentUser) {
          return mockUser;
        }
        if (query === mockApi.memberships.queries.getUserMembership) {
          return null;
        }
        return undefined;
      });

      const hooks = createAuthHooks(mockApi);
      const guard = hooks.useEventAccessGuard('event_123' as unknown as any);

      expect(guard.hasEventAccess).toBe(false);
      expect(guard.shouldShowNotAuthorized).toBe(true);
    });

    it('should indicate access when member', () => {
      const mockUser = TestDataFactory.createUser();
      const mockMembership = TestDataFactory.createMembership();
      mockUseConvexAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
      });
      // Mock based on query function
      mockUseQuery.mockImplementation(query => {
        if (query === mockApi.users.queries.getCurrentUser) {
          return mockUser;
        }
        if (query === mockApi.memberships.queries.getUserMembership) {
          return mockMembership;
        }
        return undefined;
      });

      const hooks = createAuthHooks(mockApi);
      const guard = hooks.useEventAccessGuard('event_123' as unknown as any);

      expect(guard.hasEventAccess).toBe(true);
      expect(guard.shouldShowNotAuthorized).toBe(false);
      expect(guard.membership).toEqual(mockMembership);
    });

    it('should redirect to login when not authenticated', () => {
      mockUseConvexAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
      });
      mockUseQuery.mockReturnValue(undefined);

      const hooks = createAuthHooks(mockApi);
      const guard = hooks.useEventAccessGuard('event_123' as unknown as any);

      expect(guard.shouldRedirectToLogin).toBe(true);
      expect(guard.hasEventAccess).toBe(false);
    });
  });
});
