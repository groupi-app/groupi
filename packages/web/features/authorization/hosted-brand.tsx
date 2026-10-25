'use client';
import { useEffect, useState } from 'react';
import { AppWindow } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function HostedBrand({
  interactionId,
  compact = false,
}: {
  interactionId: string;
  compact?: boolean;
}) {
  const context = useQuery(api.delegatedApps.hosted.getAppearance, {
    interactionId,
  });
  const expiresAt = context?.expiresAt;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (expiresAt === undefined) return;
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.max(0, expiresAt - Date.now())
    );
    return () => clearTimeout(timer);
  }, [expiresAt]);
  if (context === undefined)
    return <p role='status'>Checking sign-in request…</p>;
  if (!context || context.expiresAt <= now)
    return (
      <p role='alert'>
        This sign-in request is unavailable or expired. Return to the app to
        start again.
      </p>
    );
  if (compact)
    return (
      <header className='flex min-w-0 items-start gap-3 border-b border-border pb-5'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-input bg-muted text-muted-foreground'>
          <AppWindow className='size-5' aria-hidden='true' />
        </div>
        <div className='min-w-0 space-y-1'>
          <p
            className='break-words font-semibold leading-snug'
            style={{ color: context.appearance?.accent }}
          >
            {context.appearance?.brandName ?? context.appName}
          </p>
          <p className='text-xs text-muted-foreground'>
            Sign-in provided by {context.providerName}
          </p>
          {context.appearance?.brandName &&
            context.appearance.brandName !== context.appName && (
              <p className='break-words text-xs text-muted-foreground'>
                Developer app: {context.appName}
              </p>
            )}
        </div>
      </header>
    );
  return (
    <header className='space-y-1 text-center py-4'>
      <h1
        className='text-3xl font-bold font-heading'
        style={{ color: context.appearance?.accent }}
      >
        {context.appearance?.brandName ?? context.appName}
      </h1>
      <p className='text-sm text-muted-foreground'>
        Sign-in provided by {context.providerName}
      </p>
      <p className='text-sm text-muted-foreground'>
        Developer app: {context.appName}
      </p>
    </header>
  );
}

/** Recognize only the provider's local consent route, never arbitrary brand parameters. */
export function hostedInteractionId(destination: string): string | null {
  try {
    const origin = 'https://groupi.internal';
    const url = new URL(destination, origin);
    if (
      url.origin !== origin ||
      !['/oauth/consent', '/oauth/discord'].includes(url.pathname)
    )
      return null;
    const ids = url.searchParams.getAll(
      url.pathname === '/oauth/discord' ? 'state' : 'interactionId'
    );
    return ids.length === 1 && ids[0] ? ids[0] : null;
  } catch {
    return null;
  }
}
