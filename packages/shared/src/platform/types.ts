/**
 * Platform-specific type definitions
 */

export type Platform = 'web' | 'mobile';

export interface PlatformConfig {
  platform: Platform;
  navigation: NavigationAdapter;
  storage: StorageAdapter;
  toast: ToastAdapter;
}

export interface NavigationAdapter {
  push(path: string): void;
  replace(path: string): void;
  back(): void;
  canGoBack(): boolean;
}

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ToastOptions {
  title?: string;
  description: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export interface ToastAdapter {
  show(options: ToastOptions): void;
  success(message: string, title?: string): void;
  error(message: string, title?: string): void;
  info(message: string, title?: string): void;
}
