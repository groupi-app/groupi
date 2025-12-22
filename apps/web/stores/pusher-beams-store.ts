'use client';

import { usePusherBeams as usePusherBeamsInternal } from '@/lib/pusher-notifications';
import type {
  PusherBeamsState,
  PusherBeamsActions,
} from '@/lib/pusher-notifications';

// This store wraps the existing hook for backward compatibility
// The actual state is still managed by the hook in lib/pusher-notifications.ts
export function usePusherBeams(): PusherBeamsState & PusherBeamsActions {
  return usePusherBeamsInternal();
}
