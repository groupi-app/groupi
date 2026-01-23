'use client';

import { AuthenticatedLayout } from '@/components/auth/AuthenticatedLayout';
import { ReactNode } from 'react';

/**
 * Layout for Create Event route.
 * Requires authentication - redirects to sign-in if not authenticated.
 * FormProvider is in CreateWizard component - state resets when navigating away.
 *
 * Each page handles its own specific skeleton via loading.tsx or Suspense.
 */
export default function CreateEventLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
