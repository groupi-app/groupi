'use client';

import { type ReactNode } from 'react';
import { usePusherChannelsInit } from '@/stores/pusher-channels-store';

/**
 * Provider component that initializes Pusher channels
 * Filter/sort state is now managed by Zustand store (no provider needed)
 */
export function FilterSortProvider({ children }: { children: ReactNode }) {
  // Initialize Pusher channels connection listeners
  usePusherChannelsInit();

  return <>{children}</>;
}

// Re-export hook for backward compatibility
export { useFilterSortStore as useFilterSort } from '@/stores/filter-sort-store';
