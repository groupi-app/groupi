'use client';
import { HostedBrand } from './hosted-brand';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { FunctionReturnType } from 'convex/server';
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
  const account = useQuery(
    api.auth.queries.getCurrentUser,
    isAuthenticated ? {} : 'skip'
  );
  if (isLoading) return <p role='status'>Checking account…</p>;
  if (!isAuthenticated)
    return (
      <Card>
        <CardHeader>
          <HostedBrand interactionId={interactionId} />
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
  if (!interactionId || request === null || account === null)
    return (
      <p role='alert'>
        This connection request is unavailable or expired. Return to the app to
        start again.
      </p>
    );
  if (request === undefined || account === undefined)
    return <p role='status'>Loading connection request…</p>;
  const requestKey = JSON.stringify([
    interactionId,
    account._id,
    request.appId,
    request.selectedGroup?.id,
    request.expiresAt,
    [...request.requestedScopes].sort(),
    request.events.map(event => event._id).sort(),
  ]);
  return (
    <ConsentChoices
      key={requestKey}
      interactionId={interactionId}
      request={request}
    />
  );
}
function ConsentChoices({
  interactionId,
  request,
}: {
  interactionId: string;
  request: NonNullable<
    FunctionReturnType<typeof api.delegatedApps.queries.getConsentRequest>
  >;
}) {
  const approve = useMutation(api.delegatedApps.mutations.approveConsent);
  const deny = useMutation(api.delegatedApps.mutations.denyConsent);
  const actions = request.requestedActions;
  const [eventIds, setEventIds] = useState<Id<'events'>[]>([]);
  const [allEvents, setAllEvents] = useState(false);
  const [background, setBackground] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const remaining = request.expiresAt - Date.now();
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [request.expiresAt]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasEventActions = actions.some(
    action => !action.startsWith('identity.') && !action.startsWith('groups.')
  );
  async function decide(allow: boolean) {
    if (Date.now() >= request.expiresAt) {
      setNow(Date.now());
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = allow
        ? await approve({
            interactionId,
            actions,
            selector:
              request.selectedGroup &&
              actions.some(action => action.startsWith('groups.'))
                ? { kind: 'selected-group', groupId: request.selectedGroup.id }
                : !hasEventActions
                  ? { kind: 'selected', eventIds: [] }
                  : allEvents
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
  if (now >= request.expiresAt)
    return (
      <Card>
        <CardHeader>
          {request.appearance ? (
            <p
              className='text-xl font-heading'
              style={{ color: request.appearance.accent }}
            >
              {request.appearance.brandName}
            </p>
          ) : null}
          <p className='text-sm text-muted-foreground'>
            Sign-in provided by Groupi
          </p>
          <p className='text-sm text-muted-foreground'>
            Developer app: {request.appName}
          </p>
          <CardTitle>Connection request expired</CardTitle>
        </CardHeader>
        <CardContent>
          <p role='alert'>
            This connection request has expired. Return to the app and start
            sign-in again.
          </p>
        </CardContent>
      </Card>
    );
  return (
    <Card>
      <CardHeader>
        {request.appearance ? (
          <p
            className='text-xl font-heading'
            style={{ color: request.appearance.accent }}
          >
            {request.appearance.brandName}
          </p>
        ) : null}
        <p className='text-sm text-muted-foreground'>
          Sign-in provided by Groupi
        </p>
        <p className='text-sm text-muted-foreground'>
          Developer app: {request.appName}
        </p>
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
            {request.account.username ? (
              <dd>@{request.account.username}</dd>
            ) : null}
            {request.account.email ? <dd>{request.account.email}</dd> : null}
            <dd>
              <Link
                className='text-primary underline'
                href={`/sign-in?mode=add-account&redirect=${encodeURIComponent(`/oauth/consent?interactionId=${encodeURIComponent(interactionId)}`)}`}
              >
                Choose another account
              </Link>
            </dd>
          </div>
        </dl>
        {request.selectedGroup ? (
          <div className='space-y-2'>
            <p className='font-medium'>{request.selectedGroup.name}</p>
            <p className='text-sm text-muted-foreground'>
              Access is limited to your own community context in this Group. Its
              current and future Events shared with this Group are the boundary
              for future participation permissions; Event access and changes
              require separate supported consent and current eligibility. This
              approval grants no reviewer authority or unrelated Group or Event
              access.
            </p>
          </div>
        ) : null}
        <p className='text-sm text-muted-foreground'>
          This app receives an opaque identifier for this account on this
          instance. Your display name and email are shared only if you
          explicitly allow those actions.
        </p>
        <fieldset className='space-y-2' disabled={pending}>
          <legend className='font-medium'>Requested actions</legend>
          <p className='text-sm text-muted-foreground'>
            Allow access grants these requested actions. Choose Deny to cancel.
          </p>
          {request.requestedActions.map(action => (
            <label key={action} className='flex items-center gap-2'>
              <Checkbox checked disabled />
              {authorizationActionLabel(action)}
            </label>
          ))}
        </fieldset>
        {hasEventActions && !request.selectedGroup ? (
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
                Includes events you join in the future. Access still follows
                your current event authority.
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
        ) : null}
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
              request.expiresAt <= now ||
              (hasEventActions && !allEvents && !eventIds.length)
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
