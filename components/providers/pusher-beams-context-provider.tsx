'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import {
  PusherBeamsState,
  PusherBeamsActions,
  usePusherBeams as usePusherBeamsInternal,
} from '@/lib/pusher-notifications';

const PusherBeamsContext = createContext<
  (PusherBeamsState & PusherBeamsActions) | null
>(null);

export function PusherBeamsProvider({ children }: { children: ReactNode }) {
  const beamsState = usePusherBeamsInternal();

  return (
    <PusherBeamsContext.Provider value={beamsState}>
      {children}
    </PusherBeamsContext.Provider>
  );
}

export function usePusherBeams(): PusherBeamsState & PusherBeamsActions {
  const context = useContext(PusherBeamsContext);

  if (!context) {
    throw new Error('usePusherBeams must be used within a PusherBeamsProvider');
  }

  return context;
}
