'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signIn, authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

/**
 * Detect if the app is running as an installed PWA (standalone display mode).
 * In standalone mode, FedCM and popup-based OAuth flows are unreliable.
 */
function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true)
  );
}

/**
 * Check if an error message indicates a FedCM/authorization failure that should
 * trigger a fallback to standard OAuth. Returns true if the message matches
 * known patterns from the Google One Tap / better-auth integration.
 */
function isAuthFallbackError(message: string): boolean {
  return (
    message.includes('response_type') ||
    message.includes('Authorization Error') ||
    message.includes('FedCM')
  );
}

/**
 * Google One Tap authentication prompt.
 *
 * Automatically shows Google's One Tap sign-in prompt to unauthenticated users.
 * On successful authentication, waits for session to propagate then redirects.
 *
 * Skips One Tap entirely in PWA standalone mode where FedCM/popup flows are
 * unreliable, avoiding the "missing response_type" authorization error.
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
      console.log(
        '[GoogleOneTap] Session established, redirecting to:',
        pendingRedirectRef.current
      );
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
    // - Running in PWA standalone mode (FedCM/popups unreliable)
    if (
      isPending ||
      session?.user ||
      hasPrompted.current ||
      pendingRedirectRef.current ||
      !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      isStandaloneMode()
    ) {
      return;
    }

    // Mark as prompted to avoid multiple prompts
    hasPrompted.current = true;

    // Build redirect URL used by both One Tap and fallback flows
    const redirectUrl =
      pathname && pathname !== '/'
        ? `/onboarding?redirect=${encodeURIComponent(pathname)}`
        : '/onboarding';

    // Small delay to let the page settle before showing One Tap
    const timer = setTimeout(async () => {
      try {
        console.log('[GoogleOneTap] Initiating One Tap prompt...');
        const result = await authClient.oneTap({
          fetchOptions: {
            onSuccess: async () => {
              console.log(
                '[GoogleOneTap] Login successful, waiting for session...'
              );

              // Store pending redirect in ref - the effect above will handle it once session is ready
              pendingRedirectRef.current = redirectUrl;

              // Refetch session to get updated state
              await refetch();

              // Also do a full page refresh as fallback to ensure cookies are read
              router.refresh();
            },
            onError: (ctx: { error: { message: string } }) => {
              console.error('[GoogleOneTap] Auth error:', ctx.error);
              const message = ctx.error?.message || '';

              // If the error is an authorization/response_type error, fall back to standard OAuth
              if (isAuthFallbackError(message)) {
                console.log(
                  '[GoogleOneTap] Authorization error detected, falling back to standard Google OAuth'
                );
                signIn.social({
                  provider: 'google',
                  callbackURL: redirectUrl,
                  errorCallbackURL: '/sign-in',
                });
                return;
              }

              toast.error('Google sign-in failed. Please try again.');
            },
          },
          onPromptNotification: notification => {
            // Handle cases where One Tap prompt was dismissed or skipped
            if (notification?.isNotDisplayed?.()) {
              const reason = notification.getNotDisplayedReason?.();
              console.log(
                '[GoogleOneTap] Prompt not displayed, reason:',
                reason
              );
            } else if (notification?.isSkippedMoment?.()) {
              const reason = notification.getSkippedReason?.();
              console.log('[GoogleOneTap] Prompt skipped, reason:', reason);
            } else if (notification?.isDismissedMoment?.()) {
              const reason = notification.getDismissedReason?.();
              console.log('[GoogleOneTap] Prompt dismissed, reason:', reason);
            }
          },
        });
        console.log('[GoogleOneTap] One Tap result:', result);
      } catch (error) {
        // One Tap can fail silently (user dismissed, cooldown, etc.)
        console.error('[GoogleOneTap] One Tap failed:', error);
        const message =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : '';

        if (message) {
          console.error('[GoogleOneTap] Error details:', message);
        }

        // If it looks like a FedCM/authorization error, fall back to standard OAuth
        if (message && isAuthFallbackError(message)) {
          console.log('[GoogleOneTap] Falling back to standard Google OAuth');
          signIn.social({
            provider: 'google',
            callbackURL: redirectUrl,
            errorCallbackURL: '/sign-in',
          });
        } else if (message) {
          // Non-authorization error with a message - notify the user
          toast.error('Google sign-in failed. Please try again.');
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPending, session, router, pathname, refetch]);

  // This component doesn't render anything visible
  // Google One Tap renders its own UI overlay
  return null;
}
