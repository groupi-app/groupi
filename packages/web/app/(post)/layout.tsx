'use client';

import { AuthenticatedLayout } from '@/components/auth/AuthenticatedLayout';
import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

/**
 * Layout for Post route group.
 * Requires authentication - redirects to sign-in if not authenticated.
 *
 * Each sub-page handles its own specific skeleton via loading.tsx or Suspense.
 */
export default function PostLayout({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedLayout
      skeleton={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      {children}
    </AuthenticatedLayout>
  );
}
