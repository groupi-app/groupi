'use client';
import { HostedBrand } from './hosted-brand';
import { useState } from 'react';
import Link from 'next/link';
import { useAction, useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { DiscordIdentityCards } from '@/features/discord';
import { ContextHelp } from '@/components/molecules/context-help';
import { ArrowRight, Clock3, CircleAlert, ExternalLink } from 'lucide-react';

function isUnavailableRequest(cause: unknown) {
  return (
    cause instanceof Error &&
    /\bConnection request unavailable or expired\./i.test(cause.message)
  );
}

function JourneyNotice({
  title,
  message,
  alert = false,
}: {
  title: string;
  message: string;
  alert?: boolean;
}) {
  const Icon = alert ? CircleAlert : Clock3;
  return (
    <section className='space-y-4 rounded-card border border-border bg-card p-5 sm:p-8'>
      <div className='flex items-center gap-3'>
        <Icon
          className='size-5 shrink-0 text-muted-foreground'
          aria-hidden='true'
        />
        <h1 className='font-heading text-2xl font-bold tracking-tight'>
          {title}
        </h1>
      </div>
      <p
        role={alert ? 'alert' : 'status'}
        className='text-sm leading-relaxed text-muted-foreground'
      >
        {message}
      </p>
    </section>
  );
}

export function DiscordConnect({ state }: { state: string }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const journey = useQuery(
    api.groupDiscord.delegated.inspect,
    isAuthenticated ? { state } : 'skip'
  );
  const connect = useAction(api.groupDiscord.connect.connectHosted);
  const finish = useMutation(api.groupDiscord.delegated.finish);
  const [unavailableState, setUnavailableState] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const callback = `/oauth/discord?state=${encodeURIComponent(state)}`;
  if (isLoading)
    return (
      <JourneyNotice
        title='Connect Discord'
        message='Checking your Groupi account…'
      />
    );
  if (!isAuthenticated)
    return (
      <section className='space-y-6 rounded-card border border-border bg-card p-5 sm:p-8'>
        <HostedBrand interactionId={state} compact />
        <h1 className='font-heading text-2xl font-bold tracking-tight'>
          Sign in to connect Discord
        </h1>
        <Button asChild>
          <Link href={`/sign-in?redirect=${encodeURIComponent(callback)}`}>
            Sign in
          </Link>
        </Button>
      </section>
    );
  // Successful consumption invalidates the live query before navigation completes.
  if (redirecting)
    return (
      <JourneyNotice
        title='Returning to application'
        message='Returning to your application…'
      />
    );
  if (unavailableState !== state && journey === undefined)
    return (
      <JourneyNotice
        title='Connect Discord'
        message='Loading Discord connection…'
      />
    );
  if (!journey || unavailableState === state)
    return (
      <JourneyNotice
        title='Connection unavailable'
        alert
        message='This connection request is unavailable or expired. Return to your application to start again.'
      />
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
      if (isUnavailableRequest(cause)) {
        setUnavailableState(state);
        return;
      }
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
      if (isUnavailableRequest(cause)) {
        setUnavailableState(state);
        setBusy(false);
        return;
      }
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not return to application.'
      );
      setBusy(false);
    }
  }
  const connected = status?.status === 'connected';
  const AccessIcon = status?.status === 'blocked' ? CircleAlert : Clock3;
  const accessLabels = {
    not_connected: 'Not connected',
    pending: 'Connection pending',
    screening: 'Membership screening',
    connected: 'Connected',
    blocked: 'Access needs attention',
  };
  const accessLabel = status
    ? (accessLabels[status.status] ?? 'Access status unavailable')
    : 'Access status unavailable';
  return (
    <section
      className='space-y-6 rounded-card border border-border bg-card p-5 sm:p-8'
      aria-label='Connect Discord'
    >
      <HostedBrand interactionId={state} compact />
      <div className='flex items-start justify-between gap-3'>
        <div className='space-y-2'>
          <h1 className='font-heading text-2xl font-bold tracking-tight sm:text-3xl'>
            Connect Discord
          </h1>
          <p className='text-sm leading-relaxed text-muted-foreground'>
            {connected
              ? 'Open the server or return to your application.'
              : 'Confirm your account to connect to this Group’s server.'}
          </p>
        </div>
        <ContextHelp label='About connecting Discord'>
          <div className='space-y-3'>
            <p>
              The application receives your access status, never your Discord
              credentials. Your Groupi account controls consent.
            </p>
            <p>
              Linking alone does not enroll you. Existing server members enroll
              in place.
            </p>
            <p>
              {status?.mode === 'membership'
                ? 'Discord staff must remove Discord bans before you can connect again.'
                : 'Other Discord roles and channel permissions may preserve independent access.'}
            </p>
            {status?.externalException && (
              <p>
                Externally managed access: {status.externalException}. Discord
                staff manage this account’s access.
              </p>
            )}
          </div>
        </ContextHelp>
      </div>
      {!status && (
        <p
          role='status'
          className='text-sm leading-relaxed text-muted-foreground'
        >
          Current Group membership is required to connect Discord. Return to
          your application to review your membership.
        </p>
      )}
      {status && (
        <>
          <DiscordIdentityCards
            guildName={status.guildName}
            guildIconUrl={status.guildIconUrl}
            linked={status.linked}
            linkedDiscordUserId={status.linkedDiscordUserId}
          />
          {!connected && (
            <div className='flex items-center gap-3'>
              <AccessIcon
                className='size-4 shrink-0 text-muted-foreground'
                aria-hidden='true'
              />
              <p role='status' className='text-sm font-medium'>
                {accessLabel}
              </p>
            </div>
          )}
          {!connected && (
            <p className='text-sm leading-relaxed'>
              {status.mode === 'membership'
                ? 'Connect lets Groupi join this server and manage your membership. Ending Group access can remove you; a Group ban or coordinated exclusion can ban you.'
                : 'Connect lets Groupi join this server and manage your Group role. Ending Group access removes that role; you stay in the server.'}
            </p>
          )}
          {!status.eligible && (
            <p className='text-sm'>
              Complete required Group onboarding before connecting.
            </p>
          )}
          {status.status === 'screening' && (
            <p className='text-sm leading-relaxed'>
              Complete membership screening in Discord, then confirm again to
              check access.
            </p>
          )}
          {status.status === 'blocked' && !status.error && (
            <p className='text-sm'>
              Contact a Group manager or Discord staff to review your access.
            </p>
          )}
          {status.error && (
            <p role='alert' className='text-sm text-destructive'>
              {status.error}
            </p>
          )}
          {status.cleanupPending && (
            <p className='text-sm'>
              Previous Discord access cleanup is pending. Wait before connecting
              again.
            </p>
          )}
          {status.externalException && (
            <p className='text-sm text-muted-foreground'>
              {status.externalException.toLowerCase().includes('owner')
                ? 'Server owner access is managed in Discord.'
                : 'This account’s access is managed in Discord.'}
            </p>
          )}
          <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
            {!connected && (
              <Button
                className='h-auto min-h-10 whitespace-normal py-3 text-center'
                disabled={busy || !status.eligible || status.cleanupPending}
                onClick={() => void confirm()}
              >
                {busy ? 'Please wait…' : 'Confirm identity and Connect Discord'}
              </Button>
            )}
            {(connected || status.status === 'screening') && (
              <Button asChild variant='outline'>
                <a
                  href={status.openUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Open Discord
                  <ExternalLink data-icon='inline-end' aria-hidden='true' />
                </a>
              </Button>
            )}
          </div>
        </>
      )}
      {message && (
        <p role='status' className='text-sm'>
          {message}
        </p>
      )}
      {error && (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      )}
      <div className='border-t border-border pt-5'>
        <Button
          className='w-full sm:w-auto'
          disabled={busy}
          variant='outline'
          onClick={() => void returnToApp()}
        >
          Return to application
          <ArrowRight data-icon='inline-end' aria-hidden='true' />
        </Button>
      </div>
    </section>
  );
}
