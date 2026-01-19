'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAcceptInvite } from '@/hooks/convex';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function AcceptInviteForm({
  inviteId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- eventId available for future use
  eventId: _eventId,
}: {
  inviteId: string;
  eventId: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const acceptInvite = useAcceptInvite();
  const router = useRouter();

  const handleAccept = async () => {
    setIsPending(true);
    setError(null);

    try {
      // The hook expects a token parameter, not separate inviteId and eventId
      const result = await acceptInvite(inviteId);
      toast.success('Invite accepted successfully!');
      router.push(`/event/${result.event.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept invite. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div>
      {error && (
        <p className='text-destructive text-sm mb-2'>
          {error}
        </p>
      )}
      <Button
        onClick={handleAccept}
        isLoading={isPending}
        loadingText='Accepting...'
      >
        Accept invite
      </Button>
    </div>
  );
}
