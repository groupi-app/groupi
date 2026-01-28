/**
 * Platform adapter setup for React Native
 * Configures all platform-specific implementations
 */

import React from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardEventListener,
  Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainerRef } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import shared platform adapters
import {
  setNavigationAdapter,
  setStorageAdapter,
  setToastAdapter,
  setDeviceInfo,
  setLayoutInfo,
  setSafeAreaInsets,
  setKeyboardState,
  setDismissKeyboardFunction,
  triggerKeyboardEvent,
} from '@groupi/shared';

/** Route params type for navigation - matches RootStackParamList in App.tsx */
type RouteParams = Record<string, unknown>;

// Navigation reference with generic params
let navigationRef: NavigationContainerRef<RouteParams> | null = null;

export function setNavigationRef(ref: NavigationContainerRef<RouteParams>) {
  navigationRef = ref;
}

/**
 * Setup all platform adapters for React Native
 */
export function setupPlatformAdapters() {
  // Setup navigation adapter
  setNavigationAdapter({
    push(path: string) {
      if (navigationRef?.isReady()) {
        // Parse React Navigation route
        const [routeName, params] = parseRoute(path);
        navigationRef.navigate(routeName, params);
      }
    },
    replace(path: string) {
      if (navigationRef?.isReady()) {
        const [routeName, params] = parseRoute(path);
        navigationRef.reset({
          index: 0,
          routes: [{ name: routeName, params }],
        });
      }
    },
    back() {
      if (navigationRef?.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
      }
    },
    canGoBack(): boolean {
      return navigationRef?.canGoBack() || false;
    },
  });

  // Setup storage adapter using Expo SecureStore
  setStorageAdapter({
    async getItem(key: string): Promise<string | null> {
      return await SecureStore.getItemAsync(key);
    },
    async setItem(key: string, value: string): Promise<void> {
      await SecureStore.setItemAsync(key, value);
    },
    async removeItem(key: string): Promise<void> {
      await SecureStore.deleteItemAsync(key);
    },
    async clear(): Promise<void> {
      // Note: SecureStore doesn't have a clear all method
      // In practice, you'd need to track keys separately
      console.warn(
        'SecureStore.clear() not implemented - would need to track keys'
      );
    },
  });

  // Setup toast adapter (using react-native-toast-message API)
  setToastAdapter({
    show(options) {
      Toast.show({
        type: options.variant === 'destructive' ? 'error' : 'success',
        text1: options.title,
        text2: options.description,
        visibilityTime: options.duration || 3000,
        position: 'top',
      });
    },
    success(message: string, title?: string) {
      Toast.show({
        type: 'success',
        text1: title || 'Success',
        text2: message,
        position: 'top',
      });
    },
    error(message: string, title?: string) {
      Toast.show({
        type: 'error',
        text1: title || 'Error',
        text2: message,
        position: 'top',
      });
    },
    info(message: string, title?: string) {
      Toast.show({
        type: 'info',
        text1: title || 'Info',
        text2: message,
        position: 'top',
      });
    },
  });

  // Setup device info
  setDeviceInfo({
    platform: 'mobile',
    isWeb: false,
    isMobile: true,
  });

  // Setup layout info
  const screen = Dimensions.get('screen');
  const window = Dimensions.get('window');

  setLayoutInfo({
    screen: { width: screen.width, height: screen.height },
    window: { width: window.width, height: window.height },
    statusBarHeight: Platform.OS === 'ios' ? 20 : 0, // Basic implementation
  });

  // Listen for dimension changes
  const subscription = Dimensions.addEventListener(
    'change',
    ({ screen, window }) => {
      setLayoutInfo({
        screen: { width: screen.width, height: screen.height },
        window: { width: window.width, height: window.height },
        statusBarHeight: Platform.OS === 'ios' ? 20 : 0,
      });
    }
  );

  // Setup keyboard handling
  setDismissKeyboardFunction(() => {
    Keyboard.dismiss();
  });

  // Setup keyboard event listeners
  const keyboardDidShowListener: KeyboardEventListener = e => {
    setKeyboardState({
      isVisible: true,
      height: e.endCoordinates.height,
    });
    triggerKeyboardEvent({
      type: 'show',
      height: e.endCoordinates.height,
      duration: e.duration,
    });
  };

  const keyboardDidHideListener: KeyboardEventListener = e => {
    setKeyboardState({
      isVisible: false,
      height: 0,
    });
    triggerKeyboardEvent({
      type: 'hide',
      height: 0,
      duration: e.duration,
    });
  };

  const keyboardShowSubscription = Keyboard.addListener(
    'keyboardDidShow',
    keyboardDidShowListener
  );
  const keyboardHideSubscription = Keyboard.addListener(
    'keyboardDidHide',
    keyboardDidHideListener
  );

  // Return cleanup function
  return () => {
    subscription?.remove();
    keyboardShowSubscription.remove();
    keyboardHideSubscription.remove();
  };
}

/** Parsed route type - tuple of route name and params */
type ParsedRoute = [string, Record<string, string | undefined>];

/**
 * Parse web-style routes into React Navigation format
 */
function parseRoute(path: string): ParsedRoute {
  // Convert web paths to React Navigation routes
  // Example: "/event/123" -> ["Event", { eventId: "123" }]

  if (path === '/' || path === '/home') {
    return ['Home', {}];
  }

  if (path === '/auth') {
    return ['Auth', {}];
  }

  if (path.startsWith('/event/')) {
    const eventId = path.split('/')[2];
    return ['Event', { eventId }];
  }

  if (path.startsWith('/profile')) {
    const userId = path.split('/')[2];
    return ['Profile', userId ? { userId } : {}];
  }

  // Default to Home
  return ['Home', {}];
}

/**
 * Hook to setup safe area insets in components
 */
export function usePlatformSafeArea() {
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    setSafeAreaInsets({
      top: insets.top,
      right: insets.right,
      bottom: insets.bottom,
      left: insets.left,
    });
  }, [insets]);

  return insets;
}
