import { type ErrorBoundaryProps, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { GroupFormsHub } from '@/components/groups/group-ordinary-forms';
export default function Screen() {
  const { groupId } = useLocalSearchParams<{
    groupId: string;
    toolId: string;
  }>();
  return (
    <DetailScreenTemplate title='Group forms'>
      <GroupFormsHub groupId={groupId as Id<'groups'>} />
    </DetailScreenTemplate>
  );
}
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <DetailScreenTemplate title='Group forms'>
      <Text accessibilityRole='alert'>
        {error.message || 'Form access is unavailable.'}
      </Text>
      <Button onPress={retry}>Try again</Button>
    </DetailScreenTemplate>
  );
}
