import { N as NavigationAdapter, S as StorageAdapter, b as ToastAdapter, T as ToastOptions } from '../types-DwU5YVHx.js';
export { P as Platform, a as PlatformConfig } from '../types-DwU5YVHx.js';

/**
 * Platform-agnostic navigation utilities
 */

/**
 * Set the platform-specific navigation adapter
 * Called by the consuming app to configure navigation
 */
declare function setNavigationAdapter(adapter: NavigationAdapter): void;
/**
 * Get the current navigation adapter
 */
declare function getNavigationAdapter(): NavigationAdapter;
/**
 * Platform-agnostic navigation functions
 */
declare const navigation: {
    /**
     * Navigate to a new screen/page
     */
    push(path: string): void;
    /**
     * Replace current screen/page
     */
    replace(path: string): void;
    /**
     * Go back to previous screen/page
     */
    back(): void;
    /**
     * Check if navigation can go back
     */
    canGoBack(): boolean;
};
/**
 * React hook for navigation
 */
declare function useNavigation(): {
    /**
     * Navigate to a new screen/page
     */
    push(path: string): void;
    /**
     * Replace current screen/page
     */
    replace(path: string): void;
    /**
     * Go back to previous screen/page
     */
    back(): void;
    /**
     * Check if navigation can go back
     */
    canGoBack(): boolean;
};

/**
 * Platform-agnostic storage utilities
 */

/**
 * Set the platform-specific storage adapter
 * Called by the consuming app to configure storage
 */
declare function setStorageAdapter(adapter: StorageAdapter): void;
/**
 * Get the current storage adapter
 */
declare function getStorageAdapter(): StorageAdapter;
/**
 * Platform-agnostic storage functions
 */
declare const storage: {
    /**
     * Get item from storage
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Set item in storage
     */
    setItem(key: string, value: string): Promise<void>;
    /**
     * Remove item from storage
     */
    removeItem(key: string): Promise<void>;
    /**
     * Clear all items from storage
     */
    clear(): Promise<void>;
    /**
     * Get JSON item from storage
     */
    getJSON<T>(key: string): Promise<T | null>;
    /**
     * Set JSON item in storage
     */
    setJSON<T>(key: string, value: T): Promise<void>;
};
/**
 * React hook for storage
 */
declare function useStorage(): {
    /**
     * Get item from storage
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Set item in storage
     */
    setItem(key: string, value: string): Promise<void>;
    /**
     * Remove item from storage
     */
    removeItem(key: string): Promise<void>;
    /**
     * Clear all items from storage
     */
    clear(): Promise<void>;
    /**
     * Get JSON item from storage
     */
    getJSON<T>(key: string): Promise<T | null>;
    /**
     * Set JSON item in storage
     */
    setJSON<T>(key: string, value: T): Promise<void>;
};

/**
 * Platform-agnostic toast/notification utilities
 */

/**
 * Set the platform-specific toast adapter
 * Called by the consuming app to configure toasts
 */
declare function setToastAdapter(adapter: ToastAdapter): void;
/**
 * Get the current toast adapter
 */
declare function getToastAdapter(): ToastAdapter;
/**
 * Platform-agnostic toast functions
 */
declare const toast: {
    /**
     * Show a toast with full options
     */
    show(options: ToastOptions): void;
    /**
     * Show a success toast
     */
    success(message: string, title?: string): void;
    /**
     * Show an error toast
     */
    error(message: string, title?: string): void;
    /**
     * Show an info toast
     */
    info(message: string, title?: string): void;
};
/**
 * React hook for toasts
 */
declare function useToast(): {
    /**
     * Show a toast with full options
     */
    show(options: ToastOptions): void;
    /**
     * Show a success toast
     */
    success(message: string, title?: string): void;
    /**
     * Show an error toast
     */
    error(message: string, title?: string): void;
    /**
     * Show an info toast
     */
    info(message: string, title?: string): void;
};

export { NavigationAdapter, StorageAdapter, ToastAdapter, ToastOptions, getNavigationAdapter, getStorageAdapter, getToastAdapter, navigation, setNavigationAdapter, setStorageAdapter, setToastAdapter, storage, toast, useNavigation, useStorage, useToast };
