import { type ErrorBoundaryProps, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { GroupQuestionnaire } from '@/components/groups/group-questionnaire';
export default function Screen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  return (
    <DetailScreenTemplate title='Joining questionnaire'>
      <GroupQuestionnaire groupId={groupId as Id<'groups'>} />
    </DetailScreenTemplate>
  );
}
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <DetailScreenTemplate title='Joining questionnaire'>
      <Text accessibilityRole='alert'>
        {error.message || 'Private questionnaire access is unavailable.'}
      </Text>
      <Button onPress={retry}>Try again</Button>
    </DetailScreenTemplate>
  );
}
