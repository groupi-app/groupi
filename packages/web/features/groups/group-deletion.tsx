'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { useDeleteGroup } from '@/hooks/convex/use-groups';
import { useFriendsDialogStore } from '@/stores/friends-dialog-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export function GroupDeletion({ groupId }: { groupId: Id<'groups'> }) {
  const remove = useDeleteGroup();
  const router = useRouter();
  const openFriends = useFriendsDialogStore(state => state.openDialog);
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  return (
    <div
      id='delete-group'
      className='flex flex-col gap-3 rounded-card border border-border p-4'
    >
      <h2 className='font-semibold'>Delete Group</h2>
      <p className='text-sm text-muted-foreground'>
        Permanently retire this Group and remove its data and audience grants.
        Independent Events, invitations, memberships and RSVP remain unchanged.
        Discord retained roles and server membership pass to Discord staff;
        pending removals still run. No Discord server or bot is deleted. After
        deletion, this Group’s existing link shows Discord cleanup status to
        authorized managers. This cannot be undone.
      </p>
      {deleting ? (
        <form
          className='flex flex-col gap-3'
          onSubmit={async event => {
            event.preventDefault();
            setPending(true);
            setError('');
            try {
              await remove({
                groupId,
                acknowledgeDiscordHandback: true,
              });
              router.push(`/g/${groupId}`);
              openFriends('groups');
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : 'Unable to delete Group. Please try again.'
              );
            } finally {
              setPending(false);
            }
          }}
        >
          <Label htmlFor='delete-group-confirmation'>
            Type DELETE to confirm
          </Label>
          <Input
            id='delete-group-confirmation'
            value={confirmation}
            onChange={event => setConfirmation(event.target.value)}
            disabled={pending}
          />
          {error && (
            <p role='alert' className='text-destructive'>
              {error}
            </p>
          )}
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='destructive'
              disabled={confirmation !== 'DELETE' || pending}
            >
              {pending ? 'Deleting…' : 'Permanently delete Group'}
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={pending}
              onClick={() => {
                setDeleting(false);
                setConfirmation('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant='destructive' onClick={() => setDeleting(true)}>
          Delete Group
        </Button>
      )}
    </div>
  );
}
