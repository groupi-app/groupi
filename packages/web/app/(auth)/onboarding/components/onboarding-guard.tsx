'use client';

import { useSession } from '@/lib/auth-client';
import { useQuery } from 'convex/react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * Onboarding Guard - Shows content only when user needs onboarding
 *
 * Redirects are handled by OnboardingRedirectWrapper in the root layout.
 * This component just handles the loading state and shows content when ready.
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  // Better Auth session
  const { data: session, isPending: sessionPending } = useSession();

  // Check if user needs onboarding
  const needsOnboarding = useQuery(userQueries.checkNeedsOnboarding, {});

  // Show loading while checking session
  if (sessionPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Not authenticated - OnboardingRedirectWrapper will handle redirect
  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Still loading onboarding check
  if (needsOnboarding === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // User doesn't need onboarding - OnboardingRedirectWrapper will redirect
  if (needsOnboarding === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // User needs onboarding - show the onboarding content
  return <>{children}</>;
}