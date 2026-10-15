'use client';
import { GroupSharedEvents } from './group-shared-events';
import { GroupEventSharingPolicy } from './group-event-sharing-policy';
import { GroupOwnershipTransfer } from './group-ownership-transfer';
import { EventMail } from '@/features/group-announcements/event-mail';
import { GroupAnnouncementComposer } from './group-announcement-composer';

import { useState } from 'react';
import { ArrowLeft, ClipboardList, ListChecks, Vote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/molecules/empty-state';
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

  if (group === undefined)
    return (
      <div
        role='status'
        className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6'
      >
        <span className='sr-only'>Loading Group…</span>
        <Skeleton className='h-28 w-full rounded-card' />
        <Skeleton className='h-48 w-full rounded-card' />
      </div>
    );
  if (group === null)
    return (
      <div role='alert' className='mx-auto max-w-xl px-4 py-8'>
        <EmptyState
          message='Group unavailable'
          description='You may not have access, or it may have been deleted.'
          action={
            <Button variant='outline' onClick={() => openFriends('groups')}>
              Friends &amp; Groups
            </Button>
          }
        />
      </div>
    );

  return (
    <main className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8'>
      <Button
        className='self-start'
        variant='ghost'
        onClick={() => openFriends('groups')}
      >
        <ArrowLeft data-icon='inline-start' />
        Friends &amp; Groups
      </Button>
      <div className='flex items-center gap-4 rounded-card border border-border bg-card p-5 sm:p-6'>
        <Avatar className='size-16'>
          <AvatarImage src={group.image} alt='' />
          <AvatarFallback>{group.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className='min-w-0 flex flex-col gap-2'>
          <h1 className='break-words text-2xl font-bold sm:text-3xl'>
            {group.name}
          </h1>
          <Badge variant='secondary' className='self-start'>
            {group.viewerRole === 'OWNER'
              ? 'Owner'
              : group.viewerRole === 'MODERATOR'
                ? 'Moderator'
                : 'Group member'}
          </Badge>
        </div>
      </div>
      {group.description && (
        <p className='whitespace-pre-wrap break-words text-muted-foreground'>
          {group.description}
        </p>
      )}
      <div className='flex flex-col items-start gap-3 rounded-card border border-border bg-card p-4'>
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
      <section
        aria-labelledby='group-tools-heading'
        className='flex flex-col gap-3'
      >
        <div>
          <h2 id='group-tools-heading' className='text-xl font-bold'>
            Group tools
          </h2>
          <p className='text-sm text-muted-foreground'>
            Plan, collect responses and keep your community organized.
          </p>
        </div>
        <div className='grid gap-3 sm:grid-cols-3'>
          {[
            {
              path: 'forms',
              title: 'Forms',
              description: 'Collect responses from members.',
              icon: ClipboardList,
              openLabel: 'Forms and form settings',
              createLabel: 'Create form',
            },
            {
              path: 'polls',
              title: 'Polls',
              description: 'Make decisions together.',
              icon: Vote,
              openLabel: 'Polls and poll settings',
              createLabel: 'Create poll',
            },
            {
              path: 'lists',
              title: 'Community lists',
              description: 'Keep shared plans in one place.',
              icon: ListChecks,
              openLabel: 'Community lists and settings',
              createLabel: 'Create community list',
            },
          ].map(tool => (
            <Card key={tool.path}>
              <CardHeader className='p-4'>
                <tool.icon
                  aria-hidden='true'
                  className='mb-2 size-5 text-primary'
                />
                <CardTitle>{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col items-start gap-2 p-4 pt-0'>
                <Button variant='outline' size='sm' asChild>
                  <Link
                    href={`/groups/${groupId}/${tool.path}`}
                    aria-label={tool.openLabel}
                  >
                    View {tool.title.toLowerCase()}
                  </Link>
                </Button>
                <Link
                  className='text-sm text-primary underline underline-offset-4'
                  href={`/groups/${groupId}/${tool.path}/new`}
                >
                  {tool.createLabel}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <GroupJoiningQuestionnaire groupId={groupId} />
      {group.joiningQuestionnaire?.canAccessMemberContent !== false ? (
        <GroupSharedEvents groupId={groupId} />
      ) : (
        <p>
          Complete required Group onboarding to view shared Event logistics.
        </p>
      )}
      {group.joiningQuestionnaire?.canAccessMemberContent !== false ||
      group.canManageMembers ? (
        <GroupMemberRoster groupId={groupId} />
      ) : (
        <p>
          Complete required onboarding before accessing Group member content.
        </p>
      )}
      <section
        aria-labelledby='group-settings-heading'
        className='flex flex-col gap-6 border-t border-border pt-6'
      >
        <h2 id='group-settings-heading' className='text-xl font-bold'>
          Group settings
        </h2>
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
        <Link href={`/announcement-preferences/${groupId}`}>
          Your announcement subscription
        </Link>
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
        {group.canManageMembers && (
          <GroupApplications groupId={groupId} review />
        )}
        {group.viewerRole !== 'MEMBER' && (
          <>
            <GroupAnnouncementComposer groupId={groupId} />
            <EventMail groupId={groupId} />
          </>
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
              className='flex flex-col gap-3 rounded-card border border-border p-4'
            >
              <h2 className='font-semibold'>Delete Group</h2>
              <p className='text-sm text-muted-foreground'>
                Permanently retire this Group and remove its data and audience
                grants. Independent Events, invitations, memberships and RSVP
                remain unchanged. This cannot be undone.
              </p>
              {deleting ? (
                <form
                  className='flex flex-col gap-3'
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
          </>
        )}
      </section>
    </main>
  );
}
