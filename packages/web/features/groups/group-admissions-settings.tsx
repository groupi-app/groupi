'use client';
import type { Id } from '@/convex/_generated/dataModel';
import { useGroup } from '@/hooks/convex/use-groups';
import { GroupSettingsPanel } from './group-settings-panel';
import { GroupApplicationSettings } from '@/components/organisms/group-application-settings';
import { GroupApplications } from '@/components/organisms/group-applications';
import { GroupMemberRoster } from '@/components/organisms/group-member-roster';
import { GroupEventSharingPolicy } from '@/components/organisms/group-event-sharing-policy';
export function GroupAdmissionsSettings({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const group = useGroup(groupId);
  if (!group) return null;
  return (
    <GroupSettingsPanel title='Admissions & event sharing'>
      <>
        {group.canManageRoles && (
          <>
            <GroupApplicationSettings
              key={JSON.stringify([
                group.applicationsEnabled,
                group.applicationQuestions,
              ])}
              groupId={groupId}
              applicationsEnabled={group.applicationsEnabled}
              questions={group.applicationQuestions}
            />
            <GroupEventSharingPolicy
              key={group.eventSharingPolicy}
              groupId={groupId}
              initialPolicy={group.eventSharingPolicy}
            />
          </>
        )}
        {group.canManageMembers && (
          <>
            <GroupApplications groupId={groupId} review />
            <GroupMemberRoster groupId={groupId} />
          </>
        )}
      </>
    </GroupSettingsPanel>
  );
}
