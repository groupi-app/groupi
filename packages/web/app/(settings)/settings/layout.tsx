'use client';

import { AuthenticatedLayout } from '@/components/auth/AuthenticatedLayout';
import { SettingsNav } from './components/settings-nav';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Layout for Settings route group.
 * Requires authentication - redirects to sign-in if not authenticated.
 *
 * On mobile at /settings root, the nav is hidden since the page shows category selection.
 * Each settings page handles its own specific skeleton via Suspense.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isRootSettingsPage = pathname === '/settings';

  return (
    <AuthenticatedLayout>
      <div className='container min-h-screen relative md:grid md:grid-cols-[175px_1fr]'>
        {/* On mobile, hide nav on root page since page shows category selection */}
        {/* On desktop, always show nav */}
        <div className={isRootSettingsPage ? 'hidden md:block' : ''}>
          <SettingsNav />
        </div>
        {children}
      </div>
    </AuthenticatedLayout>
  );
}
