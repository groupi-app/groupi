'use client';

import type { ReactNode } from 'react';
import { useGlobalUser } from '@/context/global-user-context';

export function AuthenticatedOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useGlobalUser();
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
