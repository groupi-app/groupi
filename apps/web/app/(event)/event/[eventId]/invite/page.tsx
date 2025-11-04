import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { InviteCardList } from '../components/invite-card-list';
import Link from 'next/link';

export default async function EventInvitePage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  return (
    <div className='container max-w-5xl py-4'>
      <Link href={`/event/${eventId}`}>
        <Button variant={'ghost'} className='flex items-center gap-1 pl-2'>
          <Icons.back />
          <span>Back to Event</span>
        </Button>
      </Link>
      <InviteCardList eventId={eventId} />
    </div>
  );
}
