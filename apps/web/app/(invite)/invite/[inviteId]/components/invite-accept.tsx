'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useFormStatus } from 'react-dom';
import { acceptInviteAndRedirectAction } from '@/actions/invite-actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type='submit' disabled={pending}>
      {pending ? (
        <>
          <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
          Accepting...
        </>
      ) : (
        'Accept invite'
      )}
    </Button>
  );
}

export function AcceptInviteForm({
  inviteId,
  eventId,
}: {
  inviteId: string;
  eventId: string;
}) {
  const acceptWithIds = acceptInviteAndRedirectAction.bind(
    null,
    inviteId,
    eventId
  );

  return (
    <form action={acceptWithIds}>
      <SubmitButton />
    </form>
  );
}
