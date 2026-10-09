'use client';
import type { ReactNode } from 'react';
import { useConvexAuth } from 'convex/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
export default function PollLayout({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const path = usePathname();
  if (isLoading) return <p role='status'>Loading…</p>;
  if (!isAuthenticated)
    return (
      <main className='p-6'>
        <Link
          className='text-primary underline'
          href={`/sign-in?redirect=${encodeURIComponent(path)}`}
        >
          Sign in or sign up to use Group polls
        </Link>
      </main>
    );
  return children;
}
