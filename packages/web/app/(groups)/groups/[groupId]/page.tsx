'use client';

import { useParams } from 'next/navigation';
import { useConvexAuth } from 'convex/react';
import Link from 'next/link';
import { Id } from '@/convex/_generated/dataModel';
import { GroupDetail } from '@/components/organisms/group-detail';
import { Button } from '@/components/ui/button';

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (isLoading) return <p role='status'>Loading…</p>;
  if (!isAuthenticated)
    return (
      <main className='p-6'>
        <Button asChild>
          <Link
            href={`/sign-in?redirect=${encodeURIComponent(`/groups/${groupId}`)}`}
          >
            Sign in or sign up to open Group
          </Link>
        </Button>
      </main>
    );
  return <GroupDetail groupId={groupId as Id<'groups'>} />;
}
