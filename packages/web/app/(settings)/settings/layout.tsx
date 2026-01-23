'use client';

import { AuthenticatedLayout } from '@/components/auth/AuthenticatedLayout';
import { SettingsNav } from './components/settings-nav';
import { ReactNode } from 'react';

/**
 * Layout for Settings route group.
 * Requires authentication - redirects to sign-in if not authenticated.
 *
 * Each settings page handles its own specific skeleton via Suspense.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedLayout>
      <div className='container min-h-screen relative md:grid md:grid-cols-[175px_1fr]'>
        <SettingsNav />
        {children}
      </div>
    </AuthenticatedLayout>
  );
}
