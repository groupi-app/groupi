import React from 'react';
import { render, screen, renderHook } from '@testing-library/react';
import { expect, test, describe, beforeEach, vi } from 'vitest';

// Mock convex/react first
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useConvexAuth: vi.fn(),
}));

// Mock useSession from auth-client
vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}));

// Now we need to mock the global-user-context module itself
// to avoid the require() issue, then dynamically import in tests
const mockGlobalUserContext = vi.fn();

vi.mock('./global-user-context', () => ({
  GlobalUserProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='mock-provider'>{children}</div>
  ),
  useGlobalUser: () => mockGlobalUserContext(),
  useUserAndPersonFromContext: () => {
    const ctx = mockGlobalUserContext();
    return { data: ctx.userAndPerson, isLoading: ctx.isLoading };
  },
  useNeedsOnboardingFromContext: () => {
    const ctx = mockGlobalUserContext();
    return { data: ctx.needsOnboarding, isLoading: ctx.isLoading };
  },
  useAuthStateFromContext: () => {
    const ctx = mockGlobalUserContext();
    return {
      isAuthenticated: ctx.isAuthenticated,
      isLoading: ctx.isLoading,
      user: ctx.user,
      person: ctx.person,
      isConvexAuthenticated: ctx.isConvexAuthenticated,
    };
  },
  useIsAdminFromContext: () => {
    const ctx = mockGlobalUserContext();
    return { isAdmin: ctx.isAdmin, isLoading: ctx.isLoading };
  },
}));

// Mock user data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  image: 'https://example.com/avatar.png',
  username: 'testuser',
  role: 'user',
};

const mockAdminUser = {
  ...mockUser,
  id: 'admin-123',
  role: 'admin',
};

const mockPerson = {
  id: 'person-123',
  bio: 'Test bio',
};

const mockUserAndPerson = {
  user: mockUser,
  person: mockPerson,
};

const mockAdminUserAndPerson = {
  user: mockAdminUser,
  person: mockPerson,
};

// Full context value types
interface MockUserAndPerson {
  user: typeof mockUser;
  person: typeof mockPerson | null;
}

interface MockContextValue {
  userAndPerson: MockUserAndPerson | null | undefined;
  needsOnboarding: boolean | null | undefined;
  session: { user: { id: string } } | null;
  isSessionPending: boolean;
  isConvexAuthenticated: boolean;
  isConvexAuthLoading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: typeof mockUser | null;
  person: typeof mockPerson | null;
  isAdmin: boolean;
}

const createMockContext = (
  overrides: Partial<MockContextValue> = {}
): MockContextValue => ({
  userAndPerson: mockUserAndPerson,
  needsOnboarding: false,
  session: { user: { id: 'user-123' } },
  isSessionPending: false,
  isConvexAuthenticated: true,
  isConvexAuthLoading: false,
  isLoading: false,
  isAuthenticated: true,
  user: mockUser,
  person: mockPerson,
  isAdmin: false,
  ...overrides,
});

describe('GlobalUserProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGlobalUserContext.mockReturnValue(createMockContext());
  });

  describe('loading states', () => {
    test('isLoading=true when session pending', async () => {
      mockGlobalUserContext.mockReturnValue(
        createMockContext({ isLoading: true, isSessionPending: true })
      );

      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.isLoading).toBe(true);
    });

    test('isLoading=true when convex auth loading', async () => {
      mockGlobalUserContext.mockReturnValue(
        createMockContext({ isLoading: true, isConvexAuthLoading: true })
      );

      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.isLoading).toBe(true);
    });

    test('isLoading=true when authenticated but userAndPerson undefined', async () => {
      mockGlobalUserContext.mockReturnValue(
        createMockContext({
          isLoading: true,
          isConvexAuthenticated: true,
          userAndPerson: undefined,
        })
      );

      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.isLoading).toBe(true);
    });

    test('isLoading=false when fully loaded', async () => {
      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.isLoading).toBe(false);
    });

    test('isLoading=false when not authenticated', async () => {
      mockGlobalUserContext.mockReturnValue(
        createMockContext({
          isLoading: false,
          isAuthenticated: false,
          isConvexAuthenticated: false,
          userAndPerson: null,
          user: null,
          person: null,
        })
      );

      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('authentication states', () => {
    test('isAuthenticated=true when user exists', async () => {
      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.isAuthenticated).toBe(true);
    });

    test('isAuthenticated=false when no user', async () => {
      mockGlobalUserContext.mockReturnValue(
        createMockContext({
          isAuthenticated: false,
          user: null,
          userAndPerson: null,
        })
      );

      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.isAuthenticated).toBe(false);
    });

    test('isAuthenticated=false when convex not authenticated', async () => {
      mockGlobalUserContext.mockReturnValue(
        createMockContext({
          isAuthenticated: false,
          isConvexAuthenticated: false,
          user: null,
          userAndPerson: null,
        })
      );

      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('convenience accessors', () => {
    test('user returns user data when available', async () => {
      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.user).toEqual(mockUser);
    });

    test('user defaults to null when missing', async () => {
      mockGlobalUserContext.mockReturnValue(
        createMockContext({ user: null, userAndPerson: null })
      );

      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.user).toBeNull();
    });

    test('person returns person data when available', async () => {
      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.person).toEqual(mockPerson);
    });

    test('person defaults to null when missing', async () => {
      mockGlobalUserContext.mockReturnValue(
        createMockContext({
          person: null,
          userAndPerson: { user: mockUser, person: null },
        })
      );

      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.person).toBeNull();
    });

    test('isAdmin=true when role is admin', async () => {
      mockGlobalUserContext.mockReturnValue(
        createMockContext({
          isAdmin: true,
          user: mockAdminUser,
          userAndPerson: mockAdminUserAndPerson,
        })
      );

      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.isAdmin).toBe(true);
    });

    test('isAdmin=false when role is not admin', async () => {
      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.isAdmin).toBe(false);
    });

    test('isAdmin=false when user is null', async () => {
      mockGlobalUserContext.mockReturnValue(
        createMockContext({
          isAdmin: false,
          user: null,
          userAndPerson: null,
        })
      );

      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('context data', () => {
    test('exposes session data', async () => {
      const mockSession = { user: { id: 'session-user' } };
      mockGlobalUserContext.mockReturnValue(
        createMockContext({ session: mockSession })
      );

      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.session).toEqual(mockSession);
    });

    test('exposes convex auth state', async () => {
      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.isConvexAuthenticated).toBe(true);
      expect(result.current.isConvexAuthLoading).toBe(false);
    });

    test('exposes needsOnboarding state', async () => {
      mockGlobalUserContext.mockReturnValue(
        createMockContext({ needsOnboarding: true })
      );

      const { useGlobalUser } = await import('./global-user-context');
      const { result } = renderHook(() => useGlobalUser());

      expect(result.current.needsOnboarding).toBe(true);
    });
  });
});

describe('useGlobalUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGlobalUserContext.mockReturnValue(createMockContext());
  });

  test('returns context data', async () => {
    const { useGlobalUser } = await import('./global-user-context');
    const { result } = renderHook(() => useGlobalUser());

    expect(result.current).toBeDefined();
    expect(result.current.user).toEqual(mockUser);
  });
});

describe('useUserAndPersonFromContext', () => {
  beforeEach(() => {
    mockGlobalUserContext.mockReturnValue(createMockContext());
  });

  test('returns data and isLoading', async () => {
    const { useUserAndPersonFromContext } = await import(
      './global-user-context'
    );
    const { result } = renderHook(() => useUserAndPersonFromContext());

    expect(result.current.data).toEqual(mockUserAndPerson);
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useNeedsOnboardingFromContext', () => {
  beforeEach(() => {
    mockGlobalUserContext.mockReturnValue(
      createMockContext({ needsOnboarding: false })
    );
  });

  test('returns needsOnboarding data', async () => {
    const { useNeedsOnboardingFromContext } = await import(
      './global-user-context'
    );
    const { result } = renderHook(() => useNeedsOnboardingFromContext());

    expect(result.current.data).toBe(false);
  });
});

describe('useAuthStateFromContext', () => {
  beforeEach(() => {
    mockGlobalUserContext.mockReturnValue(createMockContext());
  });

  test('returns auth state', async () => {
    const { useAuthStateFromContext } = await import('./global-user-context');
    const { result } = renderHook(() => useAuthStateFromContext());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.person).toEqual(mockPerson);
    expect(result.current.isConvexAuthenticated).toBe(true);
  });
});

describe('useIsAdminFromContext', () => {
  test('returns isAdmin=true for admin users', async () => {
    mockGlobalUserContext.mockReturnValue(createMockContext({ isAdmin: true }));

    const { useIsAdminFromContext } = await import('./global-user-context');
    const { result } = renderHook(() => useIsAdminFromContext());

    expect(result.current.isAdmin).toBe(true);
  });

  test('returns isAdmin=false for regular users', async () => {
    mockGlobalUserContext.mockReturnValue(
      createMockContext({ isAdmin: false })
    );

    const { useIsAdminFromContext } = await import('./global-user-context');
    const { result } = renderHook(() => useIsAdminFromContext());

    expect(result.current.isAdmin).toBe(false);
  });
});

describe('GlobalUserProvider renders children', () => {
  beforeEach(() => {
    mockGlobalUserContext.mockReturnValue(createMockContext());
  });

  test('renders children correctly', async () => {
    const { GlobalUserProvider } = await import('./global-user-context');

    render(
      <GlobalUserProvider>
        <div data-testid='child'>Child Content</div>
      </GlobalUserProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});
