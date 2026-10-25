'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import type { Role } from '@/convex/types';
import { canCreatePosts, type EventPermissions } from '@/lib/event-permissions';

interface NewPostButtonProps {
  permissions?: EventPermissions;
  userRole?: Role;
}

export function NewPostButton({ permissions, userRole }: NewPostButtonProps) {
  const pathname = usePathname();

  if (!permissions || !userRole || !canCreatePosts(userRole, permissions)) {
    return null;
  }

  return (
    <div className='fixed right-4 bottom-24 lg:right-24 xl:right-48 2xl:right-1/4 z-sticky'>
      <Button asChild>
        <Link data-test='new-post-button' href={`${pathname}/new-post`}>
          <Icons.plus />
          <span>New Post</span>
        </Link>
      </Button>
    </div>
  );
}
