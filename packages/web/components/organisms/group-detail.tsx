'use client';
import { GroupNewContent, ContentNavigation } from '@/features/content';
import { GroupSharedEvents } from './group-shared-events';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Copy,
  MoreHorizontal,
  ExternalLink,
  ListChecks,
  Vote,
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
import { GroupJoiningQuestionnaire } from './group-joining-questionnaire';
import { GroupDiscordRetiredStatus } from './group-discord-settings';
import { useLeaveGroup } from '@/hooks/convex/use-group-moderation';
import { GroupConfirmedAction } from './group-confirmed-action';
import { GroupMemberRoster } from './group-member-roster';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
          <GroupNewContent
            groupId={groupId}
            manager={
              group.viewerRole === 'OWNER' || group.viewerRole === 'MODERATOR'
            }
            eligible={
              group.joiningQuestionnaire?.canAccessMemberContent !== false
            }
          />
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
      <div className='flex flex-wrap items-center gap-2'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>
              <ClipboardList data-icon='inline-start' />
              Group tools
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start'>
            <DropdownMenuGroup>
              {[
                {
                  path: 'forms',
                  title: 'Forms and form settings',
                  icon: ClipboardList,
                },
                { path: 'polls', title: 'Polls and poll settings', icon: Vote },
                {
                  path: 'lists',
                  title: 'Community lists and settings',
                  icon: ListChecks,
                },
              ].map(tool => (
                <DropdownMenuItem key={tool.path} asChild>
                  <Link href={`/groups/${groupId}/${tool.path}`}>
                    <tool.icon aria-hidden='true' />
                    {tool.title}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>
              <MoreHorizontal data-icon='inline-start' />
              Group actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start'>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/g/${group._id}`}>
                  <ExternalLink aria-hidden='true' />
                  Open unlisted Group page
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}/g/${group._id}`
                    );
                    setShareMessage('Group link copied');
                  } catch {
                    setShareMessage(
                      `Copy the Group link to share this Group: ${window.location.origin}/g/${group._id}`
                    );
                  }
                }}
              >
                <Copy aria-hidden='true' />
                Copy Group link
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/groups/${groupId}/settings/membership`}>
                  <Settings aria-hidden='true' />
                  Your membership settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <p role='status' className='text-sm'>
          {shareMessage}
        </p>
      </div>
      <GroupJoiningQuestionnaire groupId={groupId} />
      {group.joiningQuestionnaire?.canAccessMemberContent !== false && (
        <ContentNavigation context='group' basePath={`/groups/${groupId}`} />
      )}
      {group.joiningQuestionnaire?.canAccessMemberContent !== false ? (
        <GroupSharedEvents groupId={groupId} />
      ) : (
        <p>
          Complete required Group onboarding to view shared Event logistics.
        </p>
      )}
      {group.joiningQuestionnaire?.canAccessMemberContent !== false ||
      group.canManageMembers ? (
        <GroupMemberRoster groupId={groupId} readOnly />
      ) : (
        <p>
          Complete required onboarding before accessing Group member content.
        </p>
      )}
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
    </main>
  );
}
