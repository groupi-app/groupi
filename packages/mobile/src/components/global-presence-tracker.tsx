import { useAppPresence } from '@/hooks/use-presence';
import { useGlobalUser } from '@/context/global-user-context';

/**
 * Invisible component that tracks app-level presence.
 * Must be rendered inside ConvexClientProvider and GlobalUserProvider.
 */
export function GlobalPresenceTracker() {
  const { isAuthenticated } = useGlobalUser();

  if (isAuthenticated) {
    return <PresenceHeartbeat />;
  }

  return null;
}

function PresenceHeartbeat() {
  useAppPresence();
  return null;
}
