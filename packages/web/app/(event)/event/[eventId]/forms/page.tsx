'use client';
import { EventCollectionFeatures } from '@/features/addons/runtime';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupForms } from '@/components/organisms/group-forms';
export default function Page() {
  const { eventId } = useParams<{ eventId: string; toolId: string }>();
  return (
    <>
      <GroupForms groupId={eventId as Id<'events'>} />
      <div className='px-6 pb-6'>
        <EventCollectionFeatures
          eventId={eventId as Id<'events'>}
          collection='forms'
        />
      </div>
    </>
  );
}
