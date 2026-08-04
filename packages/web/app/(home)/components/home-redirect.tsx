'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalUser } from '@/context/global-user-context';

export function HomeRedirect() {
  const router = useRouter();
  const { isAuthenticated, isLoading, needsOnboarding } = useGlobalUser();

  useEffect(() => {
    if (!isLoading && isAuthenticated && needsOnboarding === false) {
      router.replace('/events');
    }
  }, [isLoading, isAuthenticated, needsOnboarding, router]);

  return null;
}
