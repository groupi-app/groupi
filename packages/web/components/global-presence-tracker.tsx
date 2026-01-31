'use client';

import { useGlobalUser } from '@/context/global-user-context';
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
  // Use global user context instead of direct query
  const { person } = useGlobalUser();
  const personId = person?._id as Id<'persons'> | undefined;

  // This hook handles:
  // 1. Sending heartbeats to the presence system
  // 2. Updating lastSeen timestamp every 5 minutes
  useAppPresence(personId);

  // This component doesn't render anything
  return null;
}
