import { getSession } from '@groupi/services';
import { cacheLife } from 'next/cache';
import { MainNavDynamic } from './main-nav-dynamic';
import { MainNavItem } from '@/types';

interface MainNavDynamicWrapperProps {
  items?: MainNavItem[];
}

/**
 * Server component wrapper that fetches session and passes it to MainNavDynamic
 * Uses 'use cache: private' + cacheLife to enable headers() and prevent prerendering
 * Wrapped in Suspense boundary in layout.tsx
 */
export async function MainNavDynamicWrapper({
  items,
}: MainNavDynamicWrapperProps) {
  'use cache: private';
  cacheLife({ stale: 60 }); // 1 minute cache for nav session

  const [error, sessionData] = await getSession();
  const session = error ? null : sessionData;

  return <MainNavDynamic items={items} session={session} />;
}
