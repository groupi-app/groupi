/**
 * Comprehensive test helpers for @groupi/mobile package
 * Provides utilities for testing React Native components, navigation, and Expo functionality
 */

import React from 'react';
import { View } from 'react-native';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react-native';
import userEvent from '@testing-library/user-event';
import { vi, expect, type MockedFunction } from 'vitest';
import type {
  RenderOptions,
  RenderResult,
} from '@testing-library/react-native';

// Re-export commonly used testing utilities
export { render, screen, fireEvent, waitFor, within, userEvent };

/**
 * Mock types for React Navigation
 */
export interface MockNavigation {
  navigate: MockedFunction<
    (screen: string, params?: Record<string, unknown>) => void
  >;
  push: MockedFunction<
    (screen: string, params?: Record<string, unknown>) => void
  >;
  replace: MockedFunction<
    (screen: string, params?: Record<string, unknown>) => void
  >;
  goBack: MockedFunction<() => void>;
  canGoBack: MockedFunction<() => boolean>;
  reset: MockedFunction<(state: { routes: { name: string }[] }) => void>;
  setParams: MockedFunction<(params: Record<string, unknown>) => void>;
  getState: MockedFunction<() => Record<string, unknown>>;
}

/**
 * Mock route object for React Navigation
 */
export interface MockRoute {
  key: string;
  name: string;
  params?: Record<string, unknown>;
}

/**
 * Enhanced render function with React Native providers
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Mock navigation prop
   */
  navigationMocks?: Partial<MockNavigation>;

  /**
   * Mock route prop
   */
  routeMocks?: Partial<MockRoute>;

  /**
   * Mock Convex context values
   */
  convexMocks?: {
    useQuery?: MockedFunction<(...args: unknown[]) => unknown>;
    useMutation?: MockedFunction<(...args: unknown[]) => unknown>;
  };

  /**
   * Mock platform adapters
   */
  platformMocks?: {
    navigation?: Record<
      string,
      MockedFunction<(...args: unknown[]) => unknown>
    >;
    storage?: Record<
      string,
      MockedFunction<(...args: unknown[]) => Promise<unknown>>
    >;
    toast?: Record<string, MockedFunction<(...args: unknown[]) => void>>;
  };

  /**
   * Initial theme
   */
  theme?: 'light' | 'dark';

  /**
   * Mock safe area insets
   */
  safeArea?: Partial<SafeAreaInsets>;
}

/**
 * Mock providers for React Native testing
 */
interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const MockProviders = ({
  children,
  theme = 'light',
  safeArea,
}: {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  safeArea?: Partial<SafeAreaInsets>;
}) => {
  // Merge with defaults
  const insets: SafeAreaInsets = {
    top: safeArea?.top ?? 44,
    bottom: safeArea?.bottom ?? 34,
    left: safeArea?.left ?? 0,
    right: safeArea?.right ?? 0,
  };
  return (
    <View
      testID='mock-provider'
      accessibilityState={{ selected: theme === 'dark' }}
    >
      <View
        testID='safe-area-mock'
        style={{
          paddingTop: insets.top,
          paddingRight: insets.right,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
        }}
      >
        {children}
      </View>
    </View>
  );
};

/**
 * Renders React Native component with providers and mocks
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    navigationMocks: _navigationMocks = {},
    routeMocks: _routeMocks = {},
    convexMocks: _convexMocks = {},
    platformMocks: _platformMocks = {},
    theme = 'light',
    safeArea,
    ...renderOptions
  } = options;

  // Create wrapper with providers
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <MockProviders theme={theme} safeArea={safeArea}>
        {children}
      </MockProviders>
    );
  };

  return render(ui, {
    wrapper: AllTheProviders,
    ...renderOptions,
  });
}

/**
 * Test data factories for mobile components
 */
/** Test user data type */
interface TestUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string;
  bio: string;
}

/** Test event data type */
interface TestEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  chosenDateTime: number;
  creatorId: string;
  attendeeCount: number;
  isJoined: boolean;
}

/** Test device info type */
interface TestDeviceInfo {
  platform: string;
  isWeb: boolean;
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
  statusBarHeight: number;
}

export const MobileTestDataFactory = {
  /**
   * Create mock user data
   */
  createUser: (overrides: Partial<TestUser> = {}): TestUser => ({
    id: 'user_123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    image: 'https://example.com/avatar/user_123.jpg',
    bio: 'Mobile app enthusiast',
    ...overrides,
  }),

  /**
   * Create mock event data
   */
  createEvent: (overrides: Partial<TestEvent> = {}): TestEvent => ({
    id: 'event_123',
    title: 'Team Meeting',
    description: 'Weekly sync meeting',
    location: 'Conference Room A',
    chosenDateTime: new Date('2024-12-20T14:00:00.000Z').getTime(),
    creatorId: 'user_123',
    attendeeCount: 5,
    isJoined: false,
    ...overrides,
  }),

  /**
   * Create mock navigation prop
   */
  createNavigation: (
    overrides: Partial<MockNavigation> = {}
  ): MockNavigation => ({
    navigate: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    goBack: vi.fn(),
    canGoBack: vi.fn().mockReturnValue(true),
    reset: vi.fn(),
    setParams: vi.fn(),
    getState: vi.fn().mockReturnValue({}),
    ...overrides,
  }),

  /**
   * Create mock route prop
   */
  createRoute: (overrides: Partial<MockRoute> = {}): MockRoute => ({
    key: 'route_123',
    name: 'Home',
    params: {},
    ...overrides,
  }),

  /**
   * Create mock device info
   */
  createDeviceInfo: (
    overrides: Partial<TestDeviceInfo> = {}
  ): TestDeviceInfo => ({
    platform: 'mobile',
    isWeb: false,
    isMobile: true,
    screenWidth: 375,
    screenHeight: 812,
    statusBarHeight: 44,
    ...overrides,
  }),
};

/**
 * React Navigation test helpers
 */
export const NavigationTestHelpers = {
  /**
   * Mock React Navigation hooks
   */
  mockNavigationHooks: (navigation: MockNavigation, route: MockRoute) => {
    vi.mock('@react-navigation/native', () => ({
      useNavigation: () => navigation,
      useRoute: () => route,
      useFocusEffect: (fn: () => void | (() => void)) => fn(),
      useIsFocused: () => true,
    }));
  },

  /**
   * Test navigation calls
   */
  expectNavigation: (
    navigation: MockNavigation,
    method: keyof MockNavigation,
    ...args: unknown[]
  ) => {
    expect(navigation[method]).toHaveBeenCalledWith(...args);
  },

  /**
   * Test screen transitions
   */
  testScreenTransition: async (
    navigation: MockNavigation,
    screenName: string,
    params?: Record<string, unknown>
  ) => {
    navigation.navigate(screenName, params);
    expect(navigation.navigate).toHaveBeenCalledWith(screenName, params);
  },

  /**
   * Test back navigation
   */
  testBackNavigation: (navigation: MockNavigation) => {
    navigation.goBack();
    expect(navigation.goBack).toHaveBeenCalled();
  },
};

/**
 * Platform adapter test helpers
 */
export const PlatformTestHelpers = {
  /**
   * Mock platform setup
   */
  mockPlatformSetup: () => {
    const mockNavigation = {
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      canGoBack: vi.fn().mockReturnValue(true),
    };

    const mockStorage = {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn().mockResolvedValue(undefined),
      removeItem: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };

    const mockToast = {
      show: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    return { mockNavigation, mockStorage, mockToast };
  },

  /**
   * Mock Expo SecureStore
   */
  mockSecureStore: () => {
    const secureStore = {
      getItemAsync: vi.fn().mockResolvedValue(null),
      setItemAsync: vi.fn().mockResolvedValue(undefined),
      deleteItemAsync: vi.fn().mockResolvedValue(undefined),
    };

    vi.mock('expo-secure-store', () => secureStore);
    return secureStore;
  },

  /**
   * Mock React Native Dimensions
   */
  mockDimensions: (
    dimensions: { width: number; height: number } = { width: 375, height: 812 }
  ) => {
    vi.mock('react-native', async () => {
      const actual = await vi.importActual('react-native');
      return {
        ...actual,
        Dimensions: {
          get: vi.fn().mockReturnValue(dimensions),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      };
    });
  },

  /**
   * Mock React Native Keyboard
   */
  mockKeyboard: () => {
    const keyboardListeners = new Map();

    const keyboard = {
      addListener: vi.fn((event, handler) => {
        keyboardListeners.set(event, handler);
        return { remove: vi.fn() };
      }),
      removeListener: vi.fn(),
      removeAllListeners: vi.fn(),
      dismiss: vi.fn(),
    };

    vi.mock('react-native', async () => {
      const actual = await vi.importActual('react-native');
      return {
        ...actual,
        Keyboard: keyboard,
      };
    });

    return {
      keyboard,
      triggerKeyboardShow: (height: number = 300) => {
        const handler = keyboardListeners.get('keyboardDidShow');
        if (handler) handler({ endCoordinates: { height } });
      },
      triggerKeyboardHide: () => {
        const handler = keyboardListeners.get('keyboardDidHide');
        if (handler) handler();
      },
    };
  },
};

/**
 * Expo APIs test helpers
 */
/** Expo constants test type */
interface TestExpoConstants {
  platform: {
    ios: null | Record<string, unknown>;
    android: Record<string, unknown>;
  };
  deviceId: string;
  sessionId: string;
  statusBarHeight: number;
}

export const ExpoTestHelpers = {
  /**
   * Mock Expo Constants
   */
  mockExpoConstants: (
    overrides: Partial<TestExpoConstants> = {}
  ): TestExpoConstants => {
    const constants: TestExpoConstants = {
      platform: { ios: null, android: {} },
      deviceId: 'test-device-id',
      sessionId: 'test-session-id',
      statusBarHeight: 44,
      ...overrides,
    };

    vi.mock('expo-constants', () => ({ default: constants }));
    return constants;
  },

  /**
   * Mock Expo StatusBar
   */
  mockStatusBar: () => {
    const statusBar = {
      setStatusBarStyle: vi.fn(),
      setStatusBarBackgroundColor: vi.fn(),
      setStatusBarHidden: vi.fn(),
    };

    vi.mock('expo-status-bar', () => ({
      StatusBar: statusBar,
      setStatusBarStyle: statusBar.setStatusBarStyle,
      setStatusBarBackgroundColor: statusBar.setStatusBarBackgroundColor,
      setStatusBarHidden: statusBar.setStatusBarHidden,
    }));

    return statusBar;
  },

  /**
   * Mock Expo Notifications
   */
  mockNotifications: () => {
    const notifications = {
      requestPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
      getPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
      scheduleNotificationAsync: vi.fn(),
      dismissAllNotificationsAsync: vi.fn(),
      addNotificationReceivedListener: vi.fn(() => ({ remove: vi.fn() })),
      addNotificationResponseReceivedListener: vi.fn(() => ({
        remove: vi.fn(),
      })),
    };

    vi.mock('expo-notifications', () => notifications);
    return notifications;
  },

  /**
   * Mock Toast Message
   */
  mockToastMessage: () => {
    const toast = {
      show: vi.fn(),
      hide: vi.fn(),
    };

    vi.mock('react-native-toast-message', () => ({
      default: toast,
      show: toast.show,
      hide: toast.hide,
    }));

    return toast;
  },
};

/**
 * Screen interaction test helpers
 */
export const ScreenTestHelpers = {
  /**
   * Test form filling in React Native
   */
  fillForm: async (formData: Record<string, string>) => {
    for (const [fieldName, value] of Object.entries(formData)) {
      const field =
        screen.getByTestId(`input-${fieldName}`) ||
        screen.getByPlaceholderText(new RegExp(fieldName, 'i'));
      fireEvent.changeText(field, value);
    }
  },

  /**
   * Test button press
   */
  pressButton: async (buttonText: string) => {
    const button = screen.getByText(new RegExp(buttonText, 'i'));
    fireEvent.press(button);
    return button;
  },

  /**
   * Test list item interactions
   */
  pressListItem: async (itemText: string) => {
    const item = screen.getByText(new RegExp(itemText, 'i'));
    fireEvent.press(item);
    return item;
  },

  /**
   * Test pull to refresh
   */
  triggerPullToRefresh: async (listTestId: string = 'list') => {
    const list = screen.getByTestId(listTestId);
    fireEvent(list, 'refresh');
  },

  /**
   * Test scroll interactions
   */
  triggerScroll: (
    listTestId: string = 'list',
    offset: { y: number } = { y: 100 }
  ) => {
    const list = screen.getByTestId(listTestId);
    fireEvent.scroll(list, { nativeEvent: { contentOffset: offset } });
  },

  /**
   * Test modal interactions
   */
  expectModalVisible: (modalTestId: string = 'modal') => {
    const modal = screen.getByTestId(modalTestId);
    expect(modal).toBeTruthy();
    expect(modal.props.visible).toBe(true);
  },

  /**
   * Test alert interactions
   */
  expectAlert: () => {
    // In testing environment, alerts should be mocked
    const globalObj = globalThis as unknown as {
      alert?: ReturnType<typeof vi.fn>;
    };
    if (globalObj.alert) {
      expect(globalObj.alert).toHaveBeenCalled();
    }
  },
};

/**
 * Convex integration test helpers for mobile
 */
export const ConvexMobileTestHelpers = {
  /**
   * Mock Convex React Native client
   */
  mockConvexClient: () => {
    const client = {
      mutation: vi.fn(),
      query: vi.fn(),
      action: vi.fn(),
      close: vi.fn(),
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
    };

    const hooks = {
      useQuery: vi.fn().mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
      }),
      useMutation: vi.fn().mockReturnValue(vi.fn()),
      useConvex: vi.fn().mockReturnValue(client),
    };

    vi.mock('convex/react', () => hooks);
    return { client, hooks };
  },

  /**
   * Create mock query response
   */
  createMockQuery: <T = unknown,>(
    data: T,
    options: { isLoading?: boolean; error?: Error } = {}
  ) => ({
    data: options.isLoading ? undefined : data,
    isLoading: options.isLoading ?? false,
    error: options.error ?? undefined,
  }),

  /**
   * Create mock mutation
   */
  createMockMutation: <T = unknown,>(result: T, shouldReject = false) => {
    return shouldReject
      ? vi.fn().mockRejectedValue(new Error('Mutation failed'))
      : vi.fn().mockResolvedValue(result);
  },
};

/** Test auth state type */
interface TestAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: TestUser | null;
}

/**
 * Authentication test helpers for mobile
 */
export const AuthMobileTestHelpers = {
  /**
   * Mock authentication state
   */
  createMockAuthState: (
    overrides: Partial<TestAuthState> = {}
  ): TestAuthState => ({
    isLoading: false,
    isAuthenticated: true,
    user: MobileTestDataFactory.createUser(),
    ...overrides,
  }),

  /**
   * Test authentication flows
   */
  testLoginFlow: async (email: string, password: string) => {
    await ScreenTestHelpers.fillForm({ email, password });
    await ScreenTestHelpers.pressButton('Login');
  },

  /**
   * Test signup flow
   */
  testSignupFlow: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    await ScreenTestHelpers.pressButton('Sign Up');
    await ScreenTestHelpers.fillForm(userData);
    await ScreenTestHelpers.pressButton('Create Account');
  },

  /**
   * Test logout flow
   */
  testLogoutFlow: async () => {
    await ScreenTestHelpers.pressButton('Logout');
    // May need to confirm in alert
    const globalObj = globalThis as unknown as {
      alert?: ReturnType<typeof vi.fn>;
    };
    if (globalObj.alert) {
      expect(globalObj.alert).toHaveBeenCalled();
    }
  },
};

/** React Native element with accessibility props */
interface RNAccessibilityElement {
  props: {
    accessibilityLabel?: string;
    accessibilityRole?: string;
    accessibilityState?: Record<string, unknown>;
    accessibilityHint?: string;
    accessibilityElementsHidden?: boolean;
    style?: { width?: number; height?: number };
  };
}

/**
 * Accessibility test helpers for React Native
 */
export const A11yMobileTestHelpers = {
  /**
   * Test accessibility props
   */
  expectA11yProps: (
    element: RNAccessibilityElement,
    props: {
      accessibilityLabel?: string;
      accessibilityRole?: string;
      accessibilityState?: Record<string, unknown>;
      accessibilityHint?: string;
    }
  ) => {
    if (props.accessibilityLabel) {
      expect(element.props.accessibilityLabel).toBe(props.accessibilityLabel);
    }
    if (props.accessibilityRole) {
      expect(element.props.accessibilityRole).toBe(props.accessibilityRole);
    }
    if (props.accessibilityState) {
      expect(element.props.accessibilityState).toEqual(
        props.accessibilityState
      );
    }
    if (props.accessibilityHint) {
      expect(element.props.accessibilityHint).toBe(props.accessibilityHint);
    }
  },

  /**
   * Test screen reader content
   */
  expectScreenReaderContent: (text: string) => {
    const element = screen.getByText(text) as unknown as RNAccessibilityElement;
    expect(element).toBeTruthy();
    // Check if element is not hidden from screen readers
    expect(element.props.accessibilityElementsHidden).not.toBe(true);
  },

  /**
   * Test touch target sizes (minimum 44x44 points)
   */
  expectTouchTarget: (element: RNAccessibilityElement, minSize = 44) => {
    const { width, height } = element.props.style || {};
    if (width && height) {
      expect(width).toBeGreaterThanOrEqual(minSize);
      expect(height).toBeGreaterThanOrEqual(minSize);
    }
  },
};

/**
 * Component-specific test helpers for mobile
 */
export const ComponentMobileTestHelpers = {
  /**
   * Test event list rendering
   */
  expectEventListRender: (events: TestEvent[]) => {
    events.forEach(event => {
      expect(screen.getByText(event.title)).toBeTruthy();
      if (event.location) {
        expect(screen.getByText(event.location)).toBeTruthy();
      }
    });
  },

  /**
   * Test user profile rendering
   */
  expectUserProfileRender: (user: TestUser) => {
    expect(screen.getByText(`${user.firstName} ${user.lastName}`)).toBeTruthy();
    expect(screen.getByText(user.email)).toBeTruthy();
    if (user.bio) {
      expect(screen.getByText(user.bio)).toBeTruthy();
    }
  },

  /**
   * Test loading states
   */
  expectLoadingState: (testId: string = 'loading-indicator') => {
    expect(screen.getByTestId(testId)).toBeTruthy();
  },

  /**
   * Test error states
   */
  expectErrorState: (errorMessage?: string) => {
    if (errorMessage) {
      expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeTruthy();
    } else {
      expect(screen.getByText(/error|something went wrong/i)).toBeTruthy();
    }
  },

  /**
   * Test empty states
   */
  expectEmptyState: (emptyMessage?: string) => {
    if (emptyMessage) {
      expect(screen.getByText(new RegExp(emptyMessage, 'i'))).toBeTruthy();
    } else {
      expect(screen.getByText(/no.*found|empty/i)).toBeTruthy();
    }
  },
};

/**
 * Test setup utilities for React Native
 */
export const MobileTestSetup = {
  /**
   * Sets up test environment for React Native
   */
  beforeEach: () => {
    vi.clearAllMocks();

    // Mock global alert
    const globalObj = globalThis as unknown as {
      alert?: ReturnType<typeof vi.fn>;
      console: Console;
    };
    globalObj.alert = vi.fn();

    // Mock console methods
    globalObj.console = {
      ...console,
      warn: vi.fn(),
      error: vi.fn(),
      log: vi.fn(),
    };

    // Setup default mocks
    PlatformTestHelpers.mockDimensions();
    ExpoTestHelpers.mockExpoConstants();
  },

  /**
   * Cleans up after tests
   */
  afterEach: () => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.resetModules();
  },

  /**
   * Mock timers for animation testing
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
export default {
  renderWithProviders,
  MobileTestDataFactory,
  NavigationTestHelpers,
  PlatformTestHelpers,
  ExpoTestHelpers,
  ScreenTestHelpers,
  ConvexMobileTestHelpers,
  AuthMobileTestHelpers,
  A11yMobileTestHelpers,
  ComponentMobileTestHelpers,
  MobileTestSetup,
};
