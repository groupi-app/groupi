/**
 * Test setup for React Native mobile app
 * Configures global test environment and mocks
 */

import { vi } from 'vitest';

// Mock React Native modules that don't exist in Node environment
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: vi.fn(obj => obj.ios || obj.default),
  },
  Dimensions: {
    get: vi.fn(() => ({ width: 375, height: 667 })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  StatusBar: {
    setBarStyle: vi.fn(),
    setBackgroundColor: vi.fn(),
  },
  Alert: {
    alert: vi.fn(),
  },
  StyleSheet: {
    create: vi.fn(styles => styles),
  },
}));

// Mock Expo modules
vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        convex: {
          url: 'https://test.convex.cloud',
        },
      },
    },
  },
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('expo-notifications', () => ({
  requestPermissionsAsync: vi.fn(),
  getPermissionsAsync: vi.fn(),
  setNotificationHandler: vi.fn(),
}));

// Mock React Navigation
vi.mock('@react-navigation/native', () => ({
  useNavigation: vi.fn(() => ({
    navigate: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    goBack: vi.fn(),
    canGoBack: vi.fn(() => true),
  })),
  useFocusEffect: vi.fn(),
  useRoute: vi.fn(() => ({
    params: {},
  })),
}));

// Mock Toast Message
vi.mock('react-native-toast-message', () => ({
  show: vi.fn(),
  hide: vi.fn(),
}));

// Mock Convex React (will be overridden in specific tests)
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useConvexAuth: vi.fn(() => ({
    isLoading: false,
    isAuthenticated: true,
  })),
}));

// Global test utilities
global.console.warn = vi.fn();
global.console.error = vi.fn();
