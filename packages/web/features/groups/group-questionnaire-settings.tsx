'use client';
import type { Id } from '@/convex/_generated/dataModel';
import { useGroup } from '@/hooks/convex/use-groups';
import { GroupSettingsPanel } from './group-settings-panel';
import { useJoiningQuestionnaire } from '@/hooks/convex/use-group-questionnaire';
import { GroupQuestionnaireSettings } from '@/components/organisms/group-questionnaire-settings';
import { GroupQuestionnaireReview } from '@/components/organisms/group-questionnaire-review';
function QuestionnaireManagement({ groupId }: { groupId: Id<'groups'> }) {
  const form = useJoiningQuestionnaire({ groupId });
  if (!form) return <p role='status'>Loading questionnaire…</p>;
  return (
    <>
      {form.canConfigure && (
        <GroupQuestionnaireSettings key={form.version} form={form} />
      )}
      {form.canReview && <GroupQuestionnaireReview groupId={groupId} />}
    </>
  );
}
export function GroupQuestionnaireManagement({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const group = useGroup(groupId);
  if (!group) return null;
  return (
    <GroupSettingsPanel title='Joining questionnaire'>
      {(group.canManageMembers || group.canManageRoles) && (
        <QuestionnaireManagement groupId={groupId} />
      )}
    </GroupSettingsPanel>
  );
}
