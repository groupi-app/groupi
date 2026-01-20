'use client';

import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { useAcceptInvite } from '@/hooks/convex';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';

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

  // Auto-accept invite when user returns after authentication with action=accept
  useEffect(() => {
    if (
      isAuthenticated &&
      actionParam === 'accept' &&
      !isPending &&
      !autoAcceptTriggered.current
    ) {
      autoAcceptTriggered.current = true;
      handleAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, actionParam]);

  const handleAccept = async () => {
    // If not authenticated, redirect to sign-in with redirect back to this page
    if (!isAuthenticated) {
      const redirectUrl = `${pathname}?action=accept`;
      router.push(`/sign-in?redirect=${encodeURIComponent(redirectUrl)}`);
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

  // Show loading state while checking session or auto-accepting
  const isLoading = isPending || (isSessionPending && actionParam === 'accept');

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
