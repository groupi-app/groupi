import { AcceptInviteButton } from '@/components/invite-accept';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

import { redirect } from 'next/navigation';

import ErrorPage from '@/components/error';
import { Icons } from '@/components/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function Page(props: {
  params: Promise<{ inviteId: string }>;
}) {
  const params = await props.params;
  const { userId }: { userId: string | null } = await auth();

  if (!userId) {
    return <ErrorPage message={'User not found'} />;
  }

  const invite = await db.invite.findUnique({
    where: {
      id: params.inviteId,
    },
    include: {
      event: {
        include: {
          memberships: true,
        },
      },
    },
  });

  if (!invite) {
    return <ErrorPage message={'Invite not found'} />;
  }

  const currentMembership = invite.event.memberships.find(
    membership => membership.personId === userId
  );

  if (currentMembership) {
    redirect(`/event/${invite.event.id}`);
  }

  // check if invite has expired
  if (
    invite.expiresAt !== null &&
    new Date().getTime() > invite.expiresAt.getTime()
  ) {
    return <ErrorPage message={'Invite has expired'} />;
  }

  // check if invite is out of uses
  if (invite.usesRemaining !== null && invite.usesRemaining < 1) {
    return <ErrorPage message={'Invite has no uses remaining'} />;
  }

  return (
    <div className='flex justify-center items-center h-screen'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardDescription>You have been invited to</CardDescription>
          <CardTitle>{invite.event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            {invite.event.description ?? ''}
          </p>
          <div className='flex flex-col gap-2 my-4'>
            {invite.event.location && (
              <div className='flex items-center gap-1 '>
                <Icons.location className='size-6 text-primary' />
                <span data-test='event-location'>{invite.event.location}</span>
              </div>
            )}
            <div className='flex items-center gap-1 '>
              <Icons.date className='size-6 text-primary' />
              {invite.event.chosenDateTime ? (
                <span data-test='event-datetime'>
                  {invite.event.chosenDateTime.toLocaleString([], {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              ) : (
                'TBD'
              )}
            </div>
            <div className='flex items-center gap-1 '>
              <Icons.people className='size-6 text-primary' />
              <span>{invite.event.memberships.length}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className='flex justify-end w-full'>
            <AcceptInviteButton
              inviteId={params.inviteId}
              eventId={invite.event.id}
              personId={userId}
            />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
