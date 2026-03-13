// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

// Disable Sentry in development to avoid 431 header size errors
const isDev = process.env.NODE_ENV === 'development';

Sentry.init({
  enabled: !isDev,
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Filter out benign errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    // ResponseAborted occurs when client disconnects before response completes (e.g., navigation)
    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'ResponseAborted'
    ) {
      return null;
    }
    return event;
  },
});
