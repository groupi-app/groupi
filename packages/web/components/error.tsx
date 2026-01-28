'use client';

import { ErrorDisplay, ErrorType } from './error-display';

interface ErrorPageProps {
  message?: string;
  type?: ErrorType;
  title?: string;
}

/**
 * Legacy error page component - wraps the new ErrorDisplay.
 * Use ErrorDisplay directly for more control.
 */
export default function ErrorPage({
  message,
  type = 'generic',
  title,
}: ErrorPageProps) {
  return (
    <div className='container'>
      <ErrorDisplay type={type} title={title} message={message} />
    </div>
  );
}
