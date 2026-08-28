import { describe, it, expect, vi, beforeEach } from 'vitest';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  setNavigationAdapter,
  setStorageAdapter,
  setToastAdapter,
  setDeviceInfo,
  setLayoutInfo,
  setDismissKeyboardFunction,
} from '@groupi/shared';
import { setupPlatformAdapters } from '../lib/platform-setup';

describe('Platform Setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize all platform adapters', () => {
    const cleanup = setupPlatformAdapters();

    expect(setNavigationAdapter).toHaveBeenCalledOnce();
    expect(setStorageAdapter).toHaveBeenCalledOnce();
    expect(setToastAdapter).toHaveBeenCalledOnce();
    expect(setDeviceInfo).toHaveBeenCalledOnce();
    expect(setLayoutInfo).toHaveBeenCalledOnce();
    expect(setDismissKeyboardFunction).toHaveBeenCalledOnce();

    expect(typeof cleanup).toBe('function');
  });

  it('should set device info as mobile', () => {
    setupPlatformAdapters();

    expect(setDeviceInfo).toHaveBeenCalledWith({
      platform: 'mobile',
      isWeb: false,
      isMobile: true,
    });
  });

  describe('navigation adapter', () => {
    it('should use expo-router for push navigation', () => {
      setupPlatformAdapters();

      const navAdapter = vi.mocked(setNavigationAdapter).mock.calls[0][0];
      navAdapter.push('/event/123');

      expect(router.push).toHaveBeenCalledWith('/event/123');
    });

    it('should use expo-router for replace navigation', () => {
      setupPlatformAdapters();

      const navAdapter = vi.mocked(setNavigationAdapter).mock.calls[0][0];
      navAdapter.replace('/(tabs)');

      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });

    it('should use expo-router for back navigation', () => {
      setupPlatformAdapters();

      const navAdapter = vi.mocked(setNavigationAdapter).mock.calls[0][0];
      navAdapter.back();

      expect(router.back).toHaveBeenCalled();
    });

    it('should check canGoBack via expo-router', () => {
      setupPlatformAdapters();

      const navAdapter = vi.mocked(setNavigationAdapter).mock.calls[0][0];
      const result = navAdapter.canGoBack();

      expect(router.canGoBack).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('storage adapter', () => {
    it('should use SecureStore for getItem', async () => {
      vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('test-value');
      setupPlatformAdapters();

      const storageAdapter = vi.mocked(setStorageAdapter).mock.calls[0][0];
      const result = await storageAdapter.getItem('test-key');

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test-key');
      expect(result).toBe('test-value');
    });

    it('should use SecureStore for setItem', async () => {
      setupPlatformAdapters();

      const storageAdapter = vi.mocked(setStorageAdapter).mock.calls[0][0];
      await storageAdapter.setItem('key', 'value');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('key', 'value');
    });

    it('should use SecureStore for removeItem', async () => {
      setupPlatformAdapters();

      const storageAdapter = vi.mocked(setStorageAdapter).mock.calls[0][0];
      await storageAdapter.removeItem('key');

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key');
    });
  });
});
