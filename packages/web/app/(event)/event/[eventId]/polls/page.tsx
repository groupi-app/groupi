'use client';
import { EventCollectionFeatures } from '@/features/addons/runtime';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupPolls } from '@/components/organisms/group-polls';
export default function Page() {
  const { eventId } = useParams<{ eventId: string; toolId: string }>();
  return (
    <>
      <GroupPolls groupId={eventId as Id<'events'>} />
      <div className='px-6 pb-6'>
        <EventCollectionFeatures
          eventId={eventId as Id<'events'>}
          collection='polls'
        />
      </div>
    </>
  );
}
