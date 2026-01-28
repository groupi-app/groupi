/**
 * Device and platform-specific utilities
 * Works across web and React Native
 */

import type { DeviceInfo, LayoutInfo } from '../types';

// Device info singleton
let deviceInfo: DeviceInfo | null = null;

/**
 * Set device info - called during app initialization
 */
export function setDeviceInfo(info: DeviceInfo) {
  deviceInfo = info;
}

/**
 * Get current device info
 */
export function getDeviceInfo(): DeviceInfo {
  if (!deviceInfo) {
    // Fallback detection if not set explicitly
    // Use globalThis which is available in both browser and Node environments
    const isWeb =
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as { window?: unknown }).window !== 'undefined';
    return {
      platform: isWeb ? 'web' : 'ios', // Default to ios for mobile fallback
      isWeb,
      isMobile: !isWeb,
    };
  }
  return deviceInfo;
}

// Layout utilities
let currentLayout: LayoutInfo | null = null;

/**
 * Set current layout info - called when layout changes
 */
export function setLayoutInfo(layout: LayoutInfo) {
  currentLayout = layout;
}

/**
 * Get current layout info
 */
export function getLayoutInfo(): LayoutInfo | null {
  return currentLayout;
}

/**
 * Check if device is in landscape mode
 */
export function isLandscape(): boolean {
  const layout = getLayoutInfo();
  if (!layout) return false;

  return layout.screen.width > layout.screen.height;
}

/**
 * Check if device is in portrait mode
 */
export function isPortrait(): boolean {
  return !isLandscape();
}

/**
 * Check if screen is considered small (useful for responsive design)
 */
export function isSmallScreen(): boolean {
  const layout = getLayoutInfo();
  if (!layout) return false;

  // Consider anything under 768px wide as small
  return layout.screen.width < 768;
}

/**
 * Check if screen is considered large
 */
export function isLargeScreen(): boolean {
  const layout = getLayoutInfo();
  if (!layout) return false;

  // Consider anything over 1024px wide as large
  return layout.screen.width > 1024;
}

/**
 * Get safe area insets (for notched devices)
 * This will need to be implemented platform-specifically
 */
export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

let safeAreaInsets: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

export function setSafeAreaInsets(insets: SafeAreaInsets) {
  safeAreaInsets = insets;
}

export function getSafeAreaInsets(): SafeAreaInsets {
  return safeAreaInsets;
}

/**
 * Calculate responsive size based on screen width
 */
export function getResponsiveSize(
  baseSize: number,
  screenWidth?: number
): number {
  const layout = getLayoutInfo();
  const width = screenWidth || layout?.screen.width || 375; // Default to iPhone width

  // Scale based on iPhone 6/7/8 (375px) as baseline
  const scale = width / 375;
  return Math.round(baseSize * scale);
}

/**
 * Get responsive font size
 */
export function getResponsiveFontSize(baseFontSize: number): number {
  return getResponsiveSize(baseFontSize);
}

/**
 * Get responsive spacing
 */
export function getResponsiveSpacing(baseSpacing: number): number {
  return getResponsiveSize(baseSpacing);
}
