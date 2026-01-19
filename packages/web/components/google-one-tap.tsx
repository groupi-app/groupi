'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, authClient } from '@/lib/auth-client';

/**
 * Google One Tap authentication prompt.
 *
 * Automatically shows Google's One Tap sign-in prompt to unauthenticated users.
 * On successful authentication, waits for session to propagate then redirects.
 */
export function GoogleOneTap() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending, refetch } = useSession();
  const hasPrompted = useRef(false);
  const pendingRedirectRef = useRef<string | null>(null);
  const hasRedirected = useRef(false);

  // Handle redirect after session is established
  useEffect(() => {
    if (pendingRedirectRef.current && session?.user && !hasRedirected.current) {
      hasRedirected.current = true;
      console.log('[GoogleOneTap] Session established, redirecting to:', pendingRedirectRef.current);
      router.push(pendingRedirectRef.current);
    }
  }, [session, router]);

  useEffect(() => {
    // Don't prompt if:
    // - Still loading session
    // - User is already logged in
    // - Already prompted this session
    // - Google Client ID not configured
    // - Already waiting for redirect
    if (
      isPending ||
      session?.user ||
      hasPrompted.current ||
      pendingRedirectRef.current ||
      !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    ) {
      return;
    }

    // Mark as prompted to avoid multiple prompts
    hasPrompted.current = true;

    // Small delay to let the page settle before showing One Tap
    const timer = setTimeout(async () => {
      try {
        console.log('[GoogleOneTap] Initiating One Tap prompt...');
        const result = await authClient.oneTap({
          fetchOptions: {
            onSuccess: async () => {
              console.log('[GoogleOneTap] Login successful, waiting for session...');
              // Build redirect URL
              const redirectUrl = pathname && pathname !== '/'
                ? `/onboarding?redirect=${encodeURIComponent(pathname)}`
                : '/onboarding';

              // Store pending redirect in ref - the effect above will handle it once session is ready
              pendingRedirectRef.current = redirectUrl;

              // Refetch session to get updated state
              await refetch();

              // Also do a full page refresh as fallback to ensure cookies are read
              router.refresh();
            },
            onError: (ctx) => {
              console.error('[GoogleOneTap] Auth error:', ctx.error);
            },
          },
        });
        console.log('[GoogleOneTap] One Tap result:', result);
      } catch (error) {
        // One Tap can fail silently (user dismissed, cooldown, etc.)
        // Log with more detail to help debug issues
        console.error('[GoogleOneTap] One Tap failed:', error);
        if (error instanceof Error) {
          console.error('[GoogleOneTap] Error message:', error.message);
          console.error('[GoogleOneTap] Error stack:', error.stack);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPending, session, router, pathname, refetch]);

  // This component doesn't render anything visible
  // Google One Tap renders its own UI overlay
  return null;
}
