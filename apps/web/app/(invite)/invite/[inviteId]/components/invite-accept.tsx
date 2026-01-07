'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { useAcceptInvite } from '@/hooks/mutations/use-accept-invite';

export function AcceptInviteButton({
  inviteId,
  eventId,
}: {
  //   params: { eventId: string };
  inviteId: string;
  eventId: string;
  personId: string;
}) {
  const acceptInvite = useAcceptInvite();

  const handleAcceptInvite = async () => {
    acceptInvite.mutate(
      { inviteId, eventId },
      {
        onSuccess: data => {
          // Use hard navigation to avoid React hooks order issues
          // during soft navigation with concurrent query invalidations.
          // This bypasses Next.js Router which has issues with hook counts
          // during navigation while queries are being invalidated.
          window.location.href = `/event/${data.eventId}`;
        },
        onError: () => {
          toast.error('Failed to accept invite', {
            description: 'An unexpected error occurred. Please try again.',
          });
        },
      }
    );
  };

  return (
    <div>
      <Button onClick={handleAcceptInvite} disabled={acceptInvite.isPending}>
        {acceptInvite.isPending ? (
          <>
            <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            Accepting...
          </>
        ) : (
          'Accept invite'
        )}
      </Button>
    </div>
  );
}
