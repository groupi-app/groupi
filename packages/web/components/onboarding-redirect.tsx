'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCurrentUserProfile } from '@/hooks/convex';
import { useEffect } from 'react';

/**
 * Client component that checks if user needs onboarding and redirects if necessary
 * Passes current path as redirect parameter so user returns here after onboarding
 */
export function OnboardingRedirect() {
  const user = useCurrentUserProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If no user data yet, wait for it to load
    if (user === undefined) {
      return;
    }

    // If no user (not authenticated), don't redirect
    if (user === null) {
      return;
    }

    // Check if user needs onboarding (missing required fields)
    const needsOnboarding = !user.user.username || user.user.username.trim() === '';

    if (needsOnboarding) {
      // Pass current path so user returns here after completing onboarding
      const redirectUrl = pathname && pathname !== '/' ? `/onboarding?redirect=${encodeURIComponent(pathname)}` : '/onboarding';
      router.push(redirectUrl);
    }
  }, [user, router, pathname]);

  return null;
}
