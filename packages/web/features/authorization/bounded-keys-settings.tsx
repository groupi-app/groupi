'use client';

import { useEffect, useRef, useState } from 'react';
import { SettingsActions } from './settings-actions';
import { authorizationActionLabel } from '@groupi/shared/hooks';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useAuthorizationGrants,
  useAuthorizationEvents,
  useAuthorizationCatalog,
  useIssueAuthorization,
  useRevokeAuthorization,
  useAuthorizationAudit,
  useReplaceAuthorizationBounds,
  useRevokeUserCredentials,
} from './hooks';

export function BoundedKeysSettings() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);
  const grants = useAuthorizationGrants();
  const events = useAuthorizationEvents();
  const catalog = useAuthorizationCatalog();
  const issue = useIssueAuthorization();
  const revoke = useRevokeAuthorization();
  const recoverUserCredentials = useRevokeUserCredentials();
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const replaceBounds = useReplaceAuthorizationBounds();
  const [editingId, setEditingId] = useState<Id<'authorizationGrants'> | null>(
    null
  );
  const [expiryDate, setExpiryDate] = useState(() =>
    new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
  );
  const [auditGrantId, setAuditGrantId] = useState<
    Id<'authorizationGrants'> | undefined
  >();
  const audit = useAuthorizationAudit(auditGrantId);
  const [revokeGrantId, setRevokeGrantId] =
    useState<Id<'authorizationGrants'> | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [principalKind, setPrincipalKind] = useState<'user' | 'integration'>(
    'user'
  );
  const [actions, setActions] = useState<
    NonNullable<typeof catalog>[number]['action'][]
  >([]);
  const [eventIds, setEventIds] = useState<Id<'events'>[]>([]);
  const [allEvents, setAllEvents] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [detailsId, setDetailsId] = useState<Id<'authorizationGrants'> | null>(
    null
  );
  const actionTrigger = useRef<HTMLButtonElement | null>(null);
  const detail = grants?.find(grant => grant.grantId === detailsId);
  const [notice, setNotice] = useState<string | null>(null);

  function close() {
    if (pending) return;
    setEditingId(null);
    setOpen(false);
    setSecret(null);
    setName('');
    setActions([]);
    setEventIds([]);
    setAllEvents(false);
    setPrincipalKind('user');
    setError(null);
    setCopied(false);
  }
  async function create() {
    setPending(true);
    setError(null);
    try {
      const selector = allEvents
        ? { kind: 'all-current-and-future' as const }
        : { kind: 'selected' as const, eventIds };
      if (editingId) {
        await replaceBounds({ grantId: editingId, actions, selector });
        setOpen(false);
        setEditingId(null);
        setName('');
        setActions([]);
        setEventIds([]);
        setAllEvents(false);
        setNotice('Key access updated.');
        return;
      }
      const result = await issue({
        name: name.trim(),
        principalKind,
        actions,
        selector: allEvents
          ? { kind: 'all-current-and-future' }
          : { kind: 'selected', eventIds },
        expiresAt: expiryDate
          ? new Date(`${expiryDate}T23:59:59`).getTime()
          : undefined,
      });
      setSecret(result.key);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create key');
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bounded API keys</CardTitle>
          <CardDescription>
            Choose the actions and events each key can access. Access always
            follows your current event authority.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {notice ? (
            <p role='status' className='text-success'>
              {notice}
            </p>
          ) : null}
          {grants === undefined ? (
            <p role='status'>Loading keys…</p>
          ) : grants.length === 0 ? (
            <p className='text-muted-foreground'>No bounded keys yet.</p>
          ) : null}
          <div className='divide-y divide-border'>
            {grants?.map(grant => (
              <div
                key={grant.grantId}
                className='flex min-w-0 items-start justify-between gap-3 py-3'
              >
                <div className='min-w-0 space-y-1'>
                  <p className='break-words text-sm font-semibold'>
                    {grant.name}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {grant.revokedAt
                      ? 'Revoked'
                      : grant.expiresAt && grant.expiresAt <= now
                        ? 'Expired'
                        : 'Active'}{' '}
                    ·{' '}
                    {grant.principalKind === 'integration'
                      ? 'Integration'
                      : 'Your account'}
                    {grant.expiresAt
                      ? ` · ${new Date(grant.expiresAt).toLocaleDateString()}`
                      : ''}
                  </p>
                </div>
                <SettingsActions
                  label={`Actions for ${grant.name}`}
                  actions={[
                    {
                      label: 'Details',
                      onSelect: trigger => {
                        actionTrigger.current = trigger;
                        setDetailsId(grant.grantId);
                      },
                    },
                    {
                      label: 'Activity',
                      onSelect: trigger => {
                        actionTrigger.current = trigger;
                        setAuditGrantId(grant.grantId);
                      },
                    },
                    ...(!grant.revokedAt
                      ? [
                          {
                            label: 'Edit access',
                            disabled: pending,
                            onSelect: (trigger: HTMLButtonElement | null) => {
                              actionTrigger.current = trigger;
                              setEditingId(grant.grantId);
                              setName(grant.name);
                              setPrincipalKind(grant.principalKind);
                              setActions(
                                grant.actions.filter(
                                  action => !action.startsWith('groups.')
                                )
                              );
                              setAllEvents(
                                grant.selector.kind === 'all-current-and-future'
                              );
                              setEventIds(
                                grant.selector.kind === 'selected'
                                  ? grant.selector.eventIds
                                  : []
                              );
                              setError(null);
                              setOpen(true);
                            },
                          },
                          {
                            label: 'Revoke',
                            destructive: true,
                            disabled: pending,
                            onSelect: (trigger: HTMLButtonElement | null) => {
                              actionTrigger.current = trigger;
                              setError(null);
                              setRevokeGrantId(grant.grantId);
                            },
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            ))}
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              onClick={() => {
                close();
                actionTrigger.current = null;
                setOpen(true);
              }}
            >
              Create bounded key
            </Button>
            <SettingsActions
              label='Key settings'
              actions={[
                {
                  label: 'Revoke my user credentials',
                  destructive: true,
                  disabled: pending,
                  onSelect: trigger => {
                    actionTrigger.current = trigger;
                    setError(null);
                    setRecoveryOpen(true);
                  },
                },
              ]}
            />
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={detailsId !== null}
        onOpenChange={value => {
          if (!value) setDetailsId(null);
        }}
      >
        <DialogContent
          className='max-h-[90dvh] overflow-y-auto'
          onCloseAutoFocus={event => {
            if (actionTrigger.current?.isConnected) {
              event.preventDefault();
              actionTrigger.current.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{detail?.name ?? 'Key details'}</DialogTitle>
            <DialogDescription>
              Allowed actions and selected events.
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <dl className='space-y-3 text-sm'>
              <div>
                <dt className='font-medium'>Actions</dt>
                <dd className='break-words text-muted-foreground'>
                  {detail.actions.map(authorizationActionLabel).join(', ')}
                </dd>
              </div>
              <div>
                <dt className='font-medium'>Events</dt>
                <dd className='break-words text-muted-foreground'>
                  {detail.selector.kind === 'all-current-and-future'
                    ? 'All current and future events within your authority'
                    : detail.selector.kind === 'selected-group'
                      ? `Selected Group (${detail.selector.groupId}) — own context only`
                      : detail.selector.eventIds
                          .map(
                            id =>
                              events?.find(event => event._id === id)?.title ??
                              'Unavailable event'
                          )
                          .join(', ') || 'None'}
                </dd>
              </div>
              <div>
                <dt className='font-medium'>Expiration</dt>
                <dd>
                  {detail.expiresAt
                    ? new Date(detail.expiresAt).toLocaleString()
                    : 'No expiration'}
                </dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={recoveryOpen}
        onOpenChange={value => {
          if (!pending) setRecoveryOpen(value);
        }}
      >
        <DialogContent
          preventClose={pending}
          onCloseAutoFocus={event => {
            if (actionTrigger.current?.isConnected) {
              event.preventDefault();
              actionTrigger.current.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Recover your user credentials</DialogTitle>
            <DialogDescription>
              Revoke all bounded credentials acting as your account, including
              connected apps. Integration keys keep their separate controls.
              Legacy keys must be revoked in Legacy API keys. Previously
              downloaded data and signed file links may remain accessible until
              those links expire.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p role='alert' className='text-error'>
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              variant='outline'
              disabled={pending}
              onClick={() => setRecoveryOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              isLoading={pending}
              onClick={async () => {
                setPending(true);
                setError(null);
                try {
                  await recoverUserCredentials({});
                  setRecoveryOpen(false);
                  setNotice(
                    'User credentials revoked. Integration keys were preserved.'
                  );
                } catch (cause) {
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : 'Could not revoke user credentials'
                  );
                } finally {
                  setPending(false);
                }
              }}
            >
              Confirm user credential recovery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={revokeGrantId !== null}
        onOpenChange={value => {
          if (!value && !pending) setRevokeGrantId(null);
        }}
      >
        <DialogContent
          preventClose={pending}
          onCloseAutoFocus={event => {
            if (actionTrigger.current?.isConnected) {
              event.preventDefault();
              actionTrigger.current.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Revoke this key?</DialogTitle>
            <DialogDescription>
              New requests will be denied after revocation completes. Previously
              downloaded data and signed file links may remain accessible until
              those links expire.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p role='alert' className='text-error'>
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              variant='outline'
              disabled={pending}
              onClick={() => setRevokeGrantId(null)}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              isLoading={pending}
              onClick={async () => {
                if (!revokeGrantId) return;
                setPending(true);
                setError(null);
                try {
                  await revoke({ grantId: revokeGrantId });
                  setRevokeGrantId(null);
                  setNotice('Key revoked. New requests will be denied.');
                } catch (cause) {
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : 'Could not revoke key'
                  );
                } finally {
                  setPending(false);
                }
              }}
            >
              Confirm revocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={auditGrantId !== undefined}
        onOpenChange={value => {
          if (!value) setAuditGrantId(undefined);
        }}
      >
        <DialogContent
          className='max-h-[90dvh] overflow-y-auto'
          onCloseAutoFocus={event => {
            if (actionTrigger.current?.isConnected) {
              event.preventDefault();
              actionTrigger.current.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Key activity</DialogTitle>
            <DialogDescription>
              Owner-visible activity. Shows up to 100 recent entries; activity
              is automatically removed after the 90-day retention period.
            </DialogDescription>
          </DialogHeader>
          {audit === undefined ? (
            <p role='status'>Loading activity…</p>
          ) : audit.length === 0 ? (
            <p>No activity recorded.</p>
          ) : (
            <ul className='space-y-3'>
              {audit.map(entry => (
                <li
                  key={entry._id}
                  className='rounded-input border border-border p-3'
                >
                  <p>
                    {entry.operation} · {entry.result}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {entry.reason} ·{' '}
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={open}
        onOpenChange={value => {
          if (!value) close();
        }}
      >
        <DialogContent
          className='max-h-[90dvh] overflow-y-auto'
          onCloseAutoFocus={event => {
            if (actionTrigger.current?.isConnected) {
              event.preventDefault();
              actionTrigger.current.focus();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {secret
                ? 'Save your API key'
                : editingId
                  ? 'Edit key access'
                  : 'Create bounded key'}
            </DialogTitle>
            <DialogDescription>
              {secret
                ? 'Copy this secret now. It is shown only once.'
                : 'Grant only the actions and events this key needs.'}
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p role='alert' className='text-error'>
              {error}
            </p>
          ) : null}
          {secret ? (
            <div className='space-y-4'>
              <code className='block break-all rounded-input bg-muted p-3'>
                {secret}
              </code>
              <Button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(secret);
                    setCopied(true);
                  } catch {
                    setError(
                      'Could not copy. Select and copy the key manually.'
                    );
                  }
                }}
              >
                {copied ? 'Copied' : 'Copy key'}
              </Button>
              <Button variant='outline' onClick={close}>
                Done
              </Button>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='bounded-key-name'>Key name</Label>
                <Input
                  id='bounded-key-name'
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={100}
                  disabled={editingId !== null}
                />
              </div>
              <fieldset className='space-y-2' disabled={editingId !== null}>
                <legend className='font-medium'>Acts as</legend>
                <label className='flex items-center gap-2'>
                  <input
                    type='radio'
                    name='principal-kind'
                    checked={principalKind === 'user'}
                    onChange={() => setPrincipalKind('user')}
                  />
                  Your account
                </label>
                <label className='flex items-center gap-2'>
                  <input
                    type='radio'
                    name='principal-kind'
                    checked={principalKind === 'integration'}
                    onChange={() => {
                      setPrincipalKind('integration');
                      setAllEvents(false);
                      setEventIds([]);
                      setActions([]);
                    }}
                  />
                  Named integration
                </label>
                {principalKind === 'integration' ? (
                  <p className='text-sm text-muted-foreground'>
                    Discussion posts and replies show the integration’s name.
                    Select events where you are an organizer.
                  </p>
                ) : null}
              </fieldset>
              <fieldset className='space-y-2'>
                <legend className='font-medium'>Actions</legend>
                {catalog
                  ?.filter(
                    entry =>
                      entry.supported &&
                      entry.principalKinds.includes(principalKind)
                  )
                  .map(entry => (
                    <label
                      key={entry.action}
                      className='flex items-center gap-2'
                    >
                      <Checkbox
                        checked={actions.includes(entry.action)}
                        onCheckedChange={checked =>
                          setActions(current =>
                            checked
                              ? [...current, entry.action]
                              : current.filter(
                                  action => action !== entry.action
                                )
                          )
                        }
                      />
                      {authorizationActionLabel(entry.action)}
                    </label>
                  ))}
              </fieldset>
              <fieldset className='space-y-2'>
                <legend className='font-medium'>Events</legend>
                {principalKind === 'user' ? (
                  <label className='flex items-start gap-2'>
                    <Checkbox
                      checked={allEvents}
                      onCheckedChange={checked =>
                        setAllEvents(checked === true)
                      }
                    />
                    All current and future events within my current authority
                  </label>
                ) : null}
                {!allEvents ? (
                  events
                    ?.filter(
                      event =>
                        principalKind === 'user' || event.role === 'ORGANIZER'
                    )
                    .map(event => (
                      <label
                        key={event._id}
                        className='flex items-center gap-2'
                      >
                        <Checkbox
                          checked={eventIds.includes(event._id)}
                          onCheckedChange={checked =>
                            setEventIds(current =>
                              checked
                                ? [...current, event._id]
                                : current.filter(id => id !== event._id)
                            )
                          }
                        />
                        {event.title}
                      </label>
                    ))
                ) : (
                  <p className='text-sm text-text-warning'>
                    This explicitly includes events you join in the future.
                    Losing event authority removes access.
                  </p>
                )}
              </fieldset>
              {!editingId ? (
                <div className='space-y-2'>
                  <Label htmlFor='bounded-key-expiry'>Expiration date</Label>
                  <Input
                    id='bounded-key-expiry'
                    type='date'
                    value={expiryDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={event => setExpiryDate(event.target.value)}
                  />
                  <p className='text-sm text-muted-foreground'>
                    Leave blank only if this key should have no expiration.
                  </p>
                </div>
              ) : null}
              <DialogFooter>
                <Button variant='outline' onClick={close} disabled={pending}>
                  Cancel
                </Button>
                <Button
                  onClick={create}
                  isLoading={pending}
                  disabled={
                    !name.trim() ||
                    !actions.length ||
                    (!allEvents &&
                      !eventIds.length &&
                      (principalKind === 'integration' ||
                        actions.some(
                          action => !action.startsWith('identity.')
                        ))) ||
                    !catalog ||
                    !events
                  }
                >
                  {editingId ? 'Save access' : 'Create key'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
