/**
 * Comprehensive test helpers for @groupi/web package
 * Provides utilities for testing React components, hooks, and Next.js functionality
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Test helpers use 'any' types intentionally for flexibility in mocking and test data creation
// Some destructured options are defined for API compatibility but not yet used in implementation

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, type MockedFunction } from 'vitest';
import type { RenderOptions, RenderResult } from '@testing-library/react';

// Re-export commonly used testing utilities
export { render, screen, fireEvent, waitFor, within, userEvent };

/**
 * Mock types for Convex integration
 */
export interface MockConvexContext {
  useQuery: MockedFunction<any>;
  useMutation: MockedFunction<any>;
  useConvex: MockedFunction<any>;
}

/**
 * Enhanced render function with common providers
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Mock Convex context values
   */
  convexMocks?: Partial<MockConvexContext>;

  /**
   * Mock Next.js router values
   */
  routerMocks?: {
    push?: MockedFunction<any>;
    replace?: MockedFunction<any>;
    back?: MockedFunction<any>;
    pathname?: string;
    query?: Record<string, string>;
  };

  /**
   * Mock user authentication state
   */
  authMocks?: {
    isLoading?: boolean;
    isAuthenticated?: boolean;
    user?: any;
  };

  /**
   * Initial theme for theme provider
   */
  theme?: 'light' | 'dark';

  /**
   * Mock toast notifications
   */
  toastMocks?: {
    success?: MockedFunction<any>;
    error?: MockedFunction<any>;
    info?: MockedFunction<any>;
  };
}

/**
 * Renders component with all necessary providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    convexMocks = {},
    routerMocks = {},
    authMocks = {},
    theme = 'light',
    toastMocks = {},
    ...renderOptions
  } = options;

  // Create wrapper with all providers
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <div data-theme={theme}>{children}</div>;
  };

  return render(ui, {
    wrapper: AllTheProviders,
    ...renderOptions,
  });
}

/**
 * Test data factories for web components
 */
export const WebTestDataFactory = {
  /**
   * Create mock user data for components
   */
  createUser: (overrides: Partial<any> = {}) => ({
    id: 'user_123',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    username: 'johndoe',
    image: '/avatars/user_123.jpg',
    bio: 'Software developer',
    timezone: 'America/New_York',
    ...overrides,
  }),

  /**
   * Create mock event data
   */
  createEvent: (overrides: Partial<any> = {}) => ({
    id: 'event_123',
    title: 'Team Meeting',
    description: 'Weekly team sync meeting to discuss progress and blockers',
    location: 'Conference Room A',
    chosenDateTime: new Date('2024-12-20T14:00:00.000Z').getTime(),
    potentialDateTimes: [
      new Date('2024-12-20T14:00:00.000Z').getTime(),
      new Date('2024-12-21T10:00:00.000Z').getTime(),
    ],
    timezone: 'America/New_York',
    creatorId: 'user_123',
    attendeeCount: 5,
    ...overrides,
  }),

  /**
   * Create mock post data
   */
  createPost: (overrides: Partial<any> = {}) => ({
    id: 'post_123',
    title: 'Project Update',
    content:
      'Here is an update on our current project status. We have made significant progress this week.',
    authorId: 'user_123',
    eventId: 'event_123',
    createdAt: new Date('2024-06-15T10:00:00.000Z').getTime(),
    editedAt: new Date('2024-06-15T10:00:00.000Z').getTime(),
    replyCount: 3,
    author: WebTestDataFactory.createUser(),
    event: WebTestDataFactory.createEvent(),
    ...overrides,
  }),

  /**
   * Create mock reply data
   */
  createReply: (overrides: Partial<any> = {}) => ({
    id: 'reply_123',
    text: 'Thanks for the update! This looks great.',
    authorId: 'user_456',
    postId: 'post_123',
    createdAt: new Date('2024-06-15T11:00:00.000Z').getTime(),
    author: WebTestDataFactory.createUser({
      id: 'user_456',
      name: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
    }),
    ...overrides,
  }),

  /**
   * Create mock membership data
   */
  createMembership: (overrides: Partial<any> = {}) => ({
    id: 'membership_123',
    userId: 'user_123',
    eventId: 'event_123',
    role: 'ATTENDEE' as const,
    rsvpStatus: 'YES' as const,
    joinedAt: new Date('2024-06-01T09:00:00.000Z').getTime(),
    ...overrides,
  }),

  /**
   * Create mock notification data
   */
  createNotification: (overrides: Partial<any> = {}) => ({
    id: 'notification_123',
    type: 'NEW_POST' as const,
    title: 'New post in Team Meeting',
    message: 'John Doe posted an update',
    isRead: false,
    createdAt: new Date().getTime(),
    userId: 'user_123',
    eventId: 'event_123',
    postId: 'post_123',
    ...overrides,
  }),

  /**
   * Create mock invite data
   */
  createInvite: (overrides: Partial<any> = {}) => ({
    id: 'invite_123',
    eventId: 'event_123',
    email: 'invitee@example.com',
    name: 'New Member',
    role: 'ATTENDEE' as const,
    status: 'PENDING' as const,
    createdAt: new Date().getTime(),
    createdBy: 'user_123',
    ...overrides,
  }),
};

/**
 * Mock implementations for Next.js router
 */
export const RouterTestHelpers = {
  /**
   * Creates a mock Next.js router
   */
  createMockRouter: (overrides: Partial<any> = {}) => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/dashboard',
    query: {},
    asPath: '/dashboard',
    route: '/dashboard',
    isReady: true,
    ...overrides,
  }),

  /**
   * Mock useRouter hook
   */
  mockUseRouter: (
    router: ReturnType<typeof RouterTestHelpers.createMockRouter>
  ) => {
    vi.mock('next/navigation', () => ({
      useRouter: () => router,
      usePathname: () => router.pathname,
      useSearchParams: () =>
        new URLSearchParams(
          Object.entries(router.query).map(([k, v]) => [k, String(v)])
        ),
    }));
  },
};

/**
 * Mock implementations for Convex integration
 */
export const ConvexTestHelpers = {
  /**
   * Creates mock Convex query hook
   */
  createMockUseQuery: <T = any,>(
    data?: T,
    options: {
      isLoading?: boolean;
      error?: Error;
    } = {}
  ) => {
    return vi.fn().mockReturnValue({
      data: options.isLoading ? undefined : data,
      isLoading: options.isLoading ?? false,
      error: options.error ?? undefined,
    });
  },

  /**
   * Creates mock Convex mutation hook
   */
  createMockUseMutation: <T = any,>(
    result?: T,
    options: {
      shouldReject?: boolean;
      error?: Error;
    } = {}
  ) => {
    const mockMutation = options.shouldReject
      ? vi.fn().mockRejectedValue(options.error ?? new Error('Mutation failed'))
      : vi.fn().mockResolvedValue(result ?? { success: true });

    return vi.fn().mockReturnValue(mockMutation);
  },

  /**
   * Mocks the Convex client
   */
  mockConvexClient: (overrides: Partial<any> = {}) => {
    vi.mock('convex/react', () => ({
      useQuery: ConvexTestHelpers.createMockUseQuery(),
      useMutation: ConvexTestHelpers.createMockUseMutation(),
      useConvex: vi.fn().mockReturnValue({}),
      ...overrides,
    }));
  },
};

/**
 * Authentication test helpers
 */
export const AuthTestHelpers = {
  /**
   * Creates mock auth state
   */
  createMockAuthState: (overrides: Partial<any> = {}) => ({
    isLoading: false,
    isAuthenticated: true,
    user: WebTestDataFactory.createUser(),
    ...overrides,
  }),

  /**
   * Mock Better Auth hooks
   */
  mockAuthHooks: (
    authState: ReturnType<typeof AuthTestHelpers.createMockAuthState>
  ) => {
    vi.mock('@/lib/auth-client', () => ({
      useSession: vi.fn().mockReturnValue({
        data: authState.isAuthenticated ? { user: authState.user } : null,
        isPending: authState.isLoading,
        error: null,
      }),
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    }));
  },
};

/**
 * Form testing utilities
 */
export const FormTestHelpers = {
  /**
   * Fills out a form with test data
   */
  fillForm: async (formData: Record<string, string>) => {
    const user = userEvent.setup();

    for (const [fieldName, value] of Object.entries(formData)) {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
      await user.clear(field);
      await user.type(field, value);
    }
  },

  /**
   * Submits a form and waits for submission
   */
  submitForm: async (buttonText: string = 'Submit') => {
    const user = userEvent.setup();
    const submitButton = screen.getByRole('button', {
      name: new RegExp(buttonText, 'i'),
    });
    await user.click(submitButton);
  },

  /**
   * Validates form error messages
   */
  expectFormErrors: (expectedErrors: string[]) => {
    expectedErrors.forEach(error => {
      expect(screen.getByText(new RegExp(error, 'i'))).toBeInTheDocument();
    });
  },

  /**
   * Validates form success state
   */
  expectFormSuccess: async (successMessage?: string) => {
    if (successMessage) {
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(successMessage, 'i'))
        ).toBeInTheDocument();
      });
    }
  },
};

/**
 * Component interaction helpers
 */
export const InteractionTestHelpers = {
  /**
   * Tests button click interactions
   */
  clickButton: async (buttonText: string) => {
    const user = userEvent.setup();
    const button = screen.getByRole('button', {
      name: new RegExp(buttonText, 'i'),
    });
    await user.click(button);
    return button;
  },

  /**
   * Tests link navigation
   */
  clickLink: async (linkText: string) => {
    const user = userEvent.setup();
    const link = screen.getByRole('link', { name: new RegExp(linkText, 'i') });
    await user.click(link);
    return link;
  },

  /**
   * Tests dialog interactions
   */
  openDialog: async (triggerText: string) => {
    await InteractionTestHelpers.clickButton(triggerText);

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  },

  /**
   * Tests closing dialogs
   */
  closeDialog: async () => {
    const user = userEvent.setup();

    // Try to find close button or click outside
    const closeButton = screen.queryByRole('button', { name: /close/i });
    if (closeButton) {
      await user.click(closeButton);
    } else {
      // Click outside dialog
      fireEvent.keyDown(document.body, { key: 'Escape' });
    }

    // Wait for dialog to disappear
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },

  /**
   * Tests dropdown/select interactions
   */
  selectOption: async (selectLabel: string, optionText: string) => {
    const user = userEvent.setup();
    const select = screen.getByLabelText(new RegExp(selectLabel, 'i'));
    await user.click(select);

    const option = await screen.findByRole('option', {
      name: new RegExp(optionText, 'i'),
    });
    await user.click(option);
  },

  /**
   * Tests tab navigation
   */
  switchTab: async (tabText: string) => {
    const user = userEvent.setup();
    const tab = screen.getByRole('tab', { name: new RegExp(tabText, 'i') });
    await user.click(tab);
  },
};

/**
 * Mock API responses for testing
 */
export const ApiTestHelpers = {
  /**
   * Creates mock API response for successful operations
   */
  createSuccessResponse: <T = any,>(data: T) => ({
    success: true,
    data,
    message: 'Operation completed successfully',
  }),

  /**
   * Creates mock API response for errors
   */
  createErrorResponse: (message: string = 'Something went wrong') => ({
    success: false,
    error: message,
    data: null,
  }),

  /**
   * Mock fetch responses
   */
  mockFetch: (response: any, options: { shouldReject?: boolean } = {}) => {
    const mockResponse = {
      ok: !options.shouldReject,
      json: vi.fn().mockResolvedValue(response),
      text: vi.fn().mockResolvedValue(JSON.stringify(response)),
    };

    global.fetch = vi
      .fn()
      .mockImplementation(() =>
        options.shouldReject
          ? Promise.reject(new Error('Network error'))
          : Promise.resolve(mockResponse)
      );
  },
};

/**
 * Loading and error state helpers
 */
export const StateTestHelpers = {
  /**
   * Tests loading states
   */
  expectLoadingState: () => {
    expect(screen.getByTestId(/loading|spinner/i)).toBeInTheDocument();
  },

  /**
   * Tests error states
   */
  expectErrorState: (errorMessage?: string) => {
    if (errorMessage) {
      expect(
        screen.getByText(new RegExp(errorMessage, 'i'))
      ).toBeInTheDocument();
    } else {
      expect(
        screen.getByText(/error|something went wrong/i)
      ).toBeInTheDocument();
    }
  },

  /**
   * Tests empty states
   */
  expectEmptyState: (emptyMessage?: string) => {
    if (emptyMessage) {
      expect(
        screen.getByText(new RegExp(emptyMessage, 'i'))
      ).toBeInTheDocument();
    } else {
      expect(screen.getByText(/no.*found|empty|nothing/i)).toBeInTheDocument();
    }
  },

  /**
   * Tests success states
   */
  expectSuccessState: async (successMessage?: string) => {
    if (successMessage) {
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(successMessage, 'i'))
        ).toBeInTheDocument();
      });
    }
  },
};

/**
 * URL and navigation testing
 */
export const UrlTestHelpers = {
  /**
   * Mock window.location
   */
  mockLocation: (url: string) => {
    delete (window as any).location;
    (window as any).location = new URL(url);
  },

  /**
   * Test URL changes
   */
  expectUrlChange: (expectedUrl: string) => {
    expect(window.location.href).toBe(expectedUrl);
  },
};

/**
 * Accessibility testing helpers
 */
export const A11yTestHelpers = {
  /**
   * Tests ARIA attributes
   */
  expectAriaLabel: (element: HTMLElement, expectedLabel: string) => {
    expect(element).toHaveAttribute('aria-label', expectedLabel);
  },

  /**
   * Tests keyboard navigation
   */
  testKeyboardNavigation: async (element: HTMLElement) => {
    const user = userEvent.setup();

    // Test focus
    element.focus();
    expect(element).toHaveFocus();

    // Test Enter key
    await user.keyboard('{Enter}');

    // Test Space key
    await user.keyboard(' ');

    // Test Tab navigation
    await user.keyboard('{Tab}');
  },

  /**
   * Tests screen reader content
   */
  expectScreenReaderContent: (text: string) => {
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByText(text)).not.toHaveClass('sr-only');
  },
};

/**
 * Component-specific test helpers
 */
export const ComponentTestHelpers = {
  /**
   * Tests post component rendering
   */
  expectPostRender: (post: any) => {
    expect(screen.getByText(post.title)).toBeInTheDocument();
    expect(screen.getByText(post.content)).toBeInTheDocument();
    expect(screen.getByText(post.author.name)).toBeInTheDocument();
  },

  /**
   * Tests event component rendering
   */
  expectEventRender: (event: any) => {
    expect(screen.getByText(event.title)).toBeInTheDocument();
    if (event.description) {
      expect(screen.getByText(event.description)).toBeInTheDocument();
    }
    if (event.location) {
      expect(screen.getByText(event.location)).toBeInTheDocument();
    }
  },

  /**
   * Tests notification component rendering
   */
  expectNotificationRender: (notification: any) => {
    expect(screen.getByText(notification.title)).toBeInTheDocument();
    expect(screen.getByText(notification.message)).toBeInTheDocument();
  },

  /**
   * Tests user profile rendering
   */
  expectUserProfileRender: (user: any) => {
    expect(screen.getByText(user.name)).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
    if (user.bio) {
      expect(screen.getByText(user.bio)).toBeInTheDocument();
    }
  },
};

/**
 * Test setup utilities
 */
export const TestSetup = {
  /**
   * Sets up test environment
   */
  beforeEach: () => {
    vi.clearAllMocks();

    // Clear localStorage
    localStorage.clear();

    // Reset location
    delete (window as any).location;
    (window as any).location = { href: 'http://localhost:3000' };
  },

  /**
   * Cleans up after tests
   */
  afterEach: () => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  },

  /**
   * Mock timers for testing
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

// Default export with all helpers
const testHelpers = {
  renderWithProviders,
  WebTestDataFactory,
  RouterTestHelpers,
  ConvexTestHelpers,
  AuthTestHelpers,
  FormTestHelpers,
  InteractionTestHelpers,
  ApiTestHelpers,
  StateTestHelpers,
  UrlTestHelpers,
  A11yTestHelpers,
  ComponentTestHelpers,
  TestSetup,
};

export default testHelpers;
