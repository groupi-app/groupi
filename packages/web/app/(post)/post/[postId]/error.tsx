'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/error-display';
import { parseError } from '@/lib/error-utils';

export default function PostError({
  error,
  reset,
}: {
  error: Error & { message?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error details for debugging (not shown to user)
    console.error('PostError caught:', error);
  }, [error]);

  // Parse error to get user-friendly message
  const parsedError = parseError(error, 'post');

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
