'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCreateGroup, useGroups } from '@/hooks/convex/use-groups';
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
      <div className='space-y-4'>
        <h2 className='font-semibold'>Create a Group</h2>
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
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='font-semibold'>Your Groups</h2>
        <Button onClick={() => setCreating(true)}>Create Group</Button>
      </div>
      {groups === undefined ? (
        <p role='status'>Loading Groups…</p>
      ) : (
        <>
          {groups.page.length === 0 && (
            <p className='text-muted-foreground'>
              No Groups yet. Create a Group to give your community a home.
            </p>
          )}
          <ul className='space-y-2'>
            {groups.page.map(group => (
              <li key={group._id}>
                <Link
                  href={`/groups/${group._id}`}
                  onClick={event => {
                    event.preventDefault();
                    onOpenGroup(group._id);
                  }}
                  className='block rounded-card bg-card p-4 hover:bg-muted focus-visible:outline focus-visible:outline-2'
                >
                  <span className='font-semibold'>{group.name}</span>
                  {group.description && (
                    <p className='text-sm text-muted-foreground line-clamp-2'>
                      {group.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <div className='flex gap-2'>
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
    </div>
  );
}
