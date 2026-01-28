/**
 * Shared type definitions for cross-platform use
 */

// Re-export platform types
export * from '../platform/types';

// Common data types that work across platforms
export interface BaseEntity {
  _id: string;
  _creationTime: number;
}

export interface User extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  image?: string;
  timezone?: string;
}

export interface Event extends BaseEntity {
  title: string;
  description?: string;
  chosenDateTime?: number;
  location?: string;
  creatorId: string;
}

export interface Post extends BaseEntity {
  content: string;
  authorId: string;
  eventId: string;
  replyCount?: number;
}

export interface Reply extends BaseEntity {
  content: string;
  authorId: string;
  postId: string;
}

export interface Membership extends BaseEntity {
  personId: string;
  eventId: string;
  role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
}

// Form validation types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FormField {
  value: string;
  error?: string;
  touched: boolean;
}

// Navigation types (mobile-friendly)
export interface NavigationState {
  canGoBack: boolean;
  currentRoute?: string;
}

// Loading and error states
export interface AsyncState<T> {
  data?: T;
  loading: boolean;
  error?: string;
}

// Device/platform detection
export type PlatformType = 'web' | 'ios' | 'android' | 'mobile';

export interface DeviceInfo {
  platform: PlatformType;
  isWeb: boolean;
  isMobile: boolean;
}

// Common dimensions for responsive design
export interface Dimensions {
  width: number;
  height: number;
}

export interface LayoutInfo {
  screen: Dimensions;
  window?: Dimensions;
  statusBarHeight?: number;
}
