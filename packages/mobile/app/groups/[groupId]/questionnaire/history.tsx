import { type ErrorBoundaryProps, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { GroupQuestionnaireHistory } from '@/components/groups/group-questionnaire';
export default function Screen() {
  const { groupId, personId } = useLocalSearchParams<{
    groupId: string;
    personId?: string;
  }>();
  return (
    <DetailScreenTemplate title='Saved answer history'>
      <GroupQuestionnaireHistory
        groupId={groupId as Id<'groups'>}
        personId={personId as Id<'persons'> | undefined}
      />
    </DetailScreenTemplate>
  );
}
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <DetailScreenTemplate title='Saved answer history'>
      <Text accessibilityRole='alert'>
        {error.message || 'Private questionnaire access is unavailable.'}
      </Text>
      <Button onPress={retry}>Try again</Button>
    </DetailScreenTemplate>
  );
}
