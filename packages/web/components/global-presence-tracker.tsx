'use client';

import { useCurrentUserProfile } from '@/hooks/convex/use-users';
import { useAppPresence } from '@/hooks/convex/use-presence';
import { Id } from '@/convex/_generated/dataModel';

/**
 * Global presence tracker component
 *
 * This component should be rendered at the app root level to track
 * user presence and update their lastSeen timestamp periodically.
 *
 * It runs silently in the background and doesn't render anything.
 */
export function GlobalPresenceTracker() {
  const profile = useCurrentUserProfile();
  const personId = profile?.person?.id as Id<'persons'> | undefined;

  // This hook handles:
  // 1. Sending heartbeats to the presence system
  // 2. Updating lastSeen timestamp every 5 minutes
  useAppPresence(personId);

  // This component doesn't render anything
  return null;
}
