'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  useMyGroupInvites,
  useAcceptGroupInvite,
  useDeclineGroupInvite,
  useCancelGroupInvite,
} from '@/hooks/convex/use-group-invitations';

type Invitation = NonNullable<
  ReturnType<typeof useMyGroupInvites>
>['page'][number];
const statusLabels = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
};
export function GroupInvitationCard({
  invitation,
  manager = false,
  onOpenGroup,
}: {
  invitation: Invitation;
  manager?: boolean;
  onOpenGroup?: (groupId: string) => void;
}) {
  const accept = useAcceptGroupInvite();
  const decline = useDeclineGroupInvite();
  const cancel = useCancelGroupInvite();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const person = manager ? invitation.invitee : invitation.inviter;
  const personName = person.name || person.username || 'Unavailable user';
  const actionable = invitation.status === 'PENDING' && invitation.available;
  const run = async (action: 'accept' | 'decline' | 'cancel') => {
    setPending(true);
    setError('');
    try {
      if (action === 'accept') {
        const result = await accept({ inviteId: invitation.inviteId });
        onOpenGroup?.(result.groupId);
      } else if (action === 'decline')
        await decline({ inviteId: invitation.inviteId });
      else await cancel({ inviteId: invitation.inviteId });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to update this invitation. Please try again.'
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <article
      className='rounded-card border border-border p-4 space-y-2'
      aria-label={`${invitation.group.name} invitation`}
    >
      <h3 className='font-semibold'>{invitation.group.name}</h3>
      <p className='text-sm text-muted-foreground'>
        {manager ? 'Invited' : 'Invited by'} {personName}
        {person.username ? ` (@${person.username})` : ''}
      </p>
      <p className='text-sm'>
        {statusLabels[invitation.status]}
        {!invitation.available ? ' — invitation unavailable' : ''}
      </p>
      {actionable && (
        <div className='flex gap-2'>
          {manager ? (
            <Button
              variant='outline'
              disabled={pending}
              onClick={() => run('cancel')}
              aria-label={`Cancel invitation to ${personName}`}
            >
              Cancel invitation
            </Button>
          ) : (
            <>
              <Button
                disabled={pending}
                onClick={() => run('accept')}
                aria-label={`Accept invitation to ${invitation.group.name}`}
              >
                Accept
              </Button>
              <Button
                variant='outline'
                disabled={pending}
                onClick={() => run('decline')}
                aria-label={`Decline invitation to ${invitation.group.name}`}
              >
                Decline
              </Button>
            </>
          )}
        </div>
      )}
      {error && (
        <p role='alert' className='text-destructive'>
          {error}
        </p>
      )}
    </article>
  );
}
