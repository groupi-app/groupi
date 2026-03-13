/**
 * Platform-specific type definitions
 */
type Platform = 'web' | 'mobile';
interface PlatformConfig {
    platform: Platform;
    navigation: NavigationAdapter;
    storage: StorageAdapter;
    toast: ToastAdapter;
}
interface NavigationAdapter {
    push(path: string): void;
    replace(path: string): void;
    back(): void;
    canGoBack(): boolean;
}
interface StorageAdapter {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
}
interface ToastOptions {
    title?: string;
    description: string;
    variant?: 'default' | 'destructive' | 'success';
    duration?: number;
}
interface ToastAdapter {
    show(options: ToastOptions): void;
    success(message: string, title?: string): void;
    error(message: string, title?: string): void;
    info(message: string, title?: string): void;
}

export type { NavigationAdapter as N, Platform as P, StorageAdapter as S, ToastAdapter as T, PlatformConfig as a, ToastOptions as b };
