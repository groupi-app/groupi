/**
 * Platform-agnostic storage utilities
 */

import type { StorageAdapter } from './types';

let storageAdapter: StorageAdapter | null = null;

/**
 * Set the platform-specific storage adapter
 * Called by the consuming app to configure storage
 */
export function setStorageAdapter(adapter: StorageAdapter) {
  storageAdapter = adapter;
}

/**
 * Get the current storage adapter
 */
export function getStorageAdapter(): StorageAdapter {
  if (!storageAdapter) {
    throw new Error('Storage adapter not set. Call setStorageAdapter() first.');
  }
  return storageAdapter;
}

/**
 * Platform-agnostic storage functions
 */
export const storage = {
  /**
   * Get item from storage
   */
  async getItem(key: string): Promise<string | null> {
    return getStorageAdapter().getItem(key);
  },

  /**
   * Set item in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    return getStorageAdapter().setItem(key, value);
  },

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<void> {
    return getStorageAdapter().removeItem(key);
  },

  /**
   * Clear all items from storage
   */
  async clear(): Promise<void> {
    return getStorageAdapter().clear();
  },

  /**
   * Get JSON item from storage
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const item = await getStorageAdapter().getItem(key);
    if (item === null) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },

  /**
   * Set JSON item in storage
   */
  async setJSON<T>(key: string, value: T): Promise<void> {
    return getStorageAdapter().setItem(key, JSON.stringify(value));
  },
};

/**
 * React hook for storage
 */
export function useStorage() {
  return storage;
}
