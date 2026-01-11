'use client';

import PusherClient from 'pusher-js';

/**
 * Pusher Channels client instance.
 *
 * Lazily initialized singleton - the client is only created when first accessed.
 * This prevents connections from being established on module import.
 */
let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
      }
    );
  }
  return pusherClientInstance;
}

// For backward compatibility - but prefer getPusherClient() for lazy init
export const pusherClient = {
  get instance() {
    return getPusherClient();
  },
};
