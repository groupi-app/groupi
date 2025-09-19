'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
// Migrated from server actions to tRPC hooks
import { useAcceptInvite } from '@groupi/hooks';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';

export function AcceptInviteButton({
  inviteId,
  eventId,
  personId,
}: {
  //   params: { eventId: string };
  inviteId: string;
  eventId: string;
  personId: string;
}) {
  const router = useRouter();

  // Use our new tRPC hook with integrated real-time sync
  const acceptInviteMutation = useAcceptInvite();

  const handleAcceptInvite = () => {
    acceptInviteMutation.mutate(
      {
        inviteId: inviteId,
        personId: personId,
      },
      {
        onSuccess: _result => {
          // Mutation successful, navigate to event
          router.push(`/event/${eventId}`);
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
      <Button
        onClick={handleAcceptInvite}
        disabled={acceptInviteMutation.isLoading}
      >
        {acceptInviteMutation.isLoading ? (
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
