'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useConvexAuth } from 'convex/react';
import {
  ArrowLeft,
  Users,
  UserPlus,
  ClipboardList,
  MessageCircle,
  Mail,
  Shield,
  Pencil,
} from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import { useGroup } from '@/hooks/convex/use-groups';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function GroupManagementLayout({
  children,
  editing = false,
}: {
  children: ReactNode;
  editing?: boolean;
}) {
  const { groupId } = useParams<{ groupId: string }>();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const pathname = usePathname();
  if (isLoading) return <p role='status'>Loading Group…</p>;
  if (!isAuthenticated)
    return (
      <main className='p-6'>
        <Button asChild>
          <Link href={`/sign-in?redirect=${encodeURIComponent(pathname)}`}>
            Sign in or sign up to open Group
          </Link>
        </Button>
      </main>
    );
  return (
    <AuthenticatedGroupManagementLayout
      groupId={groupId as Id<'groups'>}
      pathname={pathname}
      editing={editing}
    >
      {children}
    </AuthenticatedGroupManagementLayout>
  );
}
function AuthenticatedGroupManagementLayout({
  groupId,
  pathname,
  editing,
  children,
}: {
  groupId: Id<'groups'>;
  pathname: string;
  editing: boolean;
  children: ReactNode;
}) {
  const group = useGroup(groupId);
  if (group === undefined) return <p role='status'>Loading Group…</p>;
  if (
    !group ||
    !(editing
      ? group.canManageIdentity
      : group.canManageMembers ||
        group.canManageIdentity ||
        group.canManageInvitations)
  )
    return (
      <main className='mx-auto max-w-4xl space-y-4 p-6'>
        <h1 className='font-heading text-2xl font-bold'>
          Group settings unavailable
        </h1>
        <p className='text-muted-foreground'>
          You do not have permission to manage this Group.
        </p>
        <Button asChild variant='outline'>
          <Link href={`/groups/${groupId}`}>Return to Group</Link>
        </Button>
      </main>
    );
  const items = [
    {
      path: 'admissions',
      title: 'Admissions',
      icon: Users,
      show: group.canManageMembers || group.canManageRoles,
    },
    {
      path: 'invitations',
      title: 'Invitations',
      icon: UserPlus,
      show: group.canManageInvitations,
    },
    {
      path: 'questionnaire',
      title: 'Questionnaire',
      icon: ClipboardList,
      show: group.canManageMembers || group.canManageRoles,
    },
    {
      path: 'discord',
      title: 'Discord',
      icon: MessageCircle,
      show: group.canManageMembers,
    },
    {
      path: 'announcements',
      title: 'Announcements',
      icon: Mail,
      show: group.viewerRole !== 'MEMBER',
    },
    {
      path: 'ownership',
      title: 'Ownership & safety',
      icon: Shield,
      show: group.canManageMembers || group.canManageIdentity,
    },
  ];
  return (
    <main className='mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8'>
      <Button asChild variant='ghost'>
        <Link href={`/groups/${groupId}`}>
          <ArrowLeft data-icon='inline-start' />
          {group.name}
        </Link>
      </Button>
      <header className='space-y-1 border-b border-border pb-6'>
        <p className='text-sm text-muted-foreground'>{group.name}</p>
        <h1 className='font-heading text-3xl font-bold tracking-tight'>
          {editing ? 'Edit Group' : 'Group settings'}
        </h1>
      </header>
      <div
        className={cn(
          !editing && 'grid gap-8 md:grid-cols-[200px_minmax(0,1fr)]'
        )}
      >
        {!editing && (
          <nav
            aria-label='Group settings'
            className='flex flex-wrap gap-1 self-start md:flex-col'
          >
            {group.canManageIdentity && (
              <Link
                href={`/groups/${groupId}/edit`}
                className='flex items-center gap-2 rounded-input px-3 py-2 text-sm hover:bg-accent'
              >
                <Pencil className='size-4' aria-hidden='true' />
                Edit Group
              </Link>
            )}
            {items
              .filter(item => item.show)
              .map(item => (
                <Link
                  key={item.path}
                  href={`/groups/${groupId}/settings/${item.path}`}
                  aria-current={
                    pathname.endsWith('/' + item.path) ? 'page' : undefined
                  }
                  className={cn(
                    'flex items-center gap-2 rounded-input px-3 py-2 text-sm font-medium hover:bg-accent',
                    pathname.endsWith('/' + item.path) &&
                      'bg-accent text-accent-foreground'
                  )}
                >
                  <item.icon className='size-4' aria-hidden='true' />
                  {item.title}
                </Link>
              ))}
          </nav>
        )}
        <div className='min-w-0 space-y-6'>{children}</div>
      </div>
    </main>
  );
}
