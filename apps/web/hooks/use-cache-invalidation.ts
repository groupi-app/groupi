'use client';

import { useRouter } from 'next/navigation';

export function useCacheInvalidation() {
  const router = useRouter();

  return async (tags: string[]) => {
    // Invalidate tags server-side
    await fetch('/api/cache/invalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    });

    // Refresh server components to re-fetch and re-cache
    router.refresh();
  };
}

