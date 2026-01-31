'use client';

import { Navigation } from './navigation';
import { OnboardingNav } from './onboarding-nav';
import { useGlobalUser } from '@/context/global-user-context';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  title: string;
  disabled?: boolean;
};

/**
 * Wrapper for Navigation that handles onboarding state
 * Shows minimal nav during onboarding, full nav after completion
 */
export function NavigationWrapper({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  // Use global user context instead of direct queries
  const { session, isSessionPending, needsOnboarding } = useGlobalUser();

  // If session is loading, show nothing (will be replaced quickly)
  if (isSessionPending) {
    return null;
  }

  // If user is authenticated and needs onboarding, show minimal nav
  // This applies on ALL pages, not just /onboarding
  if (session?.user && needsOnboarding === true) {
    return <OnboardingNav />;
  }

  // If we're on the onboarding page and still loading the check, show minimal nav
  if (
    pathname?.startsWith('/onboarding') &&
    session?.user &&
    needsOnboarding === undefined
  ) {
    return <OnboardingNav />;
  }

  // Normal navigation for authenticated users who completed onboarding
  // or unauthenticated users
  return <Navigation items={items} />;
}
