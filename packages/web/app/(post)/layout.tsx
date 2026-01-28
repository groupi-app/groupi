'use client';

import { AuthenticatedLayout } from '@/components/auth/AuthenticatedLayout';
import { PendingAttachmentsProvider } from '@/contexts/pending-attachments-context';
import { ReactNode } from 'react';

/**
 * Layout for Post route group.
 * Requires authentication - redirects to sign-in if not authenticated.
 *
 * Each sub-page handles its own specific skeleton via loading.tsx or Suspense.
 */
export default function PostLayout({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedLayout>
      <PendingAttachmentsProvider>{children}</PendingAttachmentsProvider>
    </AuthenticatedLayout>
  );
}
