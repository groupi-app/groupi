'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { useAcceptInvite } from '@/hooks/convex';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { useQuery } from 'convex/react';

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

export function AcceptInviteForm({
  inviteId,

  eventId: _eventId,
}: {
  inviteId: string;
  eventId: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const acceptInvite = useAcceptInvite();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, isPending: isSessionPending } = useSession();
  const autoAcceptTriggered = useRef(false);

  const isAuthenticated = !!session?.user;
  const actionParam = searchParams.get('action');

  // Check if user needs onboarding - only query when authenticated
  const needsOnboarding = useQuery(
    userQueries.checkNeedsOnboarding,
    isAuthenticated ? {} : 'skip'
  );

  // User is ready to accept when authenticated and onboarding is complete
  const isReadyToAccept = isAuthenticated && needsOnboarding === false;

  // Auto-accept invite when user returns after authentication with action=accept
  // Only trigger when fully ready (authenticated AND onboarded)
  useEffect(() => {
    if (
      isReadyToAccept &&
      actionParam === 'accept' &&
      !isPending &&
      !autoAcceptTriggered.current
    ) {
      autoAcceptTriggered.current = true;
      handleAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReadyToAccept, actionParam]);

  const handleAccept = async () => {
    // If not authenticated, redirect to sign-in with redirect back to this page
    if (!isAuthenticated) {
      const redirectUrl = `${pathname}?action=accept`;
      router.push(`/sign-in?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    // If user needs onboarding, don't attempt accept - OnboardingRedirectWrapper will handle it
    // The redirect param will bring them back here after onboarding
    if (needsOnboarding === true) {
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      // The hook expects a token parameter, not separate inviteId and eventId
      const result = await acceptInvite(inviteId);
      toast.success('Invite accepted successfully!');
      router.push(`/event/${result.event.id}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to accept invite. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  // Show loading state while checking session, onboarding status, or auto-accepting
  const isLoading =
    isPending ||
    (isSessionPending && actionParam === 'accept') ||
    (isAuthenticated &&
      needsOnboarding === undefined &&
      actionParam === 'accept');

  return (
    <div>
      {error && <p className='text-destructive text-sm mb-2'>{error}</p>}
      <Button
        onClick={handleAccept}
        isLoading={isLoading}
        loadingText='Accepting...'
      >
        Accept invite
      </Button>
    </div>
  );
}
