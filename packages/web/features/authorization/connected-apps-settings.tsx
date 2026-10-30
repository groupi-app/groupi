'use client';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  createConnectedAppHooks,
  authorizationActionLabel,
} from '@groupi/shared/hooks';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
const { useConnectedApps, useDisconnectApp } = createConnectedAppHooks(api);

export function ConnectedAppsSettings() {
  const connections = useConnectedApps();
  const events = useQuery(api.authorization.queries.eligibleEvents, {});
  const disconnect = useDisconnectApp();
  const [selected, setSelected] = useState<Id<'authorizationGrants'> | null>(
    null
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Connected apps</CardTitle>
          <CardDescription>
            Review and disconnect apps that have delegated access to this
            account.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {notice ? (
            <p role='status' className='text-success'>
              {notice}
            </p>
          ) : null}
          {connections === undefined ? (
            <p role='status'>Loading connected apps…</p>
          ) : connections.length === 0 ? (
            <p className='text-muted-foreground'>No connected apps.</p>
          ) : (
            connections.map(connection => (
              <div
                key={connection.grantId}
                className='space-y-2 rounded-card border border-border p-4'
              >
                <p className='font-medium'>{connection.appName}</p>
                <ul className='text-sm'>
                  {connection.actions.map(action => (
                    <li key={action}>{authorizationActionLabel(action)}</li>
                  ))}
                </ul>
                <p className='text-sm'>
                  {connection.selector.kind === 'all-current-and-future'
                    ? 'All current and future events within your authority'
                    : connection.selector.kind === 'selected-group'
                      ? `Selected Group (${connection.selector.groupId}) — own context only`
                      : connection.selector.eventIds
                          .map(
                            id =>
                              events?.find(event => event._id === id)?.title ??
                              `Unavailable event (${id})`
                          )
                          .join(', ')}
                </p>
                <p className='text-sm text-muted-foreground'>
                  {connection.background
                    ? 'Background access enabled'
                    : 'No background access'}{' '}
                  · {connection.status}
                </p>
                {connection.expiresAt ? (
                  <p className='text-sm'>
                    Expires {new Date(connection.expiresAt).toLocaleString()}
                  </p>
                ) : null}
                <Button
                  variant='outline'
                  aria-label={`Disconnect ${connection.appName}`}
                  onClick={() => {
                    setSelected(connection.grantId);
                    setError(null);
                  }}
                >
                  Disconnect
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Dialog
        open={selected !== null}
        onOpenChange={open => {
          if (!open && !pending) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect this app?</DialogTitle>
            <DialogDescription>
              New requests will be denied after disconnect completes. Previously
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
              onClick={() => setSelected(null)}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              isLoading={pending}
              onClick={async () => {
                if (!selected) return;
                setPending(true);
                setError(null);
                try {
                  await disconnect({ grantId: selected });
                  setSelected(null);
                  setNotice('App disconnected. New requests will be denied.');
                } catch (cause) {
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : 'Could not disconnect app'
                  );
                } finally {
                  setPending(false);
                }
              }}
            >
              Confirm disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
