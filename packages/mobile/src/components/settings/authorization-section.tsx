import { useState } from 'react';
import { useAuthorizationClock } from '@/hooks/use-authorization-clock';
import { View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { FunctionReturnType } from 'convex/server';
import { api } from 'convex/_generated/api';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { authorizationActionLabel } from '@groupi/shared/hooks';
import { toast } from '@groupi/shared/platform';
import {
  useAuthorizationGrants,
  useAuthorizationEvents,
  useAuthorizationCatalog,
  useAuthorizationAudit,
  useIssueAuthorization,
  useRevokeAuthorization,
} from '@/hooks/use-authorization';

type Grant = FunctionReturnType<typeof api.authorization.queries.list>[number];

export function AuthorizationSection() {
  const now = useAuthorizationClock();
  const grants = useAuthorizationGrants()?.filter(
    grant => grant.appId === null
  );
  const events = useAuthorizationEvents();
  const catalog = useAuthorizationCatalog();
  const issue = useIssueAuthorization();
  const revoke = useRevokeAuthorization();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'user' | 'integration'>('user');
  const [actions, setActions] = useState<Grant['actions']>([]);
  const [selected, setSelected] = useState<
    Grant['selector'] & { kind: 'selected' }
  >({ kind: 'selected', eventIds: [] });
  const [broad, setBroad] = useState(false);
  const [expiry, setExpiry] = useState<30 | 90 | 365>(90);
  const [secret, setSecret] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [auditId, setAuditId] = useState<Grant['grantId']>();
  const audit = useAuthorizationAudit(auditId);
  async function create() {
    setBusy(true);
    try {
      const result = await issue({
        name: name.trim(),
        principalKind: kind,
        actions,
        selector: broad ? { kind: 'all-current-and-future' } : selected,
        expiresAt: Date.now() + expiry * 86400000,
      });
      setSecret(result.key);
      setCreating(false);
      setName('');
      setActions([]);
      setSelected({ kind: 'selected', eventIds: [] });
      setBroad(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not create key'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Named keys and integrations</CardTitle>
        <Text variant='muted'>
          Choose allowed actions and events for each key. Integrations act under
          their own author name.
        </Text>
      </CardHeader>
      <CardContent className='gap-4'>
        {grants === undefined ? (
          <Text>Loading bounded keys…</Text>
        ) : grants.length === 0 ? (
          <Text>No bounded keys yet</Text>
        ) : (
          grants.map(grant => (
            <View
              key={grant.grantId}
              className='gap-2 rounded-input border border-border p-3'
            >
              <Text className='font-semibold'>{grant.name}</Text>
              <Text>
                {grant.principalKind === 'integration'
                  ? 'Integration'
                  : 'Named user key'}{' '}
                ·{' '}
                {grant.revokedAt
                  ? 'Revoked'
                  : grant.expiresAt && grant.expiresAt <= now
                    ? 'Expired'
                    : 'Active'}
              </Text>
              <Text>
                Actions:{' '}
                {grant.actions.map(authorizationActionLabel).join(', ')}
              </Text>
              <Text>
                Events:{' '}
                {grant.selector.kind === 'all-current-and-future'
                  ? 'All current and future events'
                  : grant.selector.eventIds
                      .map(
                        id =>
                          events?.find(event => event._id === id)?.title ?? id
                      )
                      .join(', ')}
              </Text>
              <Text>
                {grant.expiresAt
                  ? `Expires ${new Date(grant.expiresAt).toLocaleDateString()}`
                  : 'No expiration'}
              </Text>
              <Button
                variant='outline'
                onPress={() => setAuditId(grant.grantId)}
              >
                <Text>View activity</Text>
              </Button>
              {!grant.revokedAt && (
                <Button
                  variant='destructive'
                  onPress={() =>
                    showConfirmDialog({
                      title: 'Revoke key?',
                      message:
                        'Future requests using this key will be rejected. Requests already completed are not undone.',
                      confirmLabel: 'Revoke',
                      destructive: true,
                      onConfirm: async () => {
                        try {
                          await revoke({ grantId: grant.grantId });
                          toast.success('Key revoked');
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : 'Could not revoke key'
                          );
                        }
                      },
                    })
                  }
                >
                  <Text>Revoke key</Text>
                </Button>
              )}
            </View>
          ))
        )}
        {auditId && (
          <View className='gap-2'>
            <Text className='font-semibold'>Activity · past 90 days</Text>
            {audit === undefined ? (
              <Text>Loading activity…</Text>
            ) : audit.length === 0 ? (
              <Text>No recorded activity</Text>
            ) : (
              audit.map(entry => (
                <Text key={entry._id}>
                  {new Date(entry.createdAt).toLocaleString()} ·{' '}
                  {entry.operation} · {entry.result} · {entry.reason}
                </Text>
              ))
            )}
            <Button variant='outline' onPress={() => setAuditId(undefined)}>
              <Text>Close activity</Text>
            </Button>
          </View>
        )}
        {secret && (
          <View className='gap-3 rounded-input bg-muted p-3'>
            <Text>
              Copy this key now. It will not be shown again after you dismiss
              it.
            </Text>
            <Text selectable className='font-mono'>
              {secret}
            </Text>
            <Button
              onPress={async () => {
                try {
                  await Clipboard.setStringAsync(secret);
                  toast.success('Key copied');
                } catch {
                  toast.error('Could not copy key');
                }
              }}
            >
              <Text>Copy key</Text>
            </Button>
            <Button variant='outline' onPress={() => setSecret(undefined)}>
              <Text>I saved my key</Text>
            </Button>
          </View>
        )}
        {!creating ? (
          <Button onPress={() => setCreating(true)} disabled={!!secret}>
            <Text>Create bounded key</Text>
          </Button>
        ) : (
          <View className='gap-3'>
            <Text>Key name</Text>
            <Input
              accessibilityLabel='Key name'
              value={name}
              onChangeText={setName}
              placeholder='My automation'
            />
            <Text>Author</Text>
            <View className='gap-2'>
              {(['user', 'integration'] as const).map(value => (
                <Button
                  key={value}
                  variant={kind === value ? 'default' : 'outline'}
                  onPress={() => {
                    setKind(value);
                    setActions([]);
                    setSelected({ kind: 'selected', eventIds: [] });
                    setBroad(false);
                  }}
                >
                  <Text>{value === 'user' ? 'My account' : 'Integration'}</Text>
                </Button>
              ))}
            </View>
            <Text>Allowed actions</Text>
            {catalog
              ?.filter(
                item => item.supported && item.principalKinds.includes(kind)
              )
              .map(item => (
                <Button
                  key={item.action}
                  variant={
                    actions.includes(item.action) ? 'default' : 'outline'
                  }
                  onPress={() =>
                    setActions(current =>
                      current.includes(item.action)
                        ? current.filter(value => value !== item.action)
                        : [...current, item.action]
                    )
                  }
                >
                  <Text>
                    {actions.includes(item.action) ? 'Selected: ' : ''}
                    {authorizationActionLabel(item.action)}
                  </Text>
                </Button>
              ))}
            <Text>Event access</Text>
            {kind === 'user' && (
              <Button
                variant={broad ? 'default' : 'outline'}
                onPress={() => setBroad(!broad)}
              >
                <Text>
                  All current and future events{' '}
                  {broad ? '(selected)' : '(explicit opt-in)'}
                </Text>
              </Button>
            )}
            {!broad &&
              events
                ?.filter(event => kind === 'user' || event.role === 'ORGANIZER')
                .map(event => (
                  <Button
                    key={event._id}
                    variant={
                      selected.eventIds.includes(event._id)
                        ? 'default'
                        : 'outline'
                    }
                    onPress={() =>
                      setSelected(current => ({
                        kind: 'selected',
                        eventIds: current.eventIds.includes(event._id)
                          ? current.eventIds.filter(id => id !== event._id)
                          : [...current.eventIds, event._id],
                      }))
                    }
                  >
                    <Text>
                      {selected.eventIds.includes(event._id)
                        ? 'Selected: '
                        : ''}
                      {event.title}
                    </Text>
                  </Button>
                ))}
            {kind === 'integration' && (
              <Text variant='muted'>
                Select events where you are an organizer. Discussion changes
                apply to this integration’s own posts and replies.
              </Text>
            )}
            <Text>Expires after</Text>
            {([30, 90, 365] as const).map(days => (
              <Button
                key={days}
                variant={expiry === days ? 'default' : 'outline'}
                onPress={() => setExpiry(days)}
              >
                <Text>{days} days</Text>
              </Button>
            ))}
            <Button
              disabled={
                busy ||
                !name.trim() ||
                !actions.length ||
                (!broad &&
                  !selected.eventIds.length &&
                  (kind === 'integration' ||
                    actions.some(action => !action.startsWith('identity.'))))
              }
              onPress={create}
            >
              <Text>{busy ? 'Creating…' : 'Create key'}</Text>
            </Button>
            <Button
              variant='outline'
              disabled={busy}
              onPress={() => setCreating(false)}
            >
              <Text>Cancel</Text>
            </Button>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
