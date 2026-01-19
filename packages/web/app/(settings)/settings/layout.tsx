'use client';

import { AuthenticatedLayout } from '@/components/auth/AuthenticatedLayout';
import { SettingsNav } from './components/settings-nav';
import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

/**
 * Layout for Settings route group.
 * Requires authentication - redirects to sign-in if not authenticated.
 *
 * Each settings page handles its own specific skeleton via Suspense.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedLayout
      skeleton={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <div className="container min-h-screen relative md:grid md:grid-cols-[175px_1fr]">
        <SettingsNav />
        {children}
      </div>
    </AuthenticatedLayout>
  );
}
