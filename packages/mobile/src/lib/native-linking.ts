import { getSafeAuthReturnPath } from './auth-route-policy';

const TRUSTED_WEB_HOSTS = new Set(['groupi.gg', 'www.groupi.gg']);
const CUSTOM_SCHEME = 'groupi:';
const FALLBACK_ROUTE = '/';

function getCandidatePath(url: URL, isCustomScheme: boolean) {
  if (
    isCustomScheme &&
    url.hostname &&
    url.hostname !== 'app' &&
    url.hostname !== 'localhost'
  ) {
    return `/${url.hostname}${url.pathname}`;
  }
  return url.pathname || FALLBACK_ROUTE;
}

/**
 * Converts verified web links, legacy web routes, and Groupi custom-scheme
 * callbacks into routes understood by Expo Router. Arbitrary URLs fail closed
 * to the app home instead of being interpreted as navigation instructions.
 */
export function normalizeNativeIntentPath(path: string): string {
  try {
    const url = new URL(path, 'groupi://app');
    const isCustomScheme = url.protocol === CUSTOM_SCHEME;
    const isTrustedWebLink =
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      TRUSTED_WEB_HOSTS.has(url.hostname);

    if (!isCustomScheme && !isTrustedWebLink) return FALLBACK_ROUTE;

    const candidatePath = getCandidatePath(url, isCustomScheme);

    // Better Auth's Expo proxy returns session cookies to this native-only
    // callback. The callback screen validates both the cookie and return path.
    if (isCustomScheme && candidatePath === '/callback') {
      return `${candidatePath}${url.search}`;
    }

    const legacyProfileMatch = /^\/user\/([^/]+)$/.exec(candidatePath);
    const appPath = legacyProfileMatch
      ? `/profile/${legacyProfileMatch[1]}`
      : candidatePath === '/events'
        ? FALLBACK_ROUTE
        : candidatePath;

    return getSafeAuthReturnPath(appPath) ?? FALLBACK_ROUTE;
  } catch {
    return FALLBACK_ROUTE;
  }
}
