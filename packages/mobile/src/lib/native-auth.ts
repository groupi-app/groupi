import {
  getSetCookie,
  parseSetCookieHeader,
  storageAdapter,
} from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

import { getSafeAuthReturnPath } from './auth-route-policy';

const AUTH_COOKIE_STORAGE_KEY = 'groupi_cookie';
const MAX_CALLBACK_COOKIE_LENGTH = 64 * 1024;
const SESSION_COOKIE_NAME =
  /^(?:__Secure-)?better-auth\.(?:session_token|session_data)$/;

const authStorage = storageAdapter(SecureStore);

export function getNativeAuthCallbackPath(returnTo?: string): string {
  const destination = getSafeAuthReturnPath(returnTo);
  return destination
    ? `/callback?returnTo=${encodeURIComponent(destination)}`
    : '/callback';
}

export async function persistNativeAuthCallbackCookies(
  cookieHeader: string
): Promise<void> {
  if (
    !cookieHeader ||
    cookieHeader.length > MAX_CALLBACK_COOKIE_LENGTH ||
    ![...parseSetCookieHeader(cookieHeader).keys()].some(name =>
      SESSION_COOKIE_NAME.test(name)
    )
  ) {
    throw new Error('Invalid authentication callback');
  }

  const previousCookie = authStorage.getItem(AUTH_COOKIE_STORAGE_KEY);
  const mergedCookie = getSetCookie(cookieHeader, previousCookie ?? undefined);
  await authStorage.setItem(AUTH_COOKIE_STORAGE_KEY, mergedCookie);

  // The Expo adapter treats persistence as best effort. A callback cannot be
  // considered complete unless the full (possibly chunked) cookie round-trips.
  if (authStorage.getItem(AUTH_COOKIE_STORAGE_KEY) !== mergedCookie) {
    throw new Error('Authentication could not be saved securely');
  }
}
