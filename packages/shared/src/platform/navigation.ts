/**
 * Platform-agnostic navigation utilities
 */

import type { NavigationAdapter } from './types';

let navigationAdapter: NavigationAdapter | null = null;

/**
 * Set the platform-specific navigation adapter
 * Called by the consuming app to configure navigation
 */
export function setNavigationAdapter(adapter: NavigationAdapter) {
  navigationAdapter = adapter;
}

/**
 * Get the current navigation adapter
 */
export function getNavigationAdapter(): NavigationAdapter {
  if (!navigationAdapter) {
    throw new Error(
      'Navigation adapter not set. Call setNavigationAdapter() first.'
    );
  }
  return navigationAdapter;
}

/**
 * Platform-agnostic navigation functions
 */
export const navigation = {
  /**
   * Navigate to a new screen/page
   */
  push(path: string) {
    getNavigationAdapter().push(path);
  },

  /**
   * Replace current screen/page
   */
  replace(path: string) {
    getNavigationAdapter().replace(path);
  },

  /**
   * Go back to previous screen/page
   */
  back() {
    getNavigationAdapter().back();
  },

  /**
   * Check if navigation can go back
   */
  canGoBack(): boolean {
    return getNavigationAdapter().canGoBack();
  },
};

/**
 * React hook for navigation
 */
export function useNavigation() {
  return navigation;
}
