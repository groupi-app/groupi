'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SettingsActions } from './settings-actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

export function DeveloperAppsSettings() {
  const apps = useQuery(api.delegatedApps.queries.listOwnedApps, {});
  const register = useMutation(api.delegatedApps.mutations.registerApp);
  const requestReview = useMutation(api.delegatedApps.mutations.requestReview);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [clientType, setClientType] = useState<'confidential' | 'native'>(
    'confidential'
  );
  const [callbacks, setCallbacks] = useState('');
  const [publicJwks, setPublicJwks] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const selectedApp = apps?.find(app => app._id === detailsId);
  const actionTrigger = useRef<HTMLButtonElement | null>(null);
  async function submit() {
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      await register({
        name: name.trim(),
        purpose: purpose.trim(),
        clientType,
        redirectUris: callbacks
          .split('\n')
          .map(value => value.trim())
          .filter(Boolean),
        ...(clientType === 'confidential' ? { publicJwks } : {}),
      });
      setNotice('App registered for own-account testing.');
      setName('');
      setPurpose('');
      setCallbacks('');
      setPublicJwks('');
      setRegistrationOpen(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not register app'
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Developer apps</CardTitle>
        <CardDescription>
          Register a native app or a confidential web app to request delegated
          access.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {notice ? (
          <p role='status' className='text-success'>
            {notice}
          </p>
        ) : null}
        {error ? (
          <p role='alert' className='text-error'>
            {error}
          </p>
        ) : null}
        {apps === undefined ? (
          <p role='status'>Loading apps…</p>
        ) : (
          <div className='divide-y divide-border'>
            {apps.map(app => (
              <div
                key={app._id}
                className='flex min-w-0 items-start justify-between gap-3 py-3'
              >
                <div className='min-w-0 space-y-1'>
                  <p className='break-words text-sm font-semibold'>
                    {app.name}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {app.status} · {app.reviewStatus}
                  </p>
                </div>
                <SettingsActions
                  label={`Actions for ${app.name}`}
                  actions={[
                    {
                      label: 'Copy ID',
                      onSelect: async () => {
                        try {
                          await navigator.clipboard.writeText(app._id);
                          setNotice('App ID copied.');
                        } catch {
                          setError(
                            'Could not copy the App ID. Open Details to copy it manually.'
                          );
                        }
                      },
                    },
                    {
                      label: 'Details',
                      onSelect: trigger => {
                        actionTrigger.current = trigger;
                        setDetailsId(app._id);
                      },
                    },
                    ...(app.status === 'testing' &&
                    (app.reviewStatus === 'not-requested' ||
                      app.reviewStatus === 'rejected')
                      ? [
                          {
                            label:
                              app.reviewStatus === 'rejected'
                                ? 'Request another review'
                                : 'Request review',
                            disabled: pending,
                            onSelect: async () => {
                              setPending(true);
                              setError(null);
                              try {
                                await requestReview({ appId: app._id });
                                setNotice(
                                  'Review requested. Wider access requires platform administrator approval.'
                                );
                              } catch (cause) {
                                setError(
                                  cause instanceof Error
                                    ? cause.message
                                    : 'Could not request review'
                                );
                              } finally {
                                setPending(false);
                              }
                            },
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            ))}
          </div>
        )}
        <Button onClick={() => setRegistrationOpen(true)}>Register app</Button>
        <Dialog
          open={registrationOpen}
          onOpenChange={value => {
            if (!pending) setRegistrationOpen(value);
          }}
        >
          <DialogContent
            preventClose={pending}
            className='max-h-[90dvh] overflow-y-auto'
          >
            <DialogHeader>
              <DialogTitle>Register app</DialogTitle>
              <DialogDescription>
                Start with access to your own account.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <p role='alert' className='text-sm text-error'>
                {error}
              </p>
            )}
            <form
              className='space-y-4'
              onSubmit={event => {
                event.preventDefault();
                void submit();
              }}
            >
              <div className='space-y-2'>
                <Label htmlFor='app-name'>App name</Label>
                <Input
                  id='app-name'
                  value={name}
                  onChange={event => setName(event.target.value)}
                  required
                  maxLength={100}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='app-purpose'>Purpose</Label>
                <Textarea
                  id='app-purpose'
                  value={purpose}
                  onChange={event => setPurpose(event.target.value)}
                  required
                  maxLength={1000}
                />
              </div>
              <fieldset className='space-y-2'>
                <legend className='font-medium'>App type</legend>
                <label className='flex items-center gap-2'>
                  <input
                    type='radio'
                    name='app-type'
                    checked={clientType === 'confidential'}
                    onChange={() => setClientType('confidential')}
                  />
                  Confidential web app
                </label>
                <label className='flex items-center gap-2'>
                  <input
                    type='radio'
                    name='app-type'
                    checked={clientType === 'native'}
                    onChange={() => setClientType('native')}
                  />
                  Native app
                </label>
              </fieldset>
              <div className='space-y-2'>
                <Label htmlFor='app-callbacks'>Callback URIs</Label>
                <Textarea
                  id='app-callbacks'
                  value={callbacks}
                  onChange={event => setCallbacks(event.target.value)}
                  required
                  aria-describedby='callback-help'
                />
                <p id='callback-help' className='text-sm text-muted-foreground'>
                  {clientType === 'confidential'
                    ? 'One exact HTTPS callback URI per line. Wildcards and fragments are not allowed.'
                    : 'One exact HTTPS callback, reverse-domain native URI such as com.example.calendar:/callback, or native loopback http://127.0.0.1:<port>/callback per line. Wildcards and fragments are not allowed. Reverse-domain naming does not verify scheme ownership.'}
                </p>
              </div>
              {clientType === 'confidential' ? (
                <div className='space-y-2'>
                  <Label htmlFor='app-public-jwks'>
                    Public signing keys (JWKS)
                  </Label>
                  <Textarea
                    id='app-public-jwks'
                    value={publicJwks}
                    onChange={event => setPublicJwks(event.target.value)}
                    required
                    aria-describedby='jwks-help'
                  />
                  <p id='jwks-help' className='text-sm text-muted-foreground'>
                    Provide public keys only. Keep private signing keys on your
                    app’s server.
                  </p>
                </div>
              ) : null}
              <p className='text-sm text-muted-foreground'>
                Only your own account can connect during testing. Wider access
                requires platform administrator approval.
              </p>
              <Button
                type='submit'
                isLoading={pending}
                disabled={
                  !name.trim() ||
                  !purpose.trim() ||
                  !callbacks.trim() ||
                  (clientType === 'confidential' && !publicJwks.trim())
                }
              >
                Register
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
              <DialogTitle>{selectedApp?.name ?? 'App details'}</DialogTitle>
              <DialogDescription>{selectedApp?.purpose}</DialogDescription>
            </DialogHeader>
            {selectedApp && (
              <dl className='space-y-3 text-sm'>
                <div>
                  <dt className='font-medium'>App ID</dt>
                  <dd className='break-all font-mono'>{selectedApp._id}</dd>
                </div>
                <div>
                  <dt className='font-medium'>Callback URIs</dt>
                  <dd>
                    <ul className='space-y-1'>
                      {selectedApp.redirectUris.map(uri => (
                        <li className='break-all' key={uri}>
                          {uri}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
