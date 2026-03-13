export { N as NavigationAdapter, P as Platform, a as PlatformConfig, S as StorageAdapter, T as ToastAdapter, b as ToastOptions } from '../types-BQcH1StD.js';

/**
 * Shared type definitions for cross-platform use
 */

interface BaseEntity {
    _id: string;
    _creationTime: number;
}
interface User extends BaseEntity {
    firstName: string;
    lastName: string;
    email: string;
    image?: string;
    timezone?: string;
}
interface Event extends BaseEntity {
    title: string;
    description?: string;
    chosenDateTime?: number;
    location?: string;
    creatorId: string;
}
interface Post extends BaseEntity {
    content: string;
    authorId: string;
    eventId: string;
    replyCount?: number;
}
interface Reply extends BaseEntity {
    content: string;
    authorId: string;
    postId: string;
}
interface Membership extends BaseEntity {
    personId: string;
    eventId: string;
    role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
}
interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}
interface FormField {
    value: string;
    error?: string;
    touched: boolean;
}
interface NavigationState {
    canGoBack: boolean;
    currentRoute?: string;
}
interface AsyncState<T> {
    data?: T;
    loading: boolean;
    error?: string;
}
type PlatformType = 'web' | 'ios' | 'android' | 'mobile';
interface DeviceInfo {
    platform: PlatformType;
    isWeb: boolean;
    isMobile: boolean;
}
interface Dimensions {
    width: number;
    height: number;
}
interface LayoutInfo {
    screen: Dimensions;
    window?: Dimensions;
    statusBarHeight?: number;
}

export type { AsyncState, BaseEntity, DeviceInfo, Dimensions, Event, FormField, LayoutInfo, Membership, NavigationState, PlatformType, Post, Reply, User, ValidationResult };
