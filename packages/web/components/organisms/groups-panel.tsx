'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Plus, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/molecules/empty-state';
import { Button } from '@/components/ui/button';
import { useCreateGroup, useGroups } from '@/hooks/convex/use-groups';
import { GroupInvitationInbox } from './group-invitation-inbox';
import { GroupIdentityForm } from './group-identity-form';

export function GroupsPanel({
  onOpenGroup,
}: {
  onOpenGroup: (groupId: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const groups = useGroups({ numItems: 20, cursor });
  const create = useCreateGroup();

  if (creating)
    return (
      <div className='flex flex-col gap-6'>
        <h2 className='font-heading text-xl font-semibold'>Create a Group</h2>
        <p className='text-sm text-muted-foreground'>
          You will be the Group’s single owner. An owner-only Group is ready to
          use.
        </p>
        <GroupIdentityForm
          submitLabel='Create Group'
          onCancel={() => setCreating(false)}
          onSubmit={async ({ name, description, image }) => {
            const groupId = await create({
              name,
              ...(description ? { description } : {}),
              ...(image ? { image } : {}),
            });
            setCreating(false);
            onOpenGroup(groupId);
          }}
        />
      </div>
    );

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex flex-col gap-1'>
          <h2 className='font-heading text-xl font-semibold'>Your Groups</h2>
          <p className='text-sm text-muted-foreground'>
            A home for the people you gather with.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus data-icon='inline-start' />
          Create Group
        </Button>
      </div>
      {groups === undefined ? (
        <div role='status' className='flex flex-col gap-3'>
          <span className='sr-only'>Loading Groups…</span>
          {[0, 1, 2].map(item => (
            <Skeleton key={item} className='h-24 w-full rounded-card' />
          ))}
        </div>
      ) : (
        <>
          {groups.page.length === 0 && (
            <EmptyState
              icon={<Users aria-hidden='true' />}
              message='No Groups yet'
              description='Create a Group to give your community a home, or accept a Group invitation below.'
              className='rounded-card border border-dashed border-border px-4'
            />
          )}
          <ul className='divide-y divide-border'>
            {groups.page.map(group => (
              <li key={group._id}>
                <Link
                  href={`/groups/${group._id}`}
                  onClick={event => {
                    event.preventDefault();
                    onOpenGroup(group._id);
                  }}
                  aria-label={group.name}
                  className='flex items-center gap-4 rounded-input px-2 py-4 transition-colors duration-fast hover:bg-muted motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring'
                >
                  <Avatar className='size-12 shrink-0'>
                    <AvatarImage src={group.image} alt='' />
                    <AvatarFallback>{group.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <span className='block break-words font-semibold'>
                      {group.name}
                    </span>
                    {group.description && (
                      <p className='break-words text-sm text-muted-foreground line-clamp-2'>
                        {group.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    aria-hidden='true'
                    className='size-4 shrink-0 text-muted-foreground'
                  />
                </Link>
              </li>
            ))}
          </ul>
          <div className='flex flex-wrap gap-2'>
            {cursor !== null && (
              <Button variant='outline' onClick={() => setCursor(null)}>
                First page
              </Button>
            )}
            {!groups.isDone && (
              <Button
                variant='outline'
                onClick={() => setCursor(groups.continueCursor)}
              >
                Next Groups
              </Button>
            )}
          </div>
        </>
      )}
      <GroupInvitationInbox onOpenGroup={onOpenGroup} />
    </div>
  );
}
