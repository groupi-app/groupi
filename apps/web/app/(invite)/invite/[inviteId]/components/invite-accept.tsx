'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { acceptInviteAction } from '@/actions/invite-actions';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(false);

  const handleAcceptInvite = async () => {
    setIsLoading(true);
    const [error] = await acceptInviteAction({
      inviteId: inviteId,
    });

    if (error) {
      toast.error('Failed to accept invite', {
        description: 'An unexpected error occurred. Please try again.',
      });
      setIsLoading(false);
    } else {
      // Mutation successful, navigate to event
      router.push(`/event/${eventId}`);
    }
  };

  return (
    <div>
      <Button onClick={handleAcceptInvite} disabled={isLoading}>
        {isLoading ? (
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
