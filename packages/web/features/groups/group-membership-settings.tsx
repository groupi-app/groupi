'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { useGroup } from '@/hooks/convex/use-groups';
import { useLeaveGroup } from '@/hooks/convex/use-group-moderation';
import { GroupOwnershipTransfer } from '@/components/organisms/group-ownership-transfer';
import { GroupDiscordConnect } from '@/components/organisms/group-discord-connect';
import { GroupConfirmedAction } from '@/components/organisms/group-confirmed-action';
import { GroupSettingsPanel } from './group-settings-panel';

export function GroupMembershipSettings({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const group = useGroup(groupId);
  const leave = useLeaveGroup();
  const router = useRouter();
  if (!group) return null;
  return (
    <GroupSettingsPanel title='Your membership'>
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
    </GroupSettingsPanel>
  );
}
