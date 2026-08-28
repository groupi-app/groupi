/**
 * Platform adapter setup for React Native with Expo Router
 * Configures all platform-specific implementations
 */

import React from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardEventListener,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

/**
 * Setup all platform adapters for React Native with Expo Router
 */
export function setupPlatformAdapters() {
  // Navigation adapter using Expo Router
  setNavigationAdapter({
    push(path: string) {
      router.push(path as never);
    },
    replace(path: string) {
      router.replace(path as never);
    },
    back() {
      if (router.canGoBack()) {
        router.back();
      }
    },
    canGoBack(): boolean {
      return router.canGoBack();
    },
  });

  // Storage adapter using Expo SecureStore
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
      console.warn(
        'SecureStore.clear() not implemented - would need to track keys'
      );
    },
  });

  // Toast adapter
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

  // Device info
  setDeviceInfo({
    platform: 'mobile',
    isWeb: false,
    isMobile: true,
  });

  // Layout info
  const screen = Dimensions.get('screen');
  const window = Dimensions.get('window');

  setLayoutInfo({
    screen: { width: screen.width, height: screen.height },
    window: { width: window.width, height: window.height },
    statusBarHeight: Platform.OS === 'ios' ? 20 : 0,
  });

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

  // Keyboard handling
  setDismissKeyboardFunction(() => {
    Keyboard.dismiss();
  });

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

  return () => {
    subscription?.remove();
    keyboardShowSubscription.remove();
    keyboardHideSubscription.remove();
  };
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
