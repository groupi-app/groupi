'use client';

import { usePathname } from 'next/navigation';
import type { Role } from '@/convex/types';
import { canCreatePosts, type EventPermissions } from '@/lib/event-permissions';
import { NewContentMenu } from '@/features/content';

interface NewPostButtonProps {
  permissions?: EventPermissions;
  userRole?: Role;
}

/** Kept as a compatibility export for existing Event page consumers. */
export function NewPostButton({ permissions, userRole }: NewPostButtonProps) {
  const pathname = usePathname();
  if (!permissions || !userRole || !canCreatePosts(userRole, permissions))
    return null;
  return (
    <div className='fixed right-4 bottom-24 lg:right-24 xl:right-48 2xl:right-1/4 z-sticky'>
      <NewContentMenu
        basePath={pathname}
        context='event'
        allowed={{ post: true, form: true, list: true, poll: true }}
      />
    </div>
  );
}
