'use client';

import PusherClient from 'pusher-js';

/**
 * Pusher Channels client instance.
 *
 * Simple singleton pattern - the client is created once and reused.
 * The 'use client' directive ensures this only runs in the browser.
 */
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
  }
);
