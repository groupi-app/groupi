'use client';

import { AuthenticatedLayout } from '@/components/auth/AuthenticatedLayout';
import { ReactNode } from 'react';

/**
 * Layout for Event route group.
 * Requires authentication - redirects to sign-in if not authenticated.
 *
 * Each sub-page handles its own specific skeleton via loading.tsx or Suspense.
 */
export default function EventLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
