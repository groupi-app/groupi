'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';

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

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  /**
   * Where to redirect if not authenticated.
   * Defaults to /sign-in
   */
  redirectTo?: string;
  /**
   * Skip onboarding check. Use this for layouts that should render
   * even if onboarding is incomplete (e.g., the onboarding page itself).
   */
  skipOnboardingCheck?: boolean;
}

/**
 * Layout-level authentication boundary.
 *
 * Use this in layout.tsx files to protect entire route groups.
 * Uses Better Auth's useSession() for instant client-side auth checks
 * (reads from cookies/localStorage, no server round-trip needed).
 *
 * For components that need user profile data, use useAuthState() instead.
 *
 * Benefits:
 * - Instant auth check (no server call)
 * - Single auth check per route group
 * - Consistent loading experience
 * - No duplicate auth checks when navigating between protected pages
 */
export function AuthenticatedLayout({
  children,
  redirectTo = '/sign-in',
  skipOnboardingCheck = false,
}: AuthenticatedLayoutProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = !!session?.user;

  // Check onboarding status for authenticated users (unless skipped)
  const needsOnboarding = useQuery(
    userQueries.checkNeedsOnboarding,
    // Only run the query if authenticated and not skipping the check
    isAuthenticated && !skipOnboardingCheck ? {} : 'skip'
  );

  useEffect(() => {
    if (!isPending && !isAuthenticated) {
      // Preserve the intended destination for post-login redirect
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?returnUrl=${returnUrl}`);
    }
  }, [isAuthenticated, isPending, router, redirectTo, pathname]);

  // Show loading spinner while checking auth status
  if (isPending) {
    return <AuthLoadingSpinner />;
  }

  // Show loading spinner while redirecting to sign-in
  if (!isAuthenticated) {
    return <AuthLoadingSpinner />;
  }

  // Show loading spinner while checking onboarding status
  if (!skipOnboardingCheck && needsOnboarding === undefined) {
    return <AuthLoadingSpinner />;
  }

  // Show loading spinner while redirecting to onboarding
  // (OnboardingRedirectWrapper handles the actual redirect)
  if (!skipOnboardingCheck && needsOnboarding === true) {
    return <AuthLoadingSpinner />;
  }

  return <>{children}</>;
}

/**
 * Simple centered loading spinner for auth checks.
 * Used during authentication and onboarding status checks.
 */
function AuthLoadingSpinner() {
  return (
    <div className='flex items-center justify-center min-h-[50vh]'>
      <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
    </div>
  );
}
