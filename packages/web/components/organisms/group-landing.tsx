'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/molecules/empty-state';
import { useConvexAuth } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useGroupLanding } from '@/hooks/convex/use-groups';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GroupApplications } from './group-applications';
import { GroupLandingInvitation } from './group-landing-invitation';
import { Button } from '@/components/ui/button';

export function GroupLanding({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroupLanding(groupId);
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (group === undefined)
    return (
      <div
        role='status'
        className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6'
      >
        <span className='sr-only'>Loading Group…</span>
        <Skeleton className='h-28 w-full rounded-card' />
        <Skeleton className='h-48 w-full rounded-card' />
      </div>
    );
  if (group === null)
    return (
      <div role='alert' className='mx-auto max-w-xl px-4 py-8'>
        <EmptyState message='This Group is unavailable.' />
      </div>
    );
  const returnPath = `/g/${group.groupId}`;
  return (
    <main className='mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-8 sm:px-6'>
      <p className='text-sm text-muted-foreground'>Unlisted Group</p>
      <Avatar className='size-20'>
        <AvatarImage src={group.image ?? undefined} alt='' />
        <AvatarFallback>{group.name.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <h1 className='font-heading break-words text-3xl font-bold'>
        {group.name}
      </h1>
      {group.description && (
        <p className='whitespace-pre-wrap break-words text-muted-foreground'>
          {group.description}
        </p>
      )}
      {!isLoading &&
        (isAuthenticated ? (
          <>
            <GroupLandingInvitation groupId={group.groupId} />
            <GroupApplications groupId={group.groupId} />
          </>
        ) : (
          <Button asChild>
            <Link href={`/sign-in?redirect=${encodeURIComponent(returnPath)}`}>
              Sign in or sign up
            </Link>
          </Button>
        ))}
    </main>
  );
}
