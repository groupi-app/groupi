'use client';
import { HostedBrand } from './hosted-brand';
import { useState } from 'react';
import Link from 'next/link';
import { useAction, useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export function DiscordConnect({ state }: { state: string }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const journey = useQuery(
    api.groupDiscord.delegated.inspect,
    isAuthenticated ? { state } : 'skip'
  );
  const connect = useAction(api.groupDiscord.connect.connectHosted);
  const finish = useMutation(api.groupDiscord.delegated.finish);
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const callback = `/oauth/discord?state=${encodeURIComponent(state)}`;
  if (isLoading) return <p role='status'>Checking your Groupi account…</p>;
  if (!isAuthenticated)
    return (
      <>
        <HostedBrand interactionId={state} />
        <h1>Sign in to connect Discord</h1>
        <Button asChild>
          <Link href={`/sign-in?redirect=${encodeURIComponent(callback)}`}>
            Sign in
          </Link>
        </Button>
      </>
    );
  // Successful consumption invalidates the live query before navigation completes.
  if (redirecting) return <p role='status'>Returning to your application…</p>;
  if (journey === undefined)
    return <p role='status'>Loading Discord connection…</p>;
  if (!journey)
    return (
      <p role='alert'>
        This connection request is unavailable or expired. Return to your
        application to start again.
      </p>
    );
  const status = journey.status;
  async function confirm() {
    setBusy(true);
    setError('');
    try {
      const result = await connect({ state, consent: true });
      if (result.requiresConsent) {
        const linked = await authClient.linkSocial({
          provider: 'discord',
          scopes: ['identify', 'guilds', 'guilds.join'],
          callbackURL: callback,
        });
        if (linked.error)
          throw new Error(
            linked.error.message || 'Discord authorization was not completed.'
          );
      } else
        setMessage(
          'Connection requested. Review your current access status before returning.'
        );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Discord connection failed.'
      );
    } finally {
      setBusy(false);
    }
  }
  async function returnToApp() {
    setBusy(true);
    setError('');
    // Keep the progress screen visible as the subscription sees consumed state.
    setRedirecting(true);
    try {
      const result = await finish({ state, consent: true });
      window.location.assign(result.returnUrl);
    } catch (cause) {
      setRedirecting(false);
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not return to application.'
      );
      setBusy(false);
    }
  }
  return (
    <section
      className='space-y-4 rounded-card border border-border p-4'
      aria-label='Connect Discord'
    >
      <HostedBrand interactionId={state} />
      <h1 className='text-xl font-semibold'>
        Connect Discord for {journey.appName}
      </h1>
      <p>
        Your Groupi account stays in control of Discord consent. This
        application receives your access status, never your Discord credentials.
      </p>
      {!status && (
        <p role='status'>
          Current Group membership is required to connect Discord. Return to
          your application to review your membership.
        </p>
      )}
      {status && (
        <>
          <h2>{status.guildName}</h2>
          <p>
            {status.linked
              ? `Confirm your linked Discord account ID: ${status.linkedDiscordUserId}.`
              : 'Link and confirm your Discord identity before connecting.'}
          </p>
          <p>
            {status.mode === 'membership'
              ? 'Connect allows Groupi to join you to this server and manage your server membership. Ending Group access can remove you; a Group ban or coordinated exclusion can ban you. Discord staff must remove Discord bans.'
              : 'Connect allows Groupi to join you to this server and manage its dedicated Group role. Ending Group access removes that role and leaves server membership. Other roles can preserve independent access.'}{' '}
            Existing members enroll in place. Linking alone does not enroll you.
          </p>
          <p role='status'>
            Discord access: {status.status}.{' '}
            {status.eligible
              ? ''
              : 'Complete required Group onboarding before connecting.'}
          </p>
          {status.error && <p role='alert'>{status.error}</p>}
          {status.cleanupPending && (
            <p>
              Previous Discord access cleanup is pending. Wait for cleanup
              before connecting again.
            </p>
          )}
          {status.externalException && (
            <p>Externally managed access: {status.externalException}</p>
          )}
          <Button
            disabled={busy || !status.eligible || status.cleanupPending}
            onClick={() => void confirm()}
          >
            {busy ? 'Please wait…' : 'Confirm identity and Connect Discord'}
          </Button>
          {(status.status === 'connected' || status.status === 'screening') && (
            <a
              className='text-primary underline'
              href={status.openUrl}
              target='_blank'
              rel='noopener noreferrer'
            >
              Open Discord
            </a>
          )}
        </>
      )}
      {message && <p role='status'>{message}</p>}
      {error && <p role='alert'>{error}</p>}
      <Button
        disabled={busy}
        variant='outline'
        onClick={() => void returnToApp()}
      >
        Return to application
      </Button>
    </section>
  );
}
