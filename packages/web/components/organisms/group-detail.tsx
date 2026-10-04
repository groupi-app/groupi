'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useDeleteGroup,
  useGroup,
  useUpdateGroup,
} from '@/hooks/convex/use-groups';
import { GroupIdentityForm } from './group-identity-form';
import { useFriendsDialogStore } from '@/stores/friends-dialog-store';

export function GroupDetail({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId);
  const update = useUpdateGroup();
  const remove = useDeleteGroup();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const openFriends = useFriendsDialogStore(state => state.openDialog);

  if (group === undefined) return <p role='status'>Loading Group…</p>;
  if (group === null)
    return (
      <p role='alert'>
        Group unavailable. You may not have access, or it may have been deleted.
      </p>
    );

  return (
    <main className='mx-auto max-w-2xl p-6 space-y-6'>
      <Button variant='outline' onClick={() => openFriends('groups')}>
        Friends &amp; Groups
      </Button>
      <div className='flex gap-4 items-center'>
        <Avatar className='size-16'>
          <AvatarImage src={group.image} alt='' />
          <AvatarFallback>{group.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className='text-3xl font-bold'>{group.name}</h1>
          <p className='text-muted-foreground'>
            {group.viewerRole === 'OWNER' ? 'Owner' : 'Group member'}
          </p>
        </div>
      </div>
      {group.description && (
        <p className='whitespace-pre-wrap'>{group.description}</p>
      )}
      <div className='rounded-card bg-card p-4 space-y-2'>
        <h2 className='font-semibold'>Unlisted Group page</h2>
        <p className='text-sm text-muted-foreground'>
          Share this stable link. Renaming the Group keeps the same link.
        </p>
        <Button
          variant='outline'
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `${window.location.origin}/g/${group._id}`
              );
              setShareMessage('Group link copied');
            } catch {
              setShareMessage('Copy the link below to share this Group.');
            }
          }}
        >
          Copy Group link
        </Button>
        {shareMessage && (
          <p role='status' className='text-sm'>
            {shareMessage}
          </p>
        )}
        <Link
          href={`/g/${group._id}`}
          className='text-primary underline break-all'
        >
          /g/{group._id}
        </Link>
      </div>
      {group.canManageIdentity && (
        <>
          {editing ? (
            <GroupIdentityForm
              key={group._id}
              initial={group}
              submitLabel='Save Group'
              onCancel={() => setEditing(false)}
              onSubmit={async ({ name, description, image }) => {
                await update({
                  groupId,
                  name,
                  description: description || null,
                  image: image || null,
                });
                setEditing(false);
              }}
            />
          ) : (
            <Button onClick={() => setEditing(true)}>Edit Group</Button>
          )}
          <div className='rounded-card border border-border p-4 space-y-3'>
            <h2 className='font-semibold'>Delete Group</h2>
            <p className='text-sm text-muted-foreground'>
              Permanently delete this Group and its data. This cannot be undone.
            </p>
            {deleting ? (
              <form
                className='space-y-3'
                onSubmit={async event => {
                  event.preventDefault();
                  setPending(true);
                  setError('');
                  try {
                    await remove({ groupId });
                    router.push('/events');
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
                <div className='flex gap-2'>
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
        </>
      )}
    </main>
  );
}
