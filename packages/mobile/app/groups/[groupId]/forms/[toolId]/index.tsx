import { type ErrorBoundaryProps, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { GroupOrdinaryForm } from '@/components/groups/group-ordinary-forms';
export default function Screen() {
  const { groupId, toolId } = useLocalSearchParams<{
    groupId: string;
    toolId: string;
  }>();
  return (
    <DetailScreenTemplate title='Group forms'>
      <GroupOrdinaryForm
        groupId={groupId as Id<'groups'>}
        toolId={toolId as Id<'groupTools'>}
      />
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
