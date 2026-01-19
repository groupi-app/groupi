'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { useSession } from '@/lib/auth-client';

// Dynamic require to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let userQueries: any;
function initApi() {
  if (!userQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require("@/convex/_generated/api");
    userQueries = api.users?.queries ?? {};
  }
}
initApi();

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
  const { data: session, isPending: sessionPending } = useSession();

  // Check if user needs onboarding
  const needsOnboarding = useQuery(userQueries.checkNeedsOnboarding, {});

  useEffect(() => {
    // Wait for session to load
    if (sessionPending) {
      return;
    }

    // Don't redirect on API routes or auth pages
    if (
      pathname?.startsWith('/api/') ||
      pathname?.startsWith('/sign-in') ||
      pathname?.startsWith('/sign-up')
    ) {
      return;
    }

    // Unauthenticated users trying to access onboarding should go to sign-in
    if (!session?.user && pathname?.startsWith('/onboarding')) {
      console.log('[OnboardingRedirect] Unauthenticated user on onboarding, redirecting to sign-in');
      router.push('/sign-in');
      return;
    }

    // Only apply onboarding logic to authenticated users
    if (!session?.user) {
      return;
    }

    // If query is still loading, don't redirect yet
    if (needsOnboarding === undefined) {
      return;
    }

    // If user needs onboarding and is NOT on onboarding page, redirect there
    if (needsOnboarding === true && !pathname?.startsWith('/onboarding')) {
      console.log('[OnboardingRedirect] User needs onboarding, redirecting from', pathname);
      router.push('/onboarding');
      return;
    }

    // If user completed onboarding and IS on onboarding page, redirect to events
    if (needsOnboarding === false && pathname?.startsWith('/onboarding')) {
      console.log('[OnboardingRedirect] User completed onboarding, redirecting to events');
      router.push('/events');
      return;
    }
  }, [pathname, router, needsOnboarding, session, sessionPending]);

  return null;
}
