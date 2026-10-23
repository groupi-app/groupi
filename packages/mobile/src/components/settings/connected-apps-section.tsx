import { useAuthorizationClock } from '@/hooks/use-authorization-clock';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  useConnectedApps,
  useDisconnectApp,
  useAuthorizationEvents,
} from '@/hooks/use-authorization';
import { authorizationActionLabel } from '@groupi/shared/hooks';
import { toast } from '@groupi/shared/platform';

export function ConnectedAppsSection() {
  const now = useAuthorizationClock();
  const connections = useConnectedApps();
  const events = useAuthorizationEvents();
  const disconnect = useDisconnectApp();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected apps</CardTitle>
        <Text variant='muted'>
          Review each app’s account access and event bounds.
        </Text>
      </CardHeader>
      <CardContent className='gap-3'>
        {connections === undefined ? (
          <Text>Loading connected apps…</Text>
        ) : connections.length === 0 ? (
          <Text>No connected apps</Text>
        ) : (
          connections.map(connection => (
            <View
              key={connection.grantId}
              className='gap-2 rounded-input border border-border p-3'
            >
              <Text className='font-semibold'>{connection.appName}</Text>
              <Text>
                Status:{' '}
                {connection.status === 'active' &&
                connection.expiresAt &&
                connection.expiresAt <= now
                  ? 'expired'
                  : connection.status}
              </Text>
              <Text>
                Actions:{' '}
                {connection.actions.map(authorizationActionLabel).join(', ')}
              </Text>
              <Text>
                Events:{' '}
                {connection.selector.kind === 'all-current-and-future'
                  ? 'All current and future events'
                  : connection.selector.eventIds
                      .map(
                        id =>
                          events?.find(event => event._id === id)?.title ?? id
                      )
                      .join(', ')}
              </Text>
              <Text>
                {connection.background
                  ? 'Background access allowed'
                  : 'Background refresh not allowed'}
              </Text>
              <Text>
                {connection.expiresAt
                  ? `Expires ${new Date(connection.expiresAt).toLocaleString()}`
                  : 'No expiration'}
              </Text>
              {connection.status !== 'revoked' && (
                <Button
                  variant='destructive'
                  onPress={() =>
                    showConfirmDialog({
                      title: 'Disconnect app?',
                      message:
                        'Groupi will reject future requests and refreshes for this connection. Previously copied data, downloaded files, issued file links, and the app’s own sessions are not removed.',
                      confirmLabel: 'Disconnect',
                      destructive: true,
                      onConfirm: async () => {
                        try {
                          await disconnect({ grantId: connection.grantId });
                          toast.success('App disconnected');
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : 'Could not disconnect app'
                          );
                        }
                      },
                    })
                  }
                >
                  <Text>Disconnect</Text>
                </Button>
              )}
            </View>
          ))
        )}
      </CardContent>
    </Card>
  );
}
