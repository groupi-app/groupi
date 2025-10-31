'use client';

import PusherClient from 'pusher-js';

let pusherClientInstance: PusherClient | null = null;

/**
 * Get or create the singleton Pusher client instance.
 * 
 * This uses a simple lazy initialization pattern that's safe for Next.js 16:
 * - Only initializes when first accessed in the browser
 * - Uses process.env directly (NEXT_PUBLIC_ vars are inlined at build time)
 * - Returns the same instance on subsequent calls
 */
export function getPusherClient(): PusherClient {
  if (typeof window === 'undefined') {
    throw new Error('Pusher client can only be accessed on the client side');
  }

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

/**
 * Legacy export for backward compatibility.
 * This works because it's only ever accessed in client components after mount.
 */
export const pusherClient = new Proxy({} as PusherClient, {
  get(_target, prop) {
    const client = getPusherClient();
    const value = client[prop as keyof PusherClient];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
