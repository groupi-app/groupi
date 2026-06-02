'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PWARegistration } from '@/components/pwa-registration';
import { Toaster } from '@/components/ui/sonner';
import { TailwindIndicator } from '@/components/tailwind-indicator';

const Analytics = dynamic(
  () => import('@/components/analytics').then(m => ({ default: m.Analytics })),
  { ssr: false }
);

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
