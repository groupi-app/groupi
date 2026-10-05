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

    // The one-time fixture login route must never be reachable in ordinary
    // builds. Metro replaces EXPO_PUBLIC_* values at build time, so only the
    // isolated E2E artifact can retain this route and its login code.
    if (
      isCustomScheme &&
      candidatePath === '/e2e' &&
      process.env.EXPO_PUBLIC_E2E_TESTING === 'true'
    ) {
      return `${candidatePath}${url.search}`;
    }

    const groupApplicationMatch = /^\/(g|groups)\/([a-zA-Z0-9_-]+)$/.exec(
      candidatePath
    );
    if (groupApplicationMatch && url.hash === '#group-applications')
      return (
        getSafeAuthReturnPath(
          `/groups/${groupApplicationMatch[2]}/${groupApplicationMatch[1] === 'g' ? 'apply' : 'applications'}`
        ) ?? FALLBACK_ROUTE
      );

    const pollMatch =
      /^\/groups\/([a-zA-Z0-9_-]+)\/polls\/(?:new|([^/?#]+)\/settings)$/.exec(
        candidatePath
      );
    if (pollMatch)
      return (
        getSafeAuthReturnPath(
          pollMatch[2]
            ? `/groups/${pollMatch[1]}/polls/${pollMatch[2]}/manage`
            : `/groups/${pollMatch[1]}/polls/create`
        ) ?? FALLBACK_ROUTE
      );

    const applicationMatch =
      /^\/event\/([a-zA-Z0-9_-]+)\/(apply|settings\/applications)$/.exec(
        candidatePath
      );
    if (applicationMatch)
      return (
        getSafeAuthReturnPath(
          `/event/${applicationMatch[1]}/${applicationMatch[2] === 'apply' ? 'application' : 'applications'}`
        ) ?? FALLBACK_ROUTE
      );

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
