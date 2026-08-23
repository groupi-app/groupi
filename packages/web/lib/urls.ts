import { env } from '@/env.mjs';

const INTERNAL_REDIRECT_ORIGIN = 'https://groupi.internal';

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

/**
 * Return a normalized app-internal redirect or the default events route.
 */
export function getSafeInternalRedirect(
  redirectTo: string | null | undefined
): string {
  if (!redirectTo?.startsWith('/')) {
    return '/events';
  }

  try {
    const decodedRedirect = decodeURIComponent(redirectTo);
    if (decodedRedirect.startsWith('//') || decodedRedirect.startsWith('/\\')) {
      return '/events';
    }

    const url = new URL(redirectTo, INTERNAL_REDIRECT_ORIGIN);
    if (url.origin !== INTERNAL_REDIRECT_ORIGIN) {
      return '/events';
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/events';
  }
}

/**
 * Generate the callback URL used by Better Auth magic links.
 *
 * Better Auth decodes the callback URL before validating it. Double-encoding
 * the nested redirect keeps destinations with their own query parameters
 * encoded during that validation pass.
 */
export function getMagicLinkCallbackUrl(redirectTo: string): string {
  const safeRedirectTo = getSafeInternalRedirect(redirectTo);

  if (safeRedirectTo === '/events') {
    return '/onboarding';
  }

  return `/onboarding?redirect=${encodeURIComponent(
    encodeURIComponent(safeRedirectTo)
  )}`;
}
