import { type ErrorBoundaryProps, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { GroupListEditor } from '@/components/groups/group-persistent-lists';
export default function Screen() {
  const { groupId } = useLocalSearchParams<{
    groupId: string;
    toolId: string;
  }>();
  return (
    <DetailScreenTemplate title='Group lists'>
      <GroupListEditor groupId={groupId as Id<'groups'>} />
    </DetailScreenTemplate>
  );
}
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <DetailScreenTemplate title='Group lists'>
      <Text accessibilityRole='alert'>
        {error.message || 'List access is unavailable.'}
      </Text>
      <Button onPress={retry}>Try again</Button>
    </DetailScreenTemplate>
  );
}
