'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useGlobalUser } from '@/context/global-user-context';

/**
 * Client component that enforces onboarding completion
 *
 * - Authenticated users without a username are redirected to /onboarding
 * - Users on /onboarding are kept there until they complete it
 * - Prevents navigation to any other page during onboarding
 */
export function OnboardingRedirectWrapper() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use global user context instead of direct queries
  const { session, isSessionPending, needsOnboarding } = useGlobalUser();

  useEffect(() => {
    // Wait for session to load
    if (isSessionPending) {
      return;
    }

    // Don't redirect on API routes or auth pages
    if (pathname?.startsWith('/api/') || pathname?.startsWith('/sign-in')) {
      return;
    }

    // Unauthenticated users trying to access onboarding should go to sign-in
    if (!session?.user && pathname?.startsWith('/onboarding')) {
      console.log(
        '[OnboardingRedirect] Unauthenticated user on onboarding, redirecting to sign-in'
      );
      router.push('/sign-in');
      return;
    }

    // Only apply onboarding logic to authenticated users
    if (!session?.user) {
      return;
    }

    // If query is still loading or auth hasn't synced yet, don't redirect
    // null = not authenticated (auth syncing), undefined = query loading
    if (needsOnboarding === undefined || needsOnboarding === null) {
      return;
    }

    // If user needs onboarding and is NOT on onboarding page, redirect there
    // Preserve current path as redirect parameter so user returns after onboarding
    if (needsOnboarding === true && !pathname?.startsWith('/onboarding')) {
      console.log(
        '[OnboardingRedirect] User needs onboarding, redirecting from',
        pathname
      );
      // Build redirect URL with current path and query params
      const currentUrl = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      router.push(
        `/onboarding?redirect=${encodeURIComponent(currentUrl || '/events')}`
      );
      return;
    }

    // If user completed onboarding and IS on onboarding page, redirect to saved destination
    if (needsOnboarding === false && pathname?.startsWith('/onboarding')) {
      const redirectTo = searchParams.get('redirect') || '/events';
      console.log(
        '[OnboardingRedirect] User completed onboarding, redirecting to',
        redirectTo
      );
      router.push(redirectTo);
      return;
    }

    // Note: Home page redirect is handled directly in app/(home)/page.tsx
    // to prevent flash of marketing content before redirect
  }, [
    pathname,
    router,
    searchParams,
    needsOnboarding,
    session,
    isSessionPending,
  ]);

  return null;
}
