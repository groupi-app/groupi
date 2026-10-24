'use client';
import type { Id } from '@/convex/_generated/dataModel';
import { useGroup } from '@/hooks/convex/use-groups';
import { GroupSettingsPanel } from './group-settings-panel';
import { GroupInvitationManagement } from '@/components/organisms/group-invitation-management';
export function GroupInvitationsSettings({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const group = useGroup(groupId);
  if (!group) return null;
  return (
    <GroupSettingsPanel title='Invitations'>
      {group.canManageInvitations && (
        <GroupInvitationManagement
          groupId={groupId}
          invitationsEnabled={group.invitationsEnabled}
          canManagePolicies={group.canManageRoles}
        />
      )}
    </GroupSettingsPanel>
  );
}
