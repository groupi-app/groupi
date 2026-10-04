import { type ErrorBoundaryProps, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { GroupQuestionnaireSettings } from '@/components/groups/group-questionnaire-settings';
export default function Screen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  return (
    <DetailScreenTemplate title='Questionnaire settings'>
      <GroupQuestionnaireSettings groupId={groupId as Id<'groups'>} />
    </DetailScreenTemplate>
  );
}
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <DetailScreenTemplate title='Questionnaire settings'>
      <Text accessibilityRole='alert'>
        {error.message || 'Private questionnaire access is unavailable.'}
      </Text>
      <Button onPress={retry}>Try again</Button>
    </DetailScreenTemplate>
  );
}
