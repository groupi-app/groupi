/**
 * Comprehensive test helpers for @groupi/shared package
 * Provides utilities for testing hooks, adapters, utilities, and state management
 *
 * Note: Many types are intentionally flexible (using generics with unknown defaults)
 * to allow for flexible mock data in tests.
 */

import { vi } from 'vitest';

// Mock types to simulate Convex API structure
export interface MockConvexQuery {
  _tag: 'query';
  name: string;
}

export interface MockConvexMutation {
  _tag: 'mutation';
  name: string;
}

export interface MockConvexApi {
  auth: {
    queries: {
      getCurrentUser: MockConvexQuery;
      getUserProfile: MockConvexQuery;
      getAuthState: MockConvexQuery;
    };
    mutations: {
      signIn: MockConvexMutation;
      signUp: MockConvexMutation;
      signOut: MockConvexMutation;
    };
  };
  events: {
    queries: {
      getEvent: MockConvexQuery;
      getEventMembers: MockConvexQuery;
      getUserEvents: MockConvexQuery;
      getMutualEvents: MockConvexQuery;
      getEventAvailability: MockConvexQuery;
    };
    mutations: {
      createEvent: MockConvexMutation;
      updateEvent: MockConvexMutation;
      deleteEvent: MockConvexMutation;
      leaveEvent: MockConvexMutation;
      updateRSVP: MockConvexMutation;
    };
  };
  posts: {
    queries: {
      getPost: MockConvexQuery;
      getPostDetail: MockConvexQuery;
      getEventPostFeed: MockConvexQuery;
      getPostReplies: MockConvexQuery;
    };
    mutations: {
      createPost: MockConvexMutation;
      updatePost: MockConvexMutation;
      deletePost: MockConvexMutation;
      createReply: MockConvexMutation;
      updateReply: MockConvexMutation;
      deleteReply: MockConvexMutation;
    };
  };
  users: {
    queries: {
      getCurrentUser: MockConvexQuery;
      getUserProfile: MockConvexQuery;
    };
  };
  memberships: {
    queries: {
      getUserMembership: MockConvexQuery;
    };
  };
}

// Mock implementation of useQuery and useMutation hooks
export interface MockUseQueryHook {
  <T = unknown>(
    query: MockConvexQuery,
    args?: Record<string, unknown> | 'skip'
  ): {
    data: T | undefined;
    isLoading: boolean;
    error: Error | undefined;
  };
}

export interface MockUseMutationHook {
  <T = unknown>(
    mutation: MockConvexMutation
  ): (args?: Record<string, unknown>) => Promise<T>;
}

/**
 * Creates a mock Convex API for testing hook factories
 */
export function createMockConvexApi(): MockConvexApi {
  const createQuery = (name: string): MockConvexQuery => ({
    _tag: 'query',
    name,
  });
  const createMutation = (name: string): MockConvexMutation => ({
    _tag: 'mutation',
    name,
  });

  return {
    auth: {
      queries: {
        getCurrentUser: createQuery('auth.getCurrentUser'),
        getUserProfile: createQuery('auth.getUserProfile'),
        getAuthState: createQuery('auth.getAuthState'),
      },
      mutations: {
        signIn: createMutation('auth.signIn'),
        signUp: createMutation('auth.signUp'),
        signOut: createMutation('auth.signOut'),
      },
    },
    users: {
      queries: {
        getCurrentUser: createQuery('users.getCurrentUser'),
        getUserProfile: createQuery('users.getUserProfile'),
      },
    },
    memberships: {
      queries: {
        getUserMembership: createQuery('memberships.getUserMembership'),
      },
    },
    events: {
      queries: {
        getEvent: createQuery('events.getEvent'),
        getEventMembers: createQuery('events.getEventMembers'),
        getUserEvents: createQuery('events.getUserEvents'),
        getMutualEvents: createQuery('events.getMutualEvents'),
        getEventAvailability: createQuery('events.getEventAvailability'),
      },
      mutations: {
        createEvent: createMutation('events.createEvent'),
        updateEvent: createMutation('events.updateEvent'),
        deleteEvent: createMutation('events.deleteEvent'),
        leaveEvent: createMutation('events.leaveEvent'),
        updateRSVP: createMutation('events.updateRSVP'),
      },
    },
    posts: {
      queries: {
        getPost: createQuery('posts.getPost'),
        getPostDetail: createQuery('posts.getPostDetail'),
        getEventPostFeed: createQuery('posts.getEventPostFeed'),
        getPostReplies: createQuery('posts.getPostReplies'),
      },
      mutations: {
        createPost: createMutation('posts.createPost'),
        updatePost: createMutation('posts.updatePost'),
        deletePost: createMutation('posts.deletePost'),
        createReply: createMutation('posts.createReply'),
        updateReply: createMutation('posts.updateReply'),
        deleteReply: createMutation('posts.deleteReply'),
      },
    },
  };
}

/** Mock user type for tests */
export interface MockUser {
  _id: string;
  _creationTime: number;
  firstName: string;
  lastName: string;
  email: string;
  image: string;
  timezone: string;
}

/** Mock event type for tests */
export interface MockEvent {
  _id: string;
  _creationTime: number;
  title: string;
  description: string;
  chosenDateTime: number;
  location: string;
  creatorId: string;
}

/** Mock post type for tests */
export interface MockPost {
  _id: string;
  _creationTime: number;
  content: string;
  authorId: string;
  eventId: string;
  replyCount: number;
}

/** Mock reply type for tests */
export interface MockReply {
  _id: string;
  _creationTime: number;
  content: string;
  authorId: string;
  postId: string;
}

/** Mock membership type for tests */
export interface MockMembership {
  _id: string;
  _creationTime: number;
  personId: string;
  eventId: string;
  role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
}

/**
 * Test data factories for creating mock data
 */
export const TestDataFactory = {
  /**
   * Create a mock user
   */
  createUser: (overrides: Partial<MockUser> = {}): MockUser => ({
    _id: 'user_123',
    _creationTime: Date.now(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    image: 'https://example.com/avatar.jpg',
    timezone: 'America/New_York',
    ...overrides,
  }),

  /**
   * Create a mock event
   */
  createEvent: (overrides: Partial<MockEvent> = {}): MockEvent => ({
    _id: 'event_123',
    _creationTime: Date.now(),
    title: 'Team Meeting',
    description: 'Weekly team sync',
    chosenDateTime: Date.now() + 86400000, // tomorrow
    location: 'Conference Room A',
    creatorId: 'user_123',
    ...overrides,
  }),

  /**
   * Create a mock post
   */
  createPost: (overrides: Partial<MockPost> = {}): MockPost => ({
    _id: 'post_123',
    _creationTime: Date.now(),
    content: 'This is a test post',
    authorId: 'user_123',
    eventId: 'event_123',
    replyCount: 0,
    ...overrides,
  }),

  /**
   * Create a mock reply
   */
  createReply: (overrides: Partial<MockReply> = {}): MockReply => ({
    _id: 'reply_123',
    _creationTime: Date.now(),
    content: 'This is a test reply',
    authorId: 'user_123',
    postId: 'post_123',
    ...overrides,
  }),

  /**
   * Create a mock membership
   */
  createMembership: (
    overrides: Partial<MockMembership> = {}
  ): MockMembership => ({
    _id: 'membership_123',
    _creationTime: Date.now(),
    personId: 'user_123',
    eventId: 'event_123',
    role: 'ATTENDEE' as const,
    ...overrides,
  }),
};

/**
 * Mock implementations for React hooks used by hook factories
 */
export const MockHooks = {
  /**
   * Creates a mock useQuery implementation
   */
  createMockUseQuery: <T = unknown>(
    defaultData?: T,
    options: {
      loading?: boolean;
      error?: Error;
    } = {}
  ): MockUseQueryHook => {
    return vi.fn().mockReturnValue({
      data: options.loading ? undefined : defaultData,
      isLoading: options.loading ?? false,
      error: options.error ?? undefined,
    });
  },

  /**
   * Creates a mock useMutation implementation
   */
  createMockUseMutation: <T = unknown>(
    mockResult?: T,
    options: {
      shouldReject?: boolean;
      rejectionError?: Error;
    } = {}
  ): MockUseMutationHook => {
    return vi
      .fn()
      .mockReturnValue(
        options.shouldReject
          ? vi
              .fn()
              .mockRejectedValue(
                options.rejectionError ?? new Error('Mutation failed')
              )
          : vi.fn().mockResolvedValue(mockResult ?? { success: true })
      );
  },
};

/** Mock navigation adapter interface */
interface MockNavigationAdapter {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  back: ReturnType<typeof vi.fn>;
  canGoBack: ReturnType<typeof vi.fn>;
}

/** Mock storage adapter interface */
interface MockStorageAdapter {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  getJSON: ReturnType<typeof vi.fn>;
  setJSON: ReturnType<typeof vi.fn>;
}

/** Mock toast adapter interface */
interface MockToastAdapter {
  show: ReturnType<typeof vi.fn>;
  success: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
}

/** Mock focus manager interface */
interface MockFocusManager {
  focus: ReturnType<typeof vi.fn>;
  blur: ReturnType<typeof vi.fn>;
  moveFocus: ReturnType<typeof vi.fn>;
}

/** Mock screen reader manager interface */
interface MockScreenReaderManager {
  announce: ReturnType<typeof vi.fn>;
  isEnabled: ReturnType<typeof vi.fn>;
}

/** Platform test helpers interface */
interface PlatformTestHelpersInterface {
  createMockNavigationAdapter: () => MockNavigationAdapter;
  createMockStorageAdapter: () => MockStorageAdapter;
  createMockToastAdapter: () => MockToastAdapter;
  createMockFocusManager: () => MockFocusManager;
  createMockScreenReaderManager: () => MockScreenReaderManager;
}

/**
 * Platform adapter test helpers
 */
export const PlatformTestHelpers: PlatformTestHelpersInterface = {
  /**
   * Creates a mock navigation adapter
   */
  createMockNavigationAdapter: (): MockNavigationAdapter => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    canGoBack: vi.fn().mockReturnValue(true),
  }),

  /**
   * Creates a mock storage adapter
   */
  createMockStorageAdapter: (): MockStorageAdapter => ({
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    getJSON: vi.fn().mockResolvedValue(null),
    setJSON: vi.fn().mockResolvedValue(undefined),
  }),

  /**
   * Creates a mock toast adapter
   */
  createMockToastAdapter: (): MockToastAdapter => ({
    show: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),

  /**
   * Creates a mock focus manager for accessibility testing
   */
  createMockFocusManager: () => ({
    focus: vi.fn(),
    blur: vi.fn(),
    moveFocus: vi.fn(),
  }),

  /**
   * Creates a mock screen reader manager for accessibility testing
   */
  createMockScreenReaderManager: () => ({
    announce: vi.fn(),
    isEnabled: vi.fn().mockReturnValue(false),
  }),
};

/** Mock device info interface */
interface MockDeviceInfo {
  platform: 'web' | 'mobile';
  isWeb: boolean;
  isMobile: boolean;
}

/** Mock layout info interface */
interface MockLayoutInfo {
  screen: { width: number; height: number };
  window: { width: number; height: number };
  statusBarHeight: number;
}

/** Mock keyboard state interface */
interface MockKeyboardState {
  isVisible: boolean;
  height: number;
  options: Record<string, unknown>;
  listeners: unknown[];
}

/**
 * State management test helpers
 */
export const StateTestHelpers = {
  /**
   * Creates mock device info for device state testing
   */
  createMockDeviceInfo: (
    overrides: Partial<MockDeviceInfo> = {}
  ): MockDeviceInfo => ({
    platform: 'web' as const,
    isWeb: true,
    isMobile: false,
    ...overrides,
  }),

  /**
   * Creates mock layout info for responsive testing
   */
  createMockLayoutInfo: (
    overrides: Partial<MockLayoutInfo> = {}
  ): MockLayoutInfo => ({
    screen: { width: 1920, height: 1080 },
    window: { width: 1920, height: 1080 },
    statusBarHeight: 24,
    ...overrides,
  }),

  /**
   * Creates mock keyboard state
   */
  createMockKeyboardState: (
    overrides: Partial<MockKeyboardState> = {}
  ): MockKeyboardState => ({
    isVisible: false,
    height: 0,
    options: {},
    listeners: [],
    ...overrides,
  }),

  /**
   * Clears all module-level state between tests
   */
  clearGlobalState: () => {
    // Reset any global state variables that might be stored in modules
    // This ensures test isolation
    vi.clearAllMocks();
  },
};

/**
 * Form validation test helpers
 */
export const ValidationTestHelpers = {
  /**
   * Creates test cases for email validation
   */
  emailTestCases: {
    valid: [
      'user@example.com',
      'test.email+tag@example.co.uk',
      'user123@test-domain.com',
    ],
    invalid: [
      '',
      'invalid',
      '@example.com',
      'user@',
      'user@.com',
      'user spaces@example.com',
    ],
  },

  /**
   * Creates test cases for required field validation
   */
  requiredFieldTestCases: {
    valid: ['text', 'a', '   text   '], // whitespace should be trimmed
    invalid: ['', '   '], // Only string values that should fail
  },

  /**
   * Creates test data for form validation testing
   */
  createFormTestData: (
    overrides: Partial<MockFormTestData> = {}
  ): MockFormTestData => ({
    email: { value: 'test@example.com', error: undefined, touched: false },
    password: { value: 'password123', error: undefined, touched: false },
    firstName: { value: 'John', error: undefined, touched: false },
    lastName: { value: 'Doe', error: undefined, touched: false },
    ...overrides,
  }),
};

/** Mock form field type */
interface MockFormField {
  value: string;
  error: string | undefined;
  touched: boolean;
}

/** Mock form test data interface */
interface MockFormTestData {
  email: MockFormField;
  password: MockFormField;
  firstName: MockFormField;
  lastName: MockFormField;
}

/**
 * Date/time test helpers
 */
export const DateTestHelpers = {
  /**
   * Creates fixed test dates for consistent testing
   */
  createTestDates: () => ({
    past: new Date('2024-01-15T10:30:00.000Z'),
    present: new Date('2024-06-15T14:30:00.000Z'),
    future: new Date('2024-12-15T18:30:00.000Z'),
  }),

  /**
   * Test cases for date formatting
   */
  formatTestCases: [
    {
      date: new Date('2024-06-15T14:30:00.000Z'),
      expectedDate: '6/15/2024', // depends on locale
      expectedTime: '2:30 PM', // depends on locale and timezone
      expectedDateTime: '6/15/2024 at 2:30 PM',
    },
  ],
};

/** Async state type for testing */
type _MockAsyncState<T = unknown> = {
  data: T | undefined;
  loading: boolean;
  error: string | undefined;
};

/** Async state test cases interface */
interface AsyncStateTestCases {
  initial: { data: undefined; loading: false; error: undefined };
  loading: { data: undefined; loading: true; error: undefined };
  success: { data: { id: number }; loading: false; error: undefined };
  error: { data: undefined; loading: false; error: string };
}

/** Mock debounced function result interface */
interface MockDebouncedFunctionResult {
  fn: ReturnType<typeof vi.fn>;
  debouncedFn: ReturnType<typeof vi.fn> & {
    cancel: ReturnType<typeof vi.fn>;
    flush: ReturnType<typeof vi.fn>;
  };
}

/** Async test helpers interface */
interface AsyncTestHelpersInterface {
  createAsyncStateTestCases: () => AsyncStateTestCases;
  createMockDebouncedFunction: () => MockDebouncedFunctionResult;
}

/**
 * Async state test helpers
 */
export const AsyncTestHelpers: AsyncTestHelpersInterface = {
  /**
   * Creates test cases for async state transitions
   */
  createAsyncStateTestCases: () => ({
    initial: { data: undefined, loading: false, error: undefined },
    loading: { data: undefined, loading: true, error: undefined },
    success: { data: { id: 123 }, loading: false, error: undefined },
    error: { data: undefined, loading: false, error: 'Test error' },
  }),

  /**
   * Creates a mock debounced function for testing
   */
  createMockDebouncedFunction: () => {
    const fn = vi.fn();
    const debouncedFn = Object.assign(fn, {
      cancel: vi.fn(),
      flush: vi.fn(),
    });
    return { fn, debouncedFn };
  },
};

/**
 * Test setup and teardown utilities
 */
export const TestSetup = {
  /**
   * Sets up clean test environment before each test
   */
  beforeEach: () => {
    StateTestHelpers.clearGlobalState();
    vi.clearAllMocks();
  },

  /**
   * Cleans up after each test
   */
  afterEach: () => {
    StateTestHelpers.clearGlobalState();
    vi.clearAllTimers();
    vi.useRealTimers();
  },

  /**
   * Mock timers for testing time-dependent code
   */
  setupMockTimers: () => {
    vi.useFakeTimers();
    return {
      advance: (ms: number) => vi.advanceTimersByTime(ms),
      runAll: () => vi.runAllTimers(),
      restore: () => vi.useRealTimers(),
    };
  },
};

/**
 * Integration test helpers
 */
export const IntegrationTestHelpers = {
  /**
   * Creates a complete test scenario with user, event, and posts
   */
  createCompleteScenario: () => {
    const user = TestDataFactory.createUser();
    const event = TestDataFactory.createEvent({ creatorId: user._id });
    const post = TestDataFactory.createPost({
      authorId: user._id,
      eventId: event._id,
    });
    const reply = TestDataFactory.createReply({
      authorId: user._id,
      postId: post._id,
    });
    const membership = TestDataFactory.createMembership({
      personId: user._id,
      eventId: event._id,
      role: 'ORGANIZER',
    });

    return { user, event, post, reply, membership };
  },

  /**
   * Creates multi-user scenario for testing interactions
   */
  createMultiUserScenario: () => {
    const organizer = TestDataFactory.createUser({
      firstName: 'Alice',
      email: 'alice@example.com',
    });
    const attendee = TestDataFactory.createUser({
      firstName: 'Bob',
      email: 'bob@example.com',
    });
    const event = TestDataFactory.createEvent({ creatorId: organizer._id });
    const organizerMembership = TestDataFactory.createMembership({
      personId: organizer._id,
      eventId: event._id,
      role: 'ORGANIZER',
    });
    const attendeeMembership = TestDataFactory.createMembership({
      personId: attendee._id,
      eventId: event._id,
      role: 'ATTENDEE',
    });

    return {
      organizer,
      attendee,
      event,
      organizerMembership,
      attendeeMembership,
    };
  },
};
