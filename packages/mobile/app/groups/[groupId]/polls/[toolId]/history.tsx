import { GroupPollError } from '@/components/groups/group-poll-error';
import { type ErrorBoundaryProps, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { GroupOrdinaryPollHistory } from '@/components/groups/group-polls';
export default function Screen() {
  const { toolId } = useLocalSearchParams<{
    groupId: string;
    toolId: string;
  }>();
  return (
    <DetailScreenTemplate title='Group polls'>
      <GroupOrdinaryPollHistory toolId={toolId as Id<'groupTools'>} />
    </DetailScreenTemplate>
  );
}
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { groupId, toolId } = useLocalSearchParams<{
    groupId: string;
    toolId?: string;
  }>();
  return (
    <GroupPollError
      error={error}
      retry={retry}
      groupId={groupId}
      toolId={toolId}
    />
  );
}
