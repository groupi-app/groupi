import {
  router,
  type ErrorBoundaryProps,
  useLocalSearchParams,
} from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { GroupOrdinaryPollEditor } from '@/components/groups/group-polls';
export default function Screen() {
  const { groupId, toolId } = useLocalSearchParams<{
    groupId: string;
    toolId: string;
  }>();
  return (
    <DetailScreenTemplate title='Group polls'>
      <GroupOrdinaryPollEditor
        groupId={groupId as Id<'groups'>}
        toolId={toolId as Id<'groupTools'>}
      />
    </DetailScreenTemplate>
  );
}
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { groupId, toolId } = useLocalSearchParams<{
    groupId: string;
    toolId?: string;
  }>();
  return (
    <DetailScreenTemplate title='Group polls'>
      <Text accessibilityRole='alert'>
        {error.message || 'Poll access is unavailable.'}
      </Text>
      <Button onPress={retry}>Check current access</Button>
      <Button
        accessibilityLabel='Polls and owner policy'
        onPress={() => router.push(`/groups/${groupId}/polls`)}
      >
        Polls and owner policy
      </Button>
      {toolId && (
        <Button
          accessibilityLabel='My retained vote history'
          onPress={() =>
            router.push(`/groups/${groupId}/polls/${toolId}/history`)
          }
        >
          My retained vote history
        </Button>
      )}
    </DetailScreenTemplate>
  );
}
