'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { LogoSticker } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';

export interface ParsedError {
  title: string;
  message: string;
  recoverable: boolean;
}

export interface ErrorPageTemplateProps {
  /**
   * The error that occurred
   */
  error: Error & { digest?: string };
  /**
   * Reset function to retry the failed operation
   */
  reset?: () => void;
  /**
   * Context for logging (e.g., 'event', 'post', 'global')
   */
  context?: string;
  /**
   * Whether to show the retry button
   * @default true
   */
  showRetry?: boolean;
  /**
   * Custom title (overrides parsed title)
   */
  title?: string;
  /**
   * Custom message (overrides parsed message)
   */
  message?: string;
  /**
   * Additional class names for the container
   */
  className?: string;
  /**
   * Custom icon to display
   */
  icon?: React.ReactNode;
}

/**
 * Parse an error into a user-friendly format
 */
export function parseError(error: Error, context?: string): ParsedError {
  const errorMessage = error.message || 'An unexpected error occurred';

  // Check for specific error types
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return {
      title: `${context ? `${context.charAt(0).toUpperCase() + context.slice(1)} ` : ''}Not Found`,
      message: `The ${context || 'resource'} you're looking for doesn't exist or has been removed.`,
      recoverable: false,
    };
  }

  if (
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication')
  ) {
    return {
      title: 'Access Denied',
      message: "You don't have permission to view this page.",
      recoverable: false,
    };
  }

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      title: 'Connection Error',
      message:
        'Unable to connect to the server. Please check your internet connection.',
      recoverable: true,
    };
  }

  return {
    title: 'Something went wrong',
    message: errorMessage,
    recoverable: true,
  };
}

export function ErrorPageTemplate({
  error,
  reset,
  context = 'page',
  showRetry = true,
  title,
  message,
  className,
  icon,
}: ErrorPageTemplateProps) {
  const logger = createLogger(`error-${context}`);

  useEffect(() => {
    logger.error(`Error in ${context}`, {
      error: error.message,
      digest: error.digest,
    });
  }, [error, context, logger]);

  const parsed = parseError(error, context);
  const displayTitle = title || parsed.title;
  const displayMessage = message || parsed.message;

  return (
    <div className={cn('container pt-6 pb-24', className)}>
      <div className='max-w-md mx-auto text-center py-12'>
        <div className='flex justify-center mb-6'>
          {icon ?? (
            <div className='bg-bg-error-subtle rounded-full p-6 border-[3px] border-white shadow-raised'>
              <LogoSticker color='error' size='lg' showArm={false} />
            </div>
          )}
        </div>
        <h1 className='text-2xl font-heading font-medium mb-2'>
          {displayTitle}
        </h1>
        <p className='text-muted-foreground mb-6'>{displayMessage}</p>
        {showRetry && reset && parsed.recoverable && (
          <Button onClick={reset} variant='outline'>
            <Icons.refresh className='h-4 w-4 mr-2' />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Factory function to create error page components with pre-configured settings.
 * Useful for creating error.tsx files with consistent configuration.
 *
 * Usage in error.tsx:
 * ```tsx
 * export default createErrorPage({ context: 'event' });
 * ```
 */
export function createErrorPage(
  config: Omit<ErrorPageTemplateProps, 'error' | 'reset'>
) {
  return function ErrorPage({
    error,
    reset,
  }: {
    error: Error & { digest?: string };
    reset: () => void;
  }) {
    return <ErrorPageTemplate error={error} reset={reset} {...config} />;
  };
}
