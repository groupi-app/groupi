'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/error-display';
import { parseError } from '@/lib/error-utils';

export default function GlobalError({
  error,
  reset,
}: {
  error?: Error & { message?: string };
  reset?: () => void;
}) {
  useEffect(() => {
    // Log error details for debugging (not shown to user)
    if (error) {
      console.error('GlobalError caught:', error);
    }
  }, [error]);

  // Parse error to get user-friendly message
  const parsedError = error
    ? parseError(error, 'general')
    : { type: 'generic' as const, title: 'Something Went Wrong', message: 'An unexpected error occurred.' };

  return (
    <div className='container pt-6 pb-24'>
      <ErrorDisplay
        type={parsedError.type}
        title={parsedError.title}
        message={parsedError.message}
        showBackButton={true}
        showHomeButton={true}
        showRetryButton={!!reset && parsedError.type === 'generic'}
        onRetry={reset}
      />
    </div>
  );
}
