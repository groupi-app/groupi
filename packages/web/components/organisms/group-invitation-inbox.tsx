'use client';

import { useState } from 'react';
import { useMyGroupInvites } from '@/hooks/convex/use-group-invitations';
import { GroupInvitationCard } from './group-invitation-card';
import { GroupPagination } from './group-pagination';

export function GroupInvitationInbox({
  onOpenGroup,
}: {
  onOpenGroup: (groupId: string) => void;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const invitations = useMyGroupInvites({ numItems: 20, cursor });
  return (
    <section className='space-y-3' aria-labelledby='group-inbox-heading'>
      <h2 id='group-inbox-heading' className='font-semibold'>
        Your Group invitations
      </h2>
      {invitations === undefined ? (
        <p role='status'>Loading invitations…</p>
      ) : (
        <>
          {invitations.page.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No Group invitations.
            </p>
          ) : (
            invitations.page.map(invitation => (
              <GroupInvitationCard
                key={invitation.inviteId}
                invitation={invitation}
                onOpenGroup={onOpenGroup}
              />
            ))
          )}
          <GroupPagination
            cursor={cursor}
            onCursor={setCursor}
            page={invitations}
            label='invitations'
          />
        </>
      )}
    </section>
  );
}
