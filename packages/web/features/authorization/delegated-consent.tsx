'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { authorizationActionLabel } from '@groupi/shared/hooks';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

export function DelegatedConsent({ interactionId }: { interactionId: string }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const request = useQuery(
    api.delegatedApps.queries.getConsentRequest,
    isAuthenticated && interactionId ? { interactionId } : 'skip'
  );
  const approve = useMutation(api.delegatedApps.mutations.approveConsent);
  const deny = useMutation(api.delegatedApps.mutations.denyConsent);
  const [actions, setActions] = useState<
    NonNullable<typeof request>['requestedActions']
  >([]);
  const [eventIds, setEventIds] = useState<Id<'events'>[]>([]);
  const [allEvents, setAllEvents] = useState(false);
  const [background, setBackground] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function decide(allow: boolean) {
    if (!request) return;
    setPending(true);
    setError(null);
    try {
      const result = allow
        ? await approve({
            interactionId,
            actions,
            selector: allEvents
              ? { kind: 'all-current-and-future' }
              : { kind: 'selected', eventIds },
            background,
          })
        : await deny({ interactionId });
      const destination = new URL(result.resumeUrl);
      if (destination.origin !== new URL(request.instance).origin)
        throw new Error(
          'The sign-in continuation does not match this instance.'
        );
      window.location.assign(destination.href);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not complete consent'
      );
      setPending(false);
    }
  }
  if (isLoading) return <p role='status'>Checking account…</p>;
  if (!isAuthenticated)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in to review access</CardTitle>
          <CardDescription>
            Choose your Groupi account before connecting an app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link
              href={`/sign-in?redirect=${encodeURIComponent(`/oauth/consent?interactionId=${encodeURIComponent(interactionId)}`)}`}
            >
              Sign in
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  if (!interactionId || request === null)
    return (
      <p role='alert'>
        This connection request is unavailable or expired. Return to the app to
        start again.
      </p>
    );
  if (request === undefined)
    return <p role='status'>Loading connection request…</p>;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect {request.appName}</CardTitle>
        <CardDescription>{request.purpose}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-5'>
        <dl className='space-y-2'>
          <div>
            <dt className='text-sm text-muted-foreground'>Groupi instance</dt>
            <dd className='break-all'>{request.instance}</dd>
          </div>
          <div>
            <dt className='text-sm text-muted-foreground'>Your account</dt>
            <dd>{request.account.displayName}</dd>
          </div>
        </dl>
        <p className='text-sm text-muted-foreground'>
          This app receives an opaque identifier for this account on this
          instance. Your display name and email are shared only if you
          explicitly allow those actions.
        </p>
        <fieldset className='space-y-2' disabled={pending}>
          <legend className='font-medium'>Requested actions</legend>
          {request.requestedActions.map(action => (
            <label key={action} className='flex items-center gap-2'>
              <Checkbox
                checked={actions.includes(action)}
                onCheckedChange={checked =>
                  setActions(current =>
                    checked
                      ? [...current, action]
                      : current.filter(value => value !== action)
                  )
                }
              />
              {authorizationActionLabel(action)}
            </label>
          ))}
        </fieldset>
        <fieldset className='space-y-2' disabled={pending}>
          <legend className='font-medium'>Event access</legend>
          <label className='flex items-start gap-2'>
            <Checkbox
              checked={allEvents}
              onCheckedChange={checked => setAllEvents(checked === true)}
            />
            All current and future events within my current authority
          </label>
          {allEvents ? (
            <p className='text-sm text-text-warning'>
              Includes events you join in the future. Access still follows your
              current event authority.
            </p>
          ) : (
            request.events.map(event => (
              <label key={event._id} className='flex items-center gap-2'>
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
          )}
        </fieldset>
        {request.requestedScopes.includes('offline_access') ? (
          <div className='space-y-2'>
            <label className='flex items-start gap-2'>
              <Checkbox
                checked={background}
                disabled={pending}
                onCheckedChange={checked => setBackground(checked === true)}
              />
              Allow background access
            </label>
            <p className='text-sm text-muted-foreground'>
              Lets the app renew access while you are away, for at most 30 days
              and 7 days of inactivity. You can disconnect it in Connected apps.
            </p>
          </div>
        ) : null}
        {error ? (
          <p role='alert' className='text-error'>
            {error}
          </p>
        ) : null}
        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            disabled={pending}
            onClick={() => void decide(false)}
          >
            Deny
          </Button>
          <Button
            isLoading={pending}
            disabled={
              request.expiresAt <= Date.now() ||
              (actions.some(action => !action.startsWith('identity.')) &&
                !allEvents &&
                !eventIds.length)
            }
            onClick={() => void decide(true)}
          >
            Allow access
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
