'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { toast } from 'sonner';
import { acceptInviteAndRedirectAction } from '@/actions/invite-actions';

export function AcceptInviteForm({
  inviteId,
  eventId,
}: {
  inviteId: string;
  eventId: string;
}) {
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const result = await acceptInviteAndRedirectAction(inviteId, eventId);

      if (result.success) {
        // Hard navigation to avoid Next.js Router hooks issues
        window.location.href = result.redirectUrl;
      } else {
        setIsPending(false);
        toast.error('Failed to accept invite', {
          description: 'Please try again.',
        });
      }
    } catch {
      setIsPending(false);
      toast.error('Failed to accept invite', {
        description: 'An unexpected error occurred.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Button type='submit' disabled={isPending}>
        {isPending ? (
          <>
            <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            Accepting...
          </>
        ) : (
          'Accept invite'
        )}
      </Button>
    </form>
  );
}
