'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { componentLogger } from '@/lib/logger';

export default function EventError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error details for debugging
    componentLogger.error(
      {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        name: error.name,
      },
      'EventError: Error caught'
    );
  }, [error]);

  return (
    <div className='container pt-6 pb-24'>
      <div className='text-center py-8'>
        <h1 className='text-2xl font-bold text-red-600'>
          Something went wrong
        </h1>
        <p className='mt-2 text-muted-foreground'>
          {error.message ||
            'An unexpected error occurred while loading the event'}
        </p>
        <div className='mt-4 flex gap-2 justify-center'>
          <Button onClick={reset} variant='outline'>
            Try Again
          </Button>
          <Button
            onClick={() => {
              router.back();
            }}
            variant='outline'
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
