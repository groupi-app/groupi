/**
 * Platform-agnostic toast/notification utilities
 */

import type { ToastAdapter, ToastOptions } from './types';

let toastAdapter: ToastAdapter | null = null;

/**
 * Set the platform-specific toast adapter
 * Called by the consuming app to configure toasts
 */
export function setToastAdapter(adapter: ToastAdapter) {
  toastAdapter = adapter;
}

/**
 * Get the current toast adapter
 */
export function getToastAdapter(): ToastAdapter {
  if (!toastAdapter) {
    throw new Error('Toast adapter not set. Call setToastAdapter() first.');
  }
  return toastAdapter;
}

/**
 * Platform-agnostic toast functions
 */
export const toast = {
  /**
   * Show a toast with full options
   */
  show(options: ToastOptions) {
    getToastAdapter().show(options);
  },

  /**
   * Show a success toast
   */
  success(message: string, title?: string) {
    getToastAdapter().success(message, title);
  },

  /**
   * Show an error toast
   */
  error(message: string, title?: string) {
    getToastAdapter().error(message, title);
  },

  /**
   * Show an info toast
   */
  info(message: string, title?: string) {
    getToastAdapter().info(message, title);
  },
};

/**
 * React hook for toasts
 */
export function useToast() {
  return toast;
}
