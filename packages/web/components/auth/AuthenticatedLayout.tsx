'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  /**
   * Custom skeleton to show while authenticating.
   * Defaults to a full-page skeleton.
   */
  skeleton?: React.ReactNode;
  /**
   * Where to redirect if not authenticated.
   * Defaults to /sign-in
   */
  redirectTo?: string;
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
  skeleton,
  redirectTo = '/sign-in',
}: AuthenticatedLayoutProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = !!session?.user;

  useEffect(() => {
    if (!isPending && !isAuthenticated) {
      // Preserve the intended destination for post-login redirect
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?returnUrl=${returnUrl}`);
    }
  }, [isAuthenticated, isPending, router, redirectTo, pathname]);

  if (isPending) {
    return skeleton ?? <AuthenticatedLayoutSkeleton />;
  }

  if (!isAuthenticated) {
    // Show skeleton while redirecting
    return skeleton ?? <AuthenticatedLayoutSkeleton />;
  }

  return <>{children}</>;
}

/**
 * Default full-page skeleton for authenticated layouts.
 * Shows a realistic page structure while auth is loading.
 */
export function AuthenticatedLayoutSkeleton() {
  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Page title */}
      <Skeleton className="h-10 w-64" />

      {/* Content area */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Card-like content */}
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* List items */}
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="border rounded-lg p-4 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
