'use client';
import type { Id } from '@/convex/_generated/dataModel';
import { useGroup } from '@/hooks/convex/use-groups';
import { GroupSettingsPanel } from './group-settings-panel';
import { GroupOwnershipTransfer } from '@/components/organisms/group-ownership-transfer';
import { CommunityExpulsionProgress } from '@/components/organisms/community-expulsion-progress';
import { GroupBanManagement } from '@/components/organisms/group-ban-management';
import { GroupDeletion } from './group-deletion';
export function GroupOwnershipSettings({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId);
  if (!group) return null;
  return (
    <GroupSettingsPanel title='Ownership & safety'>
      <>
        {group.canManageIdentity && (
          <GroupOwnershipTransfer groupId={groupId} />
        )}
        {group.canManageMembers && (
          <>
            <CommunityExpulsionProgress groupId={groupId} />
            <GroupBanManagement groupId={groupId} />
          </>
        )}
        {group.canManageIdentity && <GroupDeletion groupId={groupId} />}
      </>
    </GroupSettingsPanel>
  );
}
