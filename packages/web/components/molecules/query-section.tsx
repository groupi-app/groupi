'use client';

import { useState, type ReactNode } from 'react';
import { QueryErrorBoundary } from '@/components/error-boundary';
import { Button } from '@/components/ui/button';

/** A query may fail without unmounting the draft that owns this section. */
export function QuerySection({
  children,
  message,
}: {
  children: ReactNode;
  message: string;
}) {
  const [attempt, setAttempt] = useState(0);
  return (
    <QueryErrorBoundary
      key={attempt}
      fallback={() => (
        <div className='space-y-3 rounded-card border border-border-error bg-bg-error-subtle p-4'>
          <p role='alert' className='text-error'>
            {message}
          </p>
          <Button variant='outline' onClick={() => setAttempt(attempt + 1)}>
            Try again
          </Button>
        </div>
      )}
    >
      {children}
    </QueryErrorBoundary>
  );
}
