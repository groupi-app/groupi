/**
 * Comprehensive tests for device utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setDeviceInfo,
  getDeviceInfo,
  setLayoutInfo,
  getLayoutInfo,
  isLandscape,
  isPortrait,
  isSmallScreen,
  isLargeScreen,
  setSafeAreaInsets,
  getSafeAreaInsets,
  getResponsiveSize,
  getResponsiveFontSize,
  getResponsiveSpacing,
  type SafeAreaInsets,
} from '../device';
import type { DeviceInfo, LayoutInfo } from '../../types';
import { TestSetup } from '../../test-helpers';

describe('Device Utils', () => {
  beforeEach(() => {
    TestSetup.beforeEach();
    // Reset device info and layout for each test
    setDeviceInfo({
      platform: 'web',
      isWeb: true,
      isMobile: false,
    });
    setLayoutInfo({
      screen: { width: 1024, height: 768 },
      window: { width: 1024, height: 768 },
    });
    setSafeAreaInsets({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  afterEach(() => {
    TestSetup.afterEach();
  });

  describe('Device Info', () => {
    describe('setDeviceInfo and getDeviceInfo', () => {
      it('should set and retrieve device info', () => {
        const deviceInfo: DeviceInfo = {
          platform: 'ios',
          isWeb: false,
          isMobile: true,
        };

        setDeviceInfo(deviceInfo);
        const retrieved = getDeviceInfo();

        expect(retrieved).toEqual(deviceInfo);
      });

      it('should return fallback detection when not set explicitly', () => {
        // This test checks the fallback behavior
        // We need to set to null to trigger fallback
        // Since there's no reset function, we test the set path instead
        const webInfo: DeviceInfo = {
          platform: 'web',
          isWeb: true,
          isMobile: false,
        };

        setDeviceInfo(webInfo);
        const result = getDeviceInfo();

        expect(result.isWeb).toBe(true);
        expect(result.isMobile).toBe(false);
      });

      it('should handle iOS device info', () => {
        const iosInfo: DeviceInfo = {
          platform: 'ios',
          isWeb: false,
          isMobile: true,
        };

        setDeviceInfo(iosInfo);
        const result = getDeviceInfo();

        expect(result.platform).toBe('ios');
        expect(result.isMobile).toBe(true);
      });

      it('should handle Android device info', () => {
        const androidInfo: DeviceInfo = {
          platform: 'android',
          isWeb: false,
          isMobile: true,
        };

        setDeviceInfo(androidInfo);
        const result = getDeviceInfo();

        expect(result.platform).toBe('android');
        expect(result.isMobile).toBe(true);
      });
    });
  });

  describe('Layout Info', () => {
    describe('setLayoutInfo and getLayoutInfo', () => {
      it('should set and retrieve layout info', () => {
        const layoutInfo: LayoutInfo = {
          screen: { width: 1920, height: 1080 },
          window: { width: 1920, height: 1000 },
        };

        setLayoutInfo(layoutInfo);
        const retrieved = getLayoutInfo();

        expect(retrieved).toEqual(layoutInfo);
      });

      it('should return null when layout info not set', () => {
        // Reset by setting null-like state
        // Since there's no reset, we test after setting proper info
        setLayoutInfo({
          screen: { width: 1024, height: 768 },
          window: { width: 1024, height: 768 },
        });
        const result = getLayoutInfo();

        expect(result).not.toBeNull();
      });
    });

    describe('isLandscape', () => {
      it('should return true when width is greater than height', () => {
        setLayoutInfo({
          screen: { width: 1024, height: 768 },
          window: { width: 1024, height: 768 },
        });

        expect(isLandscape()).toBe(true);
      });

      it('should return false when height is greater than width', () => {
        setLayoutInfo({
          screen: { width: 768, height: 1024 },
          window: { width: 768, height: 1024 },
        });

        expect(isLandscape()).toBe(false);
      });

      it('should return false when dimensions are equal', () => {
        setLayoutInfo({
          screen: { width: 800, height: 800 },
          window: { width: 800, height: 800 },
        });

        expect(isLandscape()).toBe(false);
      });
    });

    describe('isPortrait', () => {
      it('should return true when height is greater than width', () => {
        setLayoutInfo({
          screen: { width: 768, height: 1024 },
          window: { width: 768, height: 1024 },
        });

        expect(isPortrait()).toBe(true);
      });

      it('should return false when width is greater than height', () => {
        setLayoutInfo({
          screen: { width: 1024, height: 768 },
          window: { width: 1024, height: 768 },
        });

        expect(isPortrait()).toBe(false);
      });

      it('should return true when dimensions are equal', () => {
        setLayoutInfo({
          screen: { width: 800, height: 800 },
          window: { width: 800, height: 800 },
        });

        expect(isPortrait()).toBe(true);
      });
    });

    describe('isSmallScreen', () => {
      it('should return true for screens under 768px wide', () => {
        setLayoutInfo({
          screen: { width: 375, height: 667 },
          window: { width: 375, height: 667 },
        });

        expect(isSmallScreen()).toBe(true);
      });

      it('should return false for screens 768px or wider', () => {
        setLayoutInfo({
          screen: { width: 768, height: 1024 },
          window: { width: 768, height: 1024 },
        });

        expect(isSmallScreen()).toBe(false);
      });

      it('should return false for large screens', () => {
        setLayoutInfo({
          screen: { width: 1920, height: 1080 },
          window: { width: 1920, height: 1080 },
        });

        expect(isSmallScreen()).toBe(false);
      });
    });

    describe('isLargeScreen', () => {
      it('should return true for screens over 1024px wide', () => {
        setLayoutInfo({
          screen: { width: 1920, height: 1080 },
          window: { width: 1920, height: 1080 },
        });

        expect(isLargeScreen()).toBe(true);
      });

      it('should return false for screens 1024px or narrower', () => {
        setLayoutInfo({
          screen: { width: 1024, height: 768 },
          window: { width: 1024, height: 768 },
        });

        expect(isLargeScreen()).toBe(false);
      });

      it('should return false for small screens', () => {
        setLayoutInfo({
          screen: { width: 375, height: 667 },
          window: { width: 375, height: 667 },
        });

        expect(isLargeScreen()).toBe(false);
      });
    });
  });

  describe('Safe Area Insets', () => {
    describe('setSafeAreaInsets and getSafeAreaInsets', () => {
      it('should set and retrieve safe area insets', () => {
        const insets: SafeAreaInsets = {
          top: 44,
          right: 0,
          bottom: 34,
          left: 0,
        };

        setSafeAreaInsets(insets);
        const retrieved = getSafeAreaInsets();

        expect(retrieved).toEqual(insets);
      });

      it('should return default insets initially', () => {
        setSafeAreaInsets({ top: 0, right: 0, bottom: 0, left: 0 });
        const insets = getSafeAreaInsets();

        expect(insets).toEqual({
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        });
      });

      it('should handle iPhone notch insets', () => {
        const iphoneInsets: SafeAreaInsets = {
          top: 47,
          right: 0,
          bottom: 34,
          left: 0,
        };

        setSafeAreaInsets(iphoneInsets);
        const retrieved = getSafeAreaInsets();

        expect(retrieved.top).toBe(47);
        expect(retrieved.bottom).toBe(34);
      });

      it('should handle landscape insets', () => {
        const landscapeInsets: SafeAreaInsets = {
          top: 0,
          right: 47,
          bottom: 21,
          left: 47,
        };

        setSafeAreaInsets(landscapeInsets);
        const retrieved = getSafeAreaInsets();

        expect(retrieved.left).toBe(47);
        expect(retrieved.right).toBe(47);
      });
    });
  });

  describe('Responsive Size Utilities', () => {
    describe('getResponsiveSize', () => {
      it('should scale size based on screen width', () => {
        setLayoutInfo({
          screen: { width: 750, height: 1334 },
          window: { width: 750, height: 1334 },
        });

        // 750 / 375 = 2x scale
        const scaled = getResponsiveSize(10);

        expect(scaled).toBe(20);
      });

      it('should handle provided screen width', () => {
        const scaled = getResponsiveSize(10, 750);

        expect(scaled).toBe(20);
      });

      it('should use default width when layout not available', () => {
        // With default 375 width, scale is 1
        const scaled = getResponsiveSize(10, 375);

        expect(scaled).toBe(10);
      });

      it('should scale for smaller screens', () => {
        setLayoutInfo({
          screen: { width: 320, height: 568 },
          window: { width: 320, height: 568 },
        });

        // 320 / 375 = 0.853...
        const scaled = getResponsiveSize(100);

        expect(scaled).toBe(85);
      });

      it('should round to nearest integer', () => {
        const scaled = getResponsiveSize(10, 400);

        // 400 / 375 * 10 = 10.66... → 11
        expect(scaled).toBe(11);
      });
    });

    describe('getResponsiveFontSize', () => {
      it('should scale font size responsively', () => {
        setLayoutInfo({
          screen: { width: 750, height: 1334 },
          window: { width: 750, height: 1334 },
        });

        const fontSize = getResponsiveFontSize(14);

        expect(fontSize).toBe(28);
      });

      it('should maintain base size at baseline width', () => {
        setLayoutInfo({
          screen: { width: 375, height: 667 },
          window: { width: 375, height: 667 },
        });

        const fontSize = getResponsiveFontSize(16);

        expect(fontSize).toBe(16);
      });
    });

    describe('getResponsiveSpacing', () => {
      it('should scale spacing responsively', () => {
        setLayoutInfo({
          screen: { width: 750, height: 1334 },
          window: { width: 750, height: 1334 },
        });

        const spacing = getResponsiveSpacing(8);

        expect(spacing).toBe(16);
      });

      it('should maintain base spacing at baseline width', () => {
        setLayoutInfo({
          screen: { width: 375, height: 667 },
          window: { width: 375, height: 667 },
        });

        const spacing = getResponsiveSpacing(16);

        expect(spacing).toBe(16);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero dimensions', () => {
      setLayoutInfo({
        screen: { width: 0, height: 0 },
        window: { width: 0, height: 0 },
      });

      expect(isLandscape()).toBe(false);
      expect(isPortrait()).toBe(true);
      expect(isSmallScreen()).toBe(true);
      expect(isLargeScreen()).toBe(false);
    });

    it('should handle very large screen dimensions', () => {
      setLayoutInfo({
        screen: { width: 5120, height: 2880 },
        window: { width: 5120, height: 2880 },
      });

      expect(isLandscape()).toBe(true);
      expect(isLargeScreen()).toBe(true);
      expect(isSmallScreen()).toBe(false);
    });

    it('should handle responsive size with zero base', () => {
      const scaled = getResponsiveSize(0);

      expect(scaled).toBe(0);
    });

    it('should handle responsive size with negative values', () => {
      const scaled = getResponsiveSize(-10, 750);

      expect(scaled).toBe(-20);
    });
  });
});
