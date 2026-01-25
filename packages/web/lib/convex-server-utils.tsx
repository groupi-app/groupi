/**
 * Server-side Convex utilities for consistent error handling
 * Replaces the legacy ResultTuple pattern with proper error handling
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Server utilities use 'any' for flexible Convex query/error handling

import { preloadQuery } from 'convex/nextjs';
import { redirect } from 'next/navigation';

/**
 * Wrapper for preloadQuery with consistent error handling
 * Handles authentication and authorization errors consistently
 */
export async function safePreloadQuery<T>(
  query: any,
  args: any,
  options: {
    redirectOnAuth?: boolean;
    notFoundMessage?: string;
    unauthorizedMessage?: string;
  } = {}
): Promise<T> {
  try {
    return (await preloadQuery(query, args)) as T;
  } catch (error: any) {
    // Handle Convex errors consistently
    if (
      error.message?.includes('Authentication required') ||
      error.message?.includes('Unauthenticated')
    ) {
      if (options.redirectOnAuth !== false) {
        redirect('/sign-in');
      }
      throw new Error('Authentication required');
    }

    if (error.message?.includes('not found')) {
      throw new Error(options.notFoundMessage || 'Resource not found');
    }

    if (
      error.message?.includes('not a member') ||
      error.message?.includes('Unauthorized')
    ) {
      throw new Error(
        options.unauthorizedMessage ||
          'You are not authorized to access this resource'
      );
    }

    throw error;
  }
}

/**
 * Standard error component for server components
 */
export function ServerErrorComponent({
  error,
  fallback,
}: {
  error: any;
  fallback?: React.ReactNode;
}) {
  if (error.message?.includes('Authentication required')) {
    redirect('/sign-in');
  }

  if (error.message?.includes('not found')) {
    return <div className='text-center py-8'>Resource not found</div>;
  }

  if (error.message?.includes('not authorized')) {
    return (
      <div className='text-center py-8'>
        You are not authorized to access this resource
      </div>
    );
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  console.error('Server component error:', error);
  return <div className='text-center py-8'>An unexpected error occurred</div>;
}
