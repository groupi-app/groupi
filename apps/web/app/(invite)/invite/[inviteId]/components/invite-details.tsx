import { getCachedInviteData } from '@groupi/services/server';
import { Icons } from '@/components/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AcceptInviteForm } from './invite-accept';

export async function InviteDetails({ inviteId }: { inviteId: string }) {
  const [error, inviteData] = await getCachedInviteData(inviteId);

  if (error) {
    let errorMessage = 'An error occurred';
    switch (error._tag) {
      case 'NotFoundError':
        errorMessage = 'Invite not found';
        break;
      case 'ValidationError':
        errorMessage = 'Invalid or expired invite';
        break;
      case 'DatabaseError':
      case 'ConnectionError':
        errorMessage = 'Failed to load invite';
        break;
    }

    return (
      <div className='flex justify-center items-center h-screen'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-red-600'>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{errorMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='flex justify-center items-center h-screen'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardDescription>You have been invited to</CardDescription>
          <CardTitle>{inviteData.event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            {inviteData.event.description ?? ''}
          </p>
          <div className='flex flex-col gap-2 my-4'>
            {inviteData.event.location && (
              <div className='flex items-center gap-1 '>
                <Icons.location className='size-6 text-primary' />
                <span data-test='event-location'>
                  {inviteData.event.location}
                </span>
              </div>
            )}
            <div className='flex items-center gap-1 '>
              <Icons.date className='size-6 text-primary' />
              {inviteData.event.chosenDateTime ? (
                <span data-test='event-datetime'>
                  {new Date(inviteData.event.chosenDateTime).toLocaleString(
                    [],
                    {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    }
                  )}
                </span>
              ) : (
                'TBD'
              )}
            </div>
            <div className='flex items-center gap-1 '>
              <Icons.people className='size-6 text-primary' />
              <span>{inviteData.event.memberCount}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className='flex justify-end w-full'>
            <AcceptInviteForm
              inviteId={inviteId}
              eventId={inviteData.event.id}
            />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
