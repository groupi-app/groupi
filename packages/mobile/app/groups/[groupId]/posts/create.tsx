import { type ErrorBoundaryProps, useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { GroupPostEditor } from '@/components/groups/group-posts';
export default function Screen() {
  const { groupId } = useLocalSearchParams<{
    groupId: string;
    postId: string;
  }>();
  return (
    <DetailScreenTemplate title='Group posts'>
      <GroupPostEditor groupId={groupId as Id<'groups'>} />
    </DetailScreenTemplate>
  );
}
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <DetailScreenTemplate title='Group posts'>
      <Text accessibilityRole='alert'>
        {error.message || 'Post access is unavailable.'}
      </Text>
      <Button onPress={retry}>Try again</Button>
    </DetailScreenTemplate>
  );
}
