'use client';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function HostedBrand({ interactionId }: { interactionId: string }) {
  const context = useQuery(api.delegatedApps.hosted.getAppearance, {
    interactionId,
  });
  if (context === undefined)
    return <p role='status'>Checking sign-in request…</p>;
  if (!context)
    return (
      <p role='alert'>
        This sign-in request is unavailable or expired. Return to the app to
        start again.
      </p>
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
    if (url.origin !== origin || url.pathname !== '/oauth/consent') return null;
    const ids = url.searchParams.getAll('interactionId');
    return ids.length === 1 && ids[0] ? ids[0] : null;
  } catch {
    return null;
  }
}
