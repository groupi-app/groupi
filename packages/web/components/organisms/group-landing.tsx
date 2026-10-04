'use client';

import Link from 'next/link';
import { useConvexAuth } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useGroupLanding } from '@/hooks/convex/use-groups';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GroupLandingInvitation } from './group-landing-invitation';
import { Button } from '@/components/ui/button';

export function GroupLanding({ groupId }: { groupId: Id<'groups'> }) {
  const group = useGroupLanding(groupId);
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (group === undefined) return <p role='status'>Loading Group…</p>;
  if (group === null) return <p role='alert'>This Group is unavailable.</p>;
  const returnPath = `/g/${group.groupId}`;
  return (
    <main className='mx-auto max-w-xl p-6 space-y-6'>
      <p className='text-sm text-muted-foreground'>Unlisted Group</p>
      <Avatar className='size-20'>
        <AvatarImage src={group.image ?? undefined} alt='' />
        <AvatarFallback>{group.name.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <h1 className='text-3xl font-bold'>{group.name}</h1>
      {group.description && (
        <p className='whitespace-pre-wrap'>{group.description}</p>
      )}
      {!isLoading &&
        (isAuthenticated ? (
          <GroupLandingInvitation groupId={group.groupId} />
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
