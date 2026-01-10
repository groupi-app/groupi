'use client';

import { useEffect } from 'react';

/**
 * Client component that performs a hard redirect on mount.
 * Used to avoid Next.js Router hooks issues during soft navigation.
 */
export function ClientRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.href = url;
  }, [url]);

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <p className='text-muted-foreground'>Redirecting...</p>
    </div>
  );
}
