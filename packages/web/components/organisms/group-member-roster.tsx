'use client';

import { useState } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useGroupMembers } from '@/hooks/convex/use-group-invitations';
import {
  useSetGroupMemberRole,
  useRemoveGroupMember,
  useBanGroupPerson,
} from '@/hooks/convex/use-group-moderation';
import { GroupConfirmedAction } from './group-confirmed-action';
import { GroupPagination } from './group-pagination';
type Member = NonNullable<ReturnType<typeof useGroupMembers>>['page'][number];
function GroupMemberActions({
  groupId,
  member,
}: {
  groupId: Id<'groups'>;
  member: Member;
}) {
  const setRole = useSetGroupMemberRole();
  const remove = useRemoveGroupMember();
  const ban = useBanGroupPerson();
  const name = member.name || member.username || 'Unavailable member';
  return (
    <div className='flex flex-wrap gap-2'>
      {member.canChangeRole && (
        <GroupConfirmedAction
          label={
            member.role === 'MODERATOR'
              ? `Demote ${name}`
              : `Make ${name} a moderator`
          }
          confirmation={
            member.role === 'MODERATOR'
              ? `Confirm demotion of ${name}`
              : `Confirm moderator role for ${name}`
          }
          explanation={
            member.role === 'MODERATOR'
              ? 'This person will become an ordinary Group member.'
              : 'Moderators can manage ordinary Group invitations, removals and bans. This grants no Event authority.'
          }
          onConfirm={() =>
            setRole({
              groupId,
              personId: member.personId,
              role: member.role === 'MODERATOR' ? 'MEMBER' : 'MODERATOR',
            })
          }
        />
      )}
      {member.canRemove && (
        <GroupConfirmedAction
          label={`Remove ${name}`}
          confirmation={`Confirm removal of ${name}`}
          explanation='Removal permits a later invitation under the current Group policy. Independent Event membership and RSVP remain unchanged.'
          onConfirm={() => remove({ groupId, personId: member.personId })}
        />
      )}
      {member.canBan && (
        <GroupConfirmedAction
          label={`Ban ${name}`}
          confirmation={`Confirm ban of ${name}`}
          explanation='Banning removes Group membership and prevents new invitations and re-entry until a manager lifts the ban. Independent Events remain unchanged.'
          onConfirm={() => ban({ groupId, personId: member.personId })}
        />
      )}
    </div>
  );
}
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
          {members.page.length === 0 && <p>No members to display.</p>}
          <ul className='space-y-2'>
            {members.page.map(member => {
              const name =
                member.name || member.username || 'Unavailable member';
              return (
                <li
                  key={member.personId}
                  className='flex flex-wrap items-center gap-3 rounded-card bg-card p-3'
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
                  <GroupMemberActions
                    key={`${member.personId}-${member.role}`}
                    groupId={groupId}
                    member={member}
                  />
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
