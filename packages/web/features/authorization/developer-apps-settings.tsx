'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
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
          apps.map(app => (
            <div
              key={app._id}
              className='space-y-2 rounded-card border border-border p-4'
            >
              <p className='font-medium'>{app.name}</p>
              <p>{app.purpose}</p>
              <p className='text-sm text-muted-foreground'>
                {app.status} · {app.reviewStatus}
              </p>
              <p className='break-all text-sm'>App ID: {app._id}</p>
              <ul className='text-sm'>
                {app.redirectUris.map(uri => (
                  <li className='break-all' key={uri}>
                    {uri}
                  </li>
                ))}
              </ul>
              {app.status === 'testing' &&
              app.reviewStatus === 'not-requested' ? (
                <Button
                  variant='outline'
                  disabled={pending}
                  onClick={async () => {
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
                  }}
                >
                  Request wider access for {app.name}
                </Button>
              ) : null}
            </div>
          ))
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
              One exact URI per line. Wildcards are not allowed.
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
            Register app
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
