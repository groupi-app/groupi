/**
 * Test setup for React Native mobile app (Expo Router)
 * Configures global test environment and mocks
 */

import { vi } from 'vitest';

// Mock React Native modules. Component tests can inspect the React element tree
// produced with these host names without loading React Native's Flow sources.
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  TextInput: 'TextInput',
  Image: 'Image',
  ScrollView: 'ScrollView',
  Modal: 'Modal',
  Switch: 'Switch',
  ActivityIndicator: 'ActivityIndicator',
  Platform: {
    OS: 'ios',
    select: vi.fn((obj: Record<string, unknown>) => obj.ios ?? obj.default),
  },
  Dimensions: {
    get: vi.fn(() => ({ width: 375, height: 667 })),
    addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  },
  StatusBar: {
    setBarStyle: vi.fn(),
    setBackgroundColor: vi.fn(),
  },
  Alert: {
    alert: vi.fn(),
  },
  StyleSheet: {
    create: vi.fn((styles: Record<string, unknown>) => styles),
    flatten: vi.fn((style: unknown) => style ?? {}),
    compose: vi.fn((first: unknown, second: unknown) => [first, second]),
  },
  Keyboard: {
    dismiss: vi.fn(),
    addListener: vi.fn(() => ({ remove: vi.fn() })),
  },
  AppState: {
    addEventListener: vi.fn(() => ({ remove: vi.fn() })),
    currentState: 'active',
  },
  Linking: {
    openSettings: vi.fn().mockResolvedValue(undefined),
  },
  useColorScheme: vi.fn(() => 'light'),
}));

// RN Primitives publishes JSX in an .mjs file, which Node cannot load in the
// mobile test environment. Slot is an external presentation boundary here.
vi.mock('@rn-primitives/slot', () => ({
  Text: 'Text',
  View: 'View',
  Pressable: 'Pressable',
  Image: 'Image',
}));

// Mock Expo Router
vi.mock('expo-router', () => ({
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    canGoBack: vi.fn(() => true),
  },
  useLocalSearchParams: vi.fn(() => ({})),
  useRootNavigationState: vi.fn(() => ({ key: 'test-navigation' })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    canGoBack: vi.fn(() => true),
  })),
  Link: vi.fn(({ children }: { children: React.ReactNode }) => children),
  Stack: Object.assign(
    vi.fn(({ children }: { children?: React.ReactNode }) => children),
    {
      Screen: vi.fn(() => null),
    }
  ),
  Tabs: Object.assign(
    vi.fn(({ children }: { children?: React.ReactNode }) => children),
    {
      Screen: vi.fn(() => null),
    }
  ),
  Redirect: vi.fn(() => null),
}));

// Mock Expo modules
vi.mock('expo-constants', () => ({
  AppOwnership: {
    Expo: 'expo',
    Guest: 'guest',
    Standalone: 'standalone',
  },
  ExecutionEnvironment: {
    Bare: 'bare',
    Standalone: 'standalone',
    StoreClient: 'storeClient',
  },
  default: {
    appOwnership: 'standalone',
    executionEnvironment: 'standalone',
    expoConfig: {
      extra: {},
    },
    easConfig: null,
  },
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: vi.fn(),
  hideAsync: vi.fn(),
}));

vi.mock('expo-status-bar', () => ({
  StatusBar: vi.fn(() => null),
}));

vi.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4, MAX: 5 },
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn().mockResolvedValue(null),
  getPermissionsAsync: vi.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
    canAskAgain: true,
  }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
    canAskAgain: true,
  }),
  getExpoPushTokenAsync: vi.fn().mockResolvedValue({
    data: 'ExponentPushToken[test-token]',
    type: 'expo',
  }),
  getLastNotificationResponseAsync: vi.fn().mockResolvedValue(null),
  clearLastNotificationResponseAsync: vi.fn().mockResolvedValue(undefined),
  addPushTokenListener: vi.fn(() => ({ remove: vi.fn() })),
  addNotificationReceivedListener: vi.fn(() => ({ remove: vi.fn() })),
  addNotificationResponseReceivedListener: vi.fn(() => ({
    remove: vi.fn(),
  })),
}));

// Mock Safe Area
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: vi.fn(
    ({ children }: { children: React.ReactNode }) => children
  ),
  SafeAreaView: vi.fn(
    ({ children }: { children: React.ReactNode }) => children
  ),
  useSafeAreaInsets: vi.fn(() => ({ top: 0, right: 0, bottom: 0, left: 0 })),
}));

// Mock Gesture Handler
vi.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: vi.fn(
    ({ children }: { children: React.ReactNode }) => children
  ),
}));

// Mock Reanimated v4
vi.mock('react-native-reanimated', () => ({
  default: {
    View: vi.fn(({ children }: { children?: React.ReactNode }) => children),
  },
  useSharedValue: vi.fn((val: unknown) => ({ value: val })),
  useAnimatedStyle: vi.fn(() => ({})),
  withRepeat: vi.fn((val: unknown) => val),
  withTiming: vi.fn((val: unknown) => val),
}));

// Mock Worklets (Reanimated v4 dependency)
vi.mock('react-native-worklets', () => ({}));

// Mock Toast Message
vi.mock('react-native-toast-message', () => ({
  default: vi.fn(() => null),
  show: vi.fn(),
  hide: vi.fn(),
}));

// Mock Convex React
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useQueries: vi.fn(() => ({})),
  useMutation: vi.fn(() => vi.fn()),
  useConvexAuth: vi.fn(() => ({
    isLoading: false,
    isAuthenticated: true,
  })),
  ConvexReactClient: vi.fn(),
}));

// Mock Better Auth
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
  signIn: { email: vi.fn() },
  signUp: { email: vi.fn() },
  signOut: vi.fn(),
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    },
    isPending: false,
  })),
}));

// Mock Convex Provider
vi.mock('@/providers/convex-provider', () => ({
  ConvexClientProvider: vi.fn(
    ({ children }: { children: React.ReactNode }) => children
  ),
}));

// Mock Convex Better Auth Provider
vi.mock('@convex-dev/better-auth/react', () => ({
  ConvexBetterAuthProvider: vi.fn(
    ({ children }: { children: React.ReactNode }) => children
  ),
}));

// Mock Convex generated API
vi.mock('convex/_generated/api', () => ({
  api: {
    auth: { queries: { getCurrentUserAndPerson: 'getCurrentUserAndPerson' } },
    users: { queries: { checkNeedsOnboarding: 'checkNeedsOnboarding' } },
    events: {
      queries: {
        getUserEvents: 'getUserEvents',
        getEventHeaderData: 'getEventHeaderData',
        getEventAttendeesData: 'getEventAttendeesData',
      },
      mutations: {
        createEvent: 'createEvent',
        updateEvent: 'updateEvent',
        deleteEvent: 'deleteEvent',
      },
    },
    posts: {
      queries: { getEventPostFeed: 'getEventPostFeed' },
      mutations: { createPost: 'createPost' },
    },
    pushNotifications: {
      mutations: {
        registerDevice: 'registerPushDevice',
        unregisterDevice: 'unregisterPushDevice',
      },
    },
    notifications: {
      mutations: { markNotificationAsRead: 'markNotificationAsRead' },
    },
  },
}));

// Mock Vector Icons
vi.mock('@expo/vector-icons', () => ({
  Ionicons: vi.fn(() => null),
}));

// Mock Shared Platform
vi.mock('@groupi/shared', () => ({
  setNavigationAdapter: vi.fn(),
  setStorageAdapter: vi.fn(),
  setToastAdapter: vi.fn(),
  setDeviceInfo: vi.fn(),
  setLayoutInfo: vi.fn(),
  setSafeAreaInsets: vi.fn(),
  setKeyboardState: vi.fn(),
  setDismissKeyboardFunction: vi.fn(),
  triggerKeyboardEvent: vi.fn(),
}));

// Mock shared hooks
vi.mock('@groupi/shared/hooks', () => ({
  createEventDataHooks: vi.fn(() => ({
    useUserEvents: vi.fn(),
    useEventHeader: vi.fn(),
    useEventMembers: vi.fn(),
    useEventAvailability: vi.fn(),
    useCanManageEvent: vi.fn(),
    useEventLoadingStates: vi.fn(),
    useMutualEvents: vi.fn(),
  })),
  createEventActionHooks: vi.fn(() => ({
    useCreateEvent: vi.fn(),
    useUpdateEvent: vi.fn(),
    useDeleteEvent: vi.fn(),
    useJoinEvent: vi.fn(),
    useLeaveEvent: vi.fn(),
    useUpdateRSVP: vi.fn(),
    useEventActions: vi.fn(),
    useEventManagement: vi.fn(),
  })),
  createEventHooks: vi.fn(() => ({})),
  createAuthHooks: vi.fn(() => ({
    useCurrentUser: vi.fn(),
    useAuthState: vi.fn(),
    useUserProfile: vi.fn(),
    useUserMembership: vi.fn(),
    useUserPermissions: vi.fn(),
    useAuthGuard: vi.fn(),
    useEventAccessGuard: vi.fn(),
  })),
}));

// Mock shared design themes
vi.mock('@groupi/shared/design/themes', () => ({
  baseThemeRegistry: {
    'groupi-light': {
      id: 'groupi-light',
      name: 'Groupi Light',
      mode: 'light',
      tokens: {},
      preview: { primary: '#8b00b8', background: '#fff', accent: '#ff69b4' },
    },
    'groupi-dark': {
      id: 'groupi-dark',
      name: 'Groupi Dark',
      mode: 'dark',
      tokens: {},
      preview: { primary: '#b266e0', background: '#1a0a20', accent: '#ff69b4' },
    },
  },
  DEFAULT_LIGHT_THEME_ID: 'groupi-light',
  DEFAULT_DARK_THEME_ID: 'groupi-dark',
  groupiLight: {},
  groupiDark: {},
  sharedTokens: {},
}));

// Suppress console noise in tests
global.console.warn = vi.fn();
global.console.error = vi.fn();
