import { env } from '@/env.mjs';

/**
 * Utility functions for generating URLs within the application
 */

/**
 * Get the base URL for the application
 * Works on both server and client side
 */
export function getBaseUrl(): string {
  return env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

/**
 * Generate an invite URL for a given invite ID
 */
export function getInviteUrl(inviteId: string): string {
  return `${getBaseUrl()}/invite/${inviteId}`;
}

/**
 * Generate an event URL for a given event ID
 */
export function getEventUrl(eventId: string): string {
  return `${getBaseUrl()}/event/${eventId}`;
}

/**
 * Generate a user profile URL for a given user ID
 */
export function getUserUrl(userId: string): string {
  return `${getBaseUrl()}/user/${userId}`;
}

/**
 * Generate an absolute URL for any relative path
 */
export function getAbsoluteUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBaseUrl()}${cleanPath}`;
}
