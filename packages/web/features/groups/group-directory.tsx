'use client';
import { useConvexAuth } from 'convex/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GroupsPanel } from '@/components/organisms/groups-panel';

export function GroupDirectory() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  if (isLoading) return <p role='status'>Loading Groups…</p>;
  if (!isAuthenticated)
    return (
      <main className='mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8'>
        <h1 className='font-heading text-3xl font-bold tracking-tight'>
          Your Groups
        </h1>
        <Button asChild>
          <Link href='/sign-in?redirect=%2Fgroups'>
            Sign in or sign up to view Groups
          </Link>
        </Button>
      </main>
    );
  return (
    <main className='mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8'>
      <GroupsPanel
        headingLevel={1}
        onOpenGroup={groupId => router.push(`/groups/${groupId}`)}
      />
    </main>
  );
}
