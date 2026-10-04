'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { useGroup } from '@/hooks/convex/use-groups';
import { useMyGroupInviteForGroup } from '@/hooks/convex/use-group-invitations';
import { GroupInvitationCard } from './group-invitation-card';

// Mount only for authenticated viewers. The link itself grants no invitation.
export function GroupLandingInvitation({ groupId }: { groupId: Id<'groups'> }) {
  const ownInvite = useMyGroupInviteForGroup(groupId);
  const ownGroup = useGroup(groupId);
  const router = useRouter();
  if (ownInvite === undefined || ownGroup === undefined)
    return <p role='status'>Checking your Group access…</p>;
  return (
    <div className='space-y-4'>
      {ownInvite && (
        <GroupInvitationCard
          invitation={ownInvite}
          onOpenGroup={id => router.push(`/groups/${id}`)}
        />
      )}
      {ownGroup ? (
        <Button asChild>
          <Link href={`/groups/${groupId}`}>Open Group</Link>
        </Button>
      ) : (
        <p className='text-sm text-muted-foreground'>
          This page is not an invitation. You need a manager invitation to
          become a member.
        </p>
      )}
    </div>
  );
}
