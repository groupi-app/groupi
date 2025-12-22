'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const acceptInvite = useAcceptInvite();

  const handleAcceptInvite = async () => {
    acceptInvite.mutate(
      { inviteId, eventId },
      {
        onSuccess: (data) => {
          // Mutation successful, navigate to event using returned eventId
          router.push(`/event/${data.eventId}`);
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
