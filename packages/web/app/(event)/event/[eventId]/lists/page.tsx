'use client';
import { EventCollectionFeatures } from '@/features/addons/runtime';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupLists } from '@/components/organisms/group-lists';
export default function Page() {
  const { eventId } = useParams<{ eventId: string; toolId: string }>();
  return (
    <>
      <GroupLists groupId={eventId as Id<'events'>} />
      <div className='px-6 pb-6'>
        <EventCollectionFeatures
          eventId={eventId as Id<'events'>}
          collection='lists'
        />
      </div>
    </>
  );
}
