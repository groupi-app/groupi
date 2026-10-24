'use client';
import { GroupSharedEvents } from './group-shared-events';
import { GroupOwnershipTransfer } from './group-ownership-transfer';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Copy,
  ListChecks,
  Vote,
  Pencil,
  Settings,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/molecules/empty-state';
import { useRouter } from 'next/navigation';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGroup } from '@/hooks/convex/use-groups';
import { useLeaveGroup } from '@/hooks/convex/use-group-moderation';
import { GroupJoiningQuestionnaire } from './group-joining-questionnaire';
import { GroupDiscordRetiredStatus } from './group-discord-settings';
import { GroupDiscordConnect } from './group-discord-connect';
import { GroupConfirmedAction } from './group-confirmed-action';
import { GroupMemberRoster } from './group-member-roster';

export function GroupDetail({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId);
  const leave = useLeaveGroup();
  const router = useRouter();
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    const destinations: Record<string, string> = {
      '#delete-group': 'ownership',
      '#group-applications': 'admissions',
      '#group-discord-heading': 'discord',
    };
    const redirect = () => {
      const destination = destinations[window.location.hash];
      const allowed =
        destination === 'ownership'
          ? group?.canManageIdentity
          : group?.canManageMembers;
      if (destination && allowed)
        router.replace(
          `/groups/${groupId}/settings/${destination}${window.location.hash}`
        );
    };
    redirect();
    window.addEventListener('hashchange', redirect);
    return () => window.removeEventListener('hashchange', redirect);
  }, [group, groupId, router]);

  if (group === undefined)
    return (
      <div
        role='status'
        className='mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6'
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
            <Button variant='outline' asChild>
              <Link href='/groups'>Your Groups</Link>
            </Button>
          }
        />
        <GroupDiscordRetiredStatus groupId={groupId} />
      </div>
    );

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8'>
      <Button className='self-start' variant='ghost' asChild>
        <Link href='/groups'>
          <ArrowLeft data-icon='inline-start' />
          Your Groups
        </Link>
      </Button>
      <header className='flex flex-col gap-5 border-b border-border pb-8'>
        <div className='flex items-start gap-4 sm:gap-6'>
          <Avatar className='size-16 shrink-0 sm:size-20'>
            <AvatarImage src={group.image} alt='' />
            <AvatarFallback>{group.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className='flex min-w-0 flex-1 flex-col gap-2'>
            <h1 className='break-words font-heading text-3xl font-bold tracking-tight sm:text-4xl'>
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
          <p className='max-w-2xl whitespace-pre-wrap break-words leading-relaxed text-muted-foreground'>
            {group.description}
          </p>
        )}
        <div className='flex flex-wrap gap-2'>
          {group.canManageIdentity && (
            <Button variant='outline' asChild>
              <Link href={`/groups/${groupId}/edit`}>
                <Pencil data-icon='inline-start' />
                Edit Group
              </Link>
            </Button>
          )}
          {(group.canManageMembers ||
            group.canManageIdentity ||
            group.canManageInvitations) && (
            <Button variant='outline' asChild>
              <Link href={`/groups/${groupId}/settings`}>
                <Settings data-icon='inline-start' />
                Group settings
              </Link>
            </Button>
          )}
        </div>
      </header>
      <div className='flex flex-col gap-3 rounded-card bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6'>
        <div className='min-w-0 space-y-1'>
          <h2 className='font-semibold'>Unlisted Group page</h2>
          <p className='text-sm text-muted-foreground'>
            Share an introduction to your Group.
          </p>
          <Link
            href={`/g/${group._id}`}
            className='inline-block max-w-full break-all text-sm text-primary underline underline-offset-4'
          >
            /g/{group._id}
          </Link>
        </div>
        <div className='flex min-w-0 flex-col items-start gap-2 sm:max-w-xs'>
          <Button
            variant='outline'
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${window.location.origin}/g/${group._id}`
                );
                setShareMessage('Group link copied');
              } catch {
                setShareMessage('Copy the Group link to share this Group.');
              }
            }}
          >
            <Copy data-icon='inline-start' />
            Copy Group link
          </Button>
          {shareMessage && (
            <p role='status' className='text-sm'>
              {shareMessage}
            </p>
          )}
        </div>
      </div>
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
        aria-labelledby='group-tools-heading'
        className='flex flex-col gap-3'
      >
        <div>
          <h2
            id='group-tools-heading'
            className='font-heading text-xl font-semibold'
          >
            Group tools
          </h2>
        </div>
        <div className='grid divide-y divide-border overflow-hidden rounded-card border border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
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
            <div key={tool.path} className='flex flex-col gap-4 p-5'>
              <Link
                href={`/groups/${groupId}/${tool.path}`}
                aria-label={tool.openLabel}
                className='group flex flex-1 items-start gap-3 rounded-input outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring'
              >
                <tool.icon
                  aria-hidden='true'
                  className='mt-0.5 size-5 shrink-0 text-primary'
                />
                <div className='min-w-0 space-y-1'>
                  <h3 className='font-semibold group-hover:text-primary'>
                    {tool.title}
                  </h3>
                  <p className='text-sm leading-relaxed text-muted-foreground'>
                    {tool.description}
                  </p>
                </div>
              </Link>
              <Link
                className='self-start rounded-input text-sm font-medium text-primary underline underline-offset-4 outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring'
                href={`/groups/${groupId}/${tool.path}/new`}
              >
                {tool.createLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>
      <section
        aria-labelledby='your-membership-heading'
        className='space-y-4 border-t border-border pt-6'
      >
        <h2
          id='your-membership-heading'
          className='font-heading text-xl font-semibold'
        >
          Your membership
        </h2>
        {group.viewerRole !== 'OWNER' && (
          <GroupOwnershipTransfer groupId={groupId} />
        )}
        <GroupDiscordConnect groupId={groupId} />
        <Link
          className='text-sm font-medium text-primary underline underline-offset-4'
          href={`/announcement-preferences/${groupId}`}
        >
          Your announcement subscription
        </Link>
        {group.canLeave && (
          <GroupConfirmedAction
            label='Leave Group'
            confirmation={`Confirm leaving ${group.name}`}
            explanation='Leaving ends your Group membership. A later invitation is allowed under the current policy. Independent Event membership and RSVP remain unchanged.'
            onConfirm={async () => {
              await leave({ groupId });
              router.push(`/g/${groupId}`);
            }}
          />
        )}
        {group.viewerRole === 'OWNER' && (
          <p className='text-sm text-muted-foreground'>
            Owners must transfer ownership before leaving.{' '}
            <Link
              className='text-primary underline'
              href={`/groups/${groupId}/settings/ownership`}
            >
              Manage ownership
            </Link>
            .
          </p>
        )}
      </section>
    </main>
  );
}
