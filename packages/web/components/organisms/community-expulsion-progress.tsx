'use client';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import type { Id } from '@/convex/_generated/dataModel';
import { CommunityExpulsionAction } from './community-expulsion-action';
import { GroupPagination } from './group-pagination';
export function CommunityExpulsionProgress({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const progress = useQuery(api.groups.expulsions.listProgress, {
    groupId,
    cursor: cursor ?? undefined,
  });
  return (
    <section
      aria-label='Community exclusion reconciliation'
      className='flex flex-col gap-3'
    >
      <h2 className='text-xl font-bold'>Community exclusions</h2>
      {progress === undefined ? (
        <p role='status'>Loading exclusions…</p>
      ) : (
        <>
          {progress.page.length === 0 && <p>No community exclusions.</p>}
          {progress.page.map(person => (
            <div key={person.personId}>
              <p>{person.name}</p>
              <CommunityExpulsionAction
                groupId={groupId}
                personId={person.personId}
                name={person.name}
              />
            </div>
          ))}
          <GroupPagination
            cursor={cursor}
            onCursor={setCursor}
            page={progress}
            label='exclusions'
          />
        </>
      )}
    </section>
  );
}
