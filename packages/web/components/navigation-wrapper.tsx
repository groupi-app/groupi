'use client';

import { Navigation } from './navigation';
import { OnboardingNav } from './onboarding-nav';
import { useQuery } from 'convex/react';
import { useSession } from '@/lib/auth-client';
import { usePathname } from 'next/navigation';

// Dynamic require to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let userQueries: any;
function initApi() {
  if (!userQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    userQueries = api.users?.queries ?? {};
  }
}
initApi();

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
  const { data: session, isPending: sessionPending } = useSession();

  // Check if user needs onboarding (authenticated but missing username)
  const needsOnboarding = useQuery(userQueries.checkNeedsOnboarding, {});

  // If session is loading, show nothing (will be replaced quickly)
  if (sessionPending) {
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
