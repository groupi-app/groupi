'use client';
import type { Id } from '@/convex/_generated/dataModel';
import { useGroup } from '@/hooks/convex/use-groups';
import { GroupSettingsPanel } from './group-settings-panel';
import { GroupDiscordSettings } from '@/components/organisms/group-discord-settings';
export function GroupDiscordManagement({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroup(groupId);
  if (!group) return null;
  return (
    <GroupSettingsPanel title='Discord'>
      {group.canManageMembers && <GroupDiscordSettings groupId={groupId} />}
    </GroupSettingsPanel>
  );
}
