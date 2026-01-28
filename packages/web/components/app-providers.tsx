'use client';

import React from 'react';
import { PWARegistration } from '@/components/pwa-registration';
import { Analytics } from '@/components/analytics';
import { Toaster } from '@/components/ui/sonner';
import { TailwindIndicator } from '@/components/tailwind-indicator';

export function AppProviders() {
  return (
    <>
      <PWARegistration />
      <Analytics />
      <Toaster />
      <TailwindIndicator />
    </>
  );
}
