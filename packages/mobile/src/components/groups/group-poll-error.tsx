import { router, type ErrorBoundaryProps } from 'expo-router';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
/** Shared presentation; each Expo route owns its boundary export and parameters. */
export function GroupPollError({
  error,
  retry,
  groupId,
  toolId,
}: ErrorBoundaryProps & { groupId: string; toolId?: string }) {
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
