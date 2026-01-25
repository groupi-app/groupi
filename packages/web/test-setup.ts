import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Mock environment variables
beforeEach(() => {
  process.env.CONVEX_URL = 'https://test-convex.convex.cloud';
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test-convex.convex.cloud';
  process.env.SITE_URL = 'http://localhost:3000';
  process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
  process.env.DISCORD_CLIENT_ID = 'test-discord-client-id';
  process.env.DISCORD_CLIENT_SECRET = 'test-discord-client-secret';

  // BetterAuth required environment variables
  process.env.BETTER_AUTH_SECRET = 'test-secret-key-32-chars-minimum';
  process.env.BETTER_AUTH_URL = 'http://localhost:3000';
  // NODE_ENV is already set to 'test' by vitest
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Convex client for component tests
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  usePaginatedQuery: vi.fn(),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
  useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
}));

// Mock Convex generated API for components that use require()
vi.mock('@/convex/_generated/api', () => ({
  api: {
    notifications: {
      queries: {
        fetchNotificationsForPerson: 'fetchNotificationsForPerson',
        getUnreadNotificationCount: 'getUnreadNotificationCount',
        fetchUserNotificationSettings: 'fetchUserNotificationSettings',
      },
      mutations: {
        markNotificationAsRead: 'markNotificationAsRead',
        markNotificationAsUnread: 'markNotificationAsUnread',
        deleteNotification: 'deleteNotification',
        markAllNotificationsAsRead: 'markAllNotificationsAsRead',
        deleteAllNotifications: 'deleteAllNotifications',
        markEventNotificationsAsRead: 'markEventNotificationsAsRead',
      },
    },
    events: {
      queries: {},
      mutations: {},
    },
    posts: {
      queries: {},
      mutations: {},
    },
    users: {
      queries: {
        getCurrentUserProfile: 'users.queries.getCurrentUserProfile',
        getUserByUsername: 'users.queries.getUserByUsername',
        getUserProfile: 'users.queries.getUserProfile',
      },
      mutations: {
        updateUserProfile: 'users.mutations.updateUserProfile',
        updateUserNotificationSettings:
          'users.mutations.updateUserNotificationSettings',
        deleteUserAccount: 'users.mutations.deleteUserAccount',
      },
    },
    settings: {
      queries: {
        getNotificationSettings: 'settings.queries.getNotificationSettings',
      },
      mutations: {
        saveNotificationSettings: 'settings.mutations.saveNotificationSettings',
        deleteNotificationMethod: 'settings.mutations.deleteNotificationMethod',
      },
    },
    availability: {
      queries: {},
      mutations: {},
    },
    invites: {
      queries: {},
      mutations: {},
    },
    replies: {
      queries: {},
      mutations: {},
    },
    accounts: {
      queries: {},
      mutations: {},
    },
    memberships: {
      queries: {},
      mutations: {},
    },
    presence: {
      queries: {},
      mutations: {},
    },
  },
}));

// Mock Convex generated dataModel
vi.mock('@/convex/_generated/dataModel', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Id: (value: any) => value,
}));

// Mock Better Auth client
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    getSession: vi.fn(),
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    },
  }),
}));
