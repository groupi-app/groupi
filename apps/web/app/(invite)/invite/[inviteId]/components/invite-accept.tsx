'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useActionState } from 'react';
import { acceptInviteAndRedirectAction } from '@/actions/invite-actions';

export function AcceptInviteForm({
  inviteId,
  eventId,
}: {
  inviteId: string;
  eventId: string;
}) {
  const boundAction = acceptInviteAndRedirectAction.bind(
    null,
    inviteId,
    eventId
  );
  const [state, formAction, isPending] = useActionState(boundAction, null);

  return (
    <form action={formAction}>
      {state?.error && (
        <p className='text-destructive text-sm mb-2'>
          Failed to accept invite. Please try again.
        </p>
      )}
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
