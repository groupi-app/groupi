'use client';
import { GroupSharedEvents } from './group-shared-events';
import { GroupEventSharingPolicy } from './group-event-sharing-policy';
import { GroupOwnershipTransfer } from './group-ownership-transfer';
import { GroupAnnouncementComposer } from './group-announcement-composer';

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
import { useLeaveGroup } from '@/hooks/convex/use-group-moderation';
import { GroupJoiningQuestionnaire } from './group-joining-questionnaire';
import { GroupApplications } from './group-applications';
import { GroupApplicationSettings } from './group-application-settings';
import { GroupBanManagement } from './group-ban-management';
import { GroupConfirmedAction } from './group-confirmed-action';
import { GroupMemberRoster } from './group-member-roster';
import { GroupInvitationManagement } from './group-invitation-management';
import { GroupIdentityForm } from './group-identity-form';
import { useFriendsDialogStore } from '@/stores/friends-dialog-store';

export function GroupDetail({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId);
  const update = useUpdateGroup();
  const remove = useDeleteGroup();
  const leave = useLeaveGroup();
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
            {group.viewerRole === 'OWNER'
              ? 'Owner'
              : group.viewerRole === 'MODERATOR'
                ? 'Moderator'
                : 'Group member'}
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
      {group.canLeave ? (
        <GroupConfirmedAction
          label='Leave Group'
          confirmation={`Confirm leaving ${group.name}`}
          explanation='Leaving ends your Group membership. A later invitation is allowed under the current policy. Independent Event membership and RSVP remain unchanged.'
          onConfirm={async () => {
            await leave({ groupId });
            router.push(`/g/${groupId}`);
          }}
        />
      ) : (
        group.viewerRole === 'OWNER' && (
          <p className='text-sm text-muted-foreground'>
            The owner cannot leave or delete their account while they own this
            Group. You can{' '}
            <a href='#delete-group' className='text-primary underline'>
              delete the Group
            </a>
            or offer ownership below. Responsibility remains yours until
            acceptance.
          </p>
        )
      )}
      <GroupOwnershipTransfer groupId={groupId} />
      <Link
        className='text-primary underline'
        href={`/groups/${groupId}/forms`}
      >
        Forms and form settings
      </Link>
      <Link
        className='text-primary underline'
        href={`/groups/${groupId}/forms/new`}
      >
        Create form
      </Link>
      <Link
        className='text-primary underline'
        href={`/groups/${groupId}/polls`}
      >
        Polls and poll settings
      </Link>
      <Link
        className='text-primary underline'
        href={`/groups/${groupId}/polls/new`}
      >
        Create poll
      </Link>
      <Link
        className='text-primary underline'
        href={`/groups/${groupId}/lists`}
      >
        Community lists and settings
      </Link>
      <Link
        className='text-primary underline'
        href={`/groups/${groupId}/lists/new`}
      >
        Create community list
      </Link>
      <GroupJoiningQuestionnaire groupId={groupId} />
      {group.canManageRoles && (
        <GroupApplicationSettings
          key={JSON.stringify([
            group.applicationsEnabled,
            group.applicationQuestions,
          ])}
          groupId={groupId}
          applicationsEnabled={group.applicationsEnabled}
          questions={group.applicationQuestions}
        />
      )}
      {group.canManageRoles && (
        <GroupEventSharingPolicy
          key={group.eventSharingPolicy}
          groupId={groupId}
          initialPolicy={group.eventSharingPolicy}
        />
      )}
      {group.joiningQuestionnaire?.canAccessMemberContent !== false ? (
        <GroupSharedEvents groupId={groupId} />
      ) : (
        <p>
          Complete required Group onboarding to view shared Event logistics.
        </p>
      )}
      {group.canManageMembers && <GroupApplications groupId={groupId} review />}
      {group.viewerRole !== 'MEMBER' && (
        <GroupAnnouncementComposer groupId={groupId} />
      )}
      {group.joiningQuestionnaire?.canAccessMemberContent !== false ||
      group.canManageMembers ? (
        <GroupMemberRoster groupId={groupId} />
      ) : (
        <p>
          Complete required onboarding before accessing Group member content.
        </p>
      )}
      {group.canManageMembers && <GroupBanManagement groupId={groupId} />}
      {group.canManageInvitations && (
        <GroupInvitationManagement
          groupId={groupId}
          invitationsEnabled={group.invitationsEnabled}
          canManagePolicies={group.canManageRoles}
        />
      )}
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
          <div
            id='delete-group'
            className='rounded-card border border-border p-4 space-y-3'
          >
            <h2 className='font-semibold'>Delete Group</h2>
            <p className='text-sm text-muted-foreground'>
              Permanently retire this Group and remove its data and audience
              grants. Independent Events, invitations, memberships and RSVP
              remain unchanged. This cannot be undone.
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
