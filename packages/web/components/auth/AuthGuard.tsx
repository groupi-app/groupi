'use client';

import { useAuthState, useEventHeaderData } from '@/hooks/convex';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Id } from '@/convex/_generated/dataModel';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard component that ensures user is authenticated
 * Redirects to sign-in if not authenticated, preserving the intended destination
 */
export function AuthGuard({
  children,
  fallback = <div>Loading...</div>,
  redirectTo = '/sign-in',
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Build current URL to preserve as redirect destination
      const currentUrl = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      const signInUrl = currentUrl
        ? `${redirectTo}?redirect=${encodeURIComponent(currentUrl)}`
        : redirectTo;
      router.push(signInUrl);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, pathname, searchParams]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface EventAuthGuardProps {
  children: React.ReactNode;
  eventId: string;
  fallback?: React.ReactNode;
}

/**
 * EventAuthGuard component that ensures user is authenticated
 * and is a member of the specific event
 */
export function EventAuthGuard({
  children,
  eventId,
  fallback = <div>Loading...</div>,
}: EventAuthGuardProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fetch event data to check membership - only when authenticated
  const eventData = useEventHeaderData(eventId as Id<'events'>);
  const isEventLoading = eventData === undefined;
  const isMember = eventData?.userMembership != null;

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      // Build current URL to preserve as redirect destination
      const currentUrl = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      const signInUrl = currentUrl
        ? `/sign-in?redirect=${encodeURIComponent(currentUrl)}`
        : '/sign-in';
      router.push(signInUrl);
      return;
    }

    // If authenticated but not a member (and data is loaded), redirect to events
    if (isAuthenticated && !isEventLoading && !isMember) {
      router.push('/events');
    }
  }, [
    isAuthenticated,
    isAuthLoading,
    isEventLoading,
    isMember,
    router,
    pathname,
    searchParams,
  ]);

  // Show fallback while loading auth or event data
  if (isAuthLoading || isEventLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // If not a member, show fallback while redirecting
  if (!isMember) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
