'use client';

import { useState } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import {
  useGroupBans,
  useLiftGroupBan,
} from '@/hooks/convex/use-group-moderation';
import { GroupConfirmedAction } from './group-confirmed-action';
import { GroupPagination } from './group-pagination';

export function GroupBanManagement({ groupId }: { groupId: Id<'groups'> }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const bans = useGroupBans(groupId, { numItems: 20, cursor });
  const lift = useLiftGroupBan();
  return (
    <section className='space-y-3' aria-labelledby='group-bans-heading'>
      <h2 id='group-bans-heading' className='font-semibold'>
        Group bans
      </h2>
      <p className='text-sm text-muted-foreground'>
        Bans prevent invitations and re-entry until lifted. Lifting a ban does
        not restore membership.
      </p>
      {bans === undefined ? (
        <p role='status'>Loading bans…</p>
      ) : (
        <>
          {bans.page.length === 0 && <p>No bans to display.</p>}
          <ul className='space-y-2'>
            {bans.page.map(person => {
              const name = person.name || person.username || 'Unavailable user';
              return (
                <li
                  key={`${person.personId}-${person.bannedAt}`}
                  className='rounded-card bg-card p-3 space-y-2'
                >
                  <p className='font-medium'>{name}</p>
                  {person.username && (
                    <p className='text-sm text-muted-foreground'>
                      @{person.username}
                    </p>
                  )}
                  <GroupConfirmedAction
                    label={`Lift ban for ${name}`}
                    confirmation={`Confirm lifting ban for ${name}`}
                    explanation='This person can receive a new invitation under the current policy. Their previous membership will not be restored.'
                    onConfirm={() =>
                      lift({ groupId, personId: person.personId })
                    }
                  />
                </li>
              );
            })}
          </ul>
          <GroupPagination
            cursor={cursor}
            onCursor={setCursor}
            page={bans}
            label='bans'
          />
        </>
      )}
    </section>
  );
}
