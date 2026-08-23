export type AuthRouteDecision =
  | { kind: 'loading' }
  | { kind: 'allow' }
  | { kind: 'sign-in'; returnTo: string | null }
  | { kind: 'onboarding'; returnTo: string | null }
  | { kind: 'return-to'; destination: string }
  | { kind: 'home' };

interface AuthRouteState {
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean | null | undefined;
  rootSegment?: string;
  pathname: string;
  returnTo?: string;
}

const SAFE_RETURN_PATH =
  /^\/(?:invite\/[^/?#]+|event\/[^/?#]+(?:\/[^?#]*)?|profile\/[^/?#]+|settings(?:\/[^?#]*)?|friends(?:\/[^?#]*)?|invites(?:\/[^?#]*)?|create-event(?:\/[^?#]*)?|discover|notifications|you)?$/;

export function getSafeAuthReturnPath(value?: string): string | null {
  const candidate = value?.trim();
  if (
    !candidate ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    !SAFE_RETURN_PATH.test(candidate)
  ) {
    return null;
  }

  return candidate;
}

export function getAuthRouteDecision({
  isLoading,
  isAuthenticated,
  needsOnboarding,
  rootSegment,
  pathname,
  returnTo,
}: AuthRouteState): AuthRouteDecision {
  if (isLoading) return { kind: 'loading' };

  const isAuthRoute = rootSegment === '(auth)';
  const isInviteRoute = rootSegment === 'invite';

  if (!isAuthenticated) {
    if (isAuthRoute || isInviteRoute) return { kind: 'allow' };
    return {
      kind: 'sign-in',
      returnTo: getSafeAuthReturnPath(pathname),
    };
  }

  if (needsOnboarding === undefined || needsOnboarding === null) {
    return { kind: 'loading' };
  }

  if (needsOnboarding && rootSegment !== 'onboarding') {
    return {
      kind: 'onboarding',
      returnTo:
        getSafeAuthReturnPath(returnTo) ?? getSafeAuthReturnPath(pathname),
    };
  }

  if (!needsOnboarding && (isAuthRoute || rootSegment === 'onboarding')) {
    const destination = getSafeAuthReturnPath(returnTo);
    if (destination) return { kind: 'return-to', destination };
    return { kind: 'home' };
  }

  return { kind: 'allow' };
}
