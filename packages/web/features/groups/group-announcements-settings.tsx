'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';

/** Compatibility destination only. The Group feed owns authentication and content access. */
export function GroupAnnouncementsSettings({
  groupId,
}: {
  groupId: Id<'groups'>;
}) {
  const router = useRouter();
  const destination = `/groups/${groupId}`;
  useEffect(() => {
    router.replace(destination);
  }, [router, destination]);
  return (
    <p role='status' className='p-4 text-sm text-muted-foreground'>
      Opening Group…{' '}
      <Link className='text-primary underline' href={destination}>
        Open Group
      </Link>
    </p>
  );
}
