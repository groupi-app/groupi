'use client';

import { type ReactNode } from 'react';
import { AuthenticatedLayout } from '@/components/auth/AuthenticatedLayout';

export default function AddonBuilderLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
