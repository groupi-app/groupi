'use client';

import { useState } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useGroupMembers } from '@/hooks/convex/use-group-invitations';
import { GroupPagination } from './group-pagination';
const roles = { OWNER: 'Owner', MODERATOR: 'Moderator', MEMBER: 'Member' };
export function GroupMemberRoster({ groupId }: { groupId: Id<'groups'> }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const members = useGroupMembers(groupId, { numItems: 20, cursor });
  return (
    <section className='space-y-3' aria-labelledby='group-members-heading'>
      <h2 id='group-members-heading' className='font-semibold'>
        Group members
      </h2>
      {members === undefined ? (
        <p role='status'>Loading members…</p>
      ) : (
        <>
          <ul className='space-y-2'>
            {members.page.map(member => {
              const name =
                member.name || member.username || 'Unavailable member';
              return (
                <li
                  key={member.personId}
                  className='flex items-center gap-3 rounded-card bg-card p-3'
                >
                  <Avatar>
                    <AvatarImage src={member.image ?? undefined} alt='' />
                    <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium'>{name}</p>
                    {member.username && (
                      <p className='text-sm text-muted-foreground'>
                        @{member.username}
                      </p>
                    )}
                    <p className='text-sm'>{roles[member.role]}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <GroupPagination
            cursor={cursor}
            onCursor={setCursor}
            page={members}
            label='members'
          />
        </>
      )}
    </section>
  );
}
