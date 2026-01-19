'use client';

import { useEffect } from 'react';
import { componentLogger } from '@/lib/logger';
import { ErrorDisplay } from '@/components/error-display';
import { parseError } from '@/lib/error-utils';

export default function EventError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error details for debugging (not shown to user)
    componentLogger.error('EventError', 'Error caught', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      name: error.name,
    });
  }, [error]);

  // Parse error to get user-friendly message
  const parsedError = parseError(error, 'event');

  return (
    <div className='container pt-6 pb-24'>
      <ErrorDisplay
        type={parsedError.type}
        title={parsedError.title}
        message={parsedError.message}
        showBackButton={true}
        showHomeButton={true}
        showRetryButton={parsedError.type === 'generic'}
        onRetry={reset}
      />
    </div>
  );
}
