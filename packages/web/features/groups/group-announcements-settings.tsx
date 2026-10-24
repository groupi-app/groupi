'use client';
import type { Id } from '@/convex/_generated/dataModel';
import { useGroup } from '@/hooks/convex/use-groups';
import { GroupSettingsPanel } from './group-settings-panel';
import { GroupAnnouncementComposer } from '@/components/organisms/group-announcement-composer';
import { EventMail } from '@/features/group-announcements/event-mail';
export function GroupAnnouncementsSettings({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const group = useGroup(groupId);
  if (!group) return null;
  return (
    <GroupSettingsPanel title='Announcements'>
      {group.viewerRole !== 'MEMBER' && (
        <>
          <GroupAnnouncementComposer groupId={groupId} />
          <EventMail groupId={groupId} />
        </>
      )}
    </GroupSettingsPanel>
  );
}
