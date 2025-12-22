'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { checkNeedsOnboardingAction } from '@/actions/onboarding-actions';

/**
 * Client component that checks if user needs onboarding and redirects if necessary
 * Prevents redirect loops by excluding auth pages
 */
export function OnboardingRedirectWrapper() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Don't run redirect check on auth pages or onboarding page
    if (
      !pathname ||
      pathname.startsWith('/sign-in') ||
      pathname.startsWith('/sign-up') ||
      pathname.startsWith('/onboarding') ||
      pathname.startsWith('/api/')
    ) {
      return;
    }

    // Check if user needs onboarding
    checkNeedsOnboardingAction().then(([error, needsOnboardingCheck]) => {
      // If error or doesn't need onboarding, do nothing
      if (error || needsOnboardingCheck === false) {
        return;
      }

      // User needs onboarding - redirect to onboarding page
      router.push('/onboarding');
    });
  }, [pathname, router]);

  return null;
}

