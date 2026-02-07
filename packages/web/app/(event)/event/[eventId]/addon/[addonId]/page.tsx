'use client';

import { use } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useEventHeader, useAddonGating } from '@/hooks/convex';
import { useAddonConfig } from '@/hooks/convex/use-addons';
import { Id } from '@/convex/_generated/dataModel';
import { NewEventFormSkeleton } from '@/components/skeletons';
import { getAddonById } from '@/app/(newEvent)/create/components/addon-registry';

// Import addon modules so they self-register
import '@/app/(newEvent)/create/components/addons/reminder-addon';
import '@/app/(newEvent)/create/components/addons/questionnaire-addon';
import '@/app/(newEvent)/create/components/addons/bring-list-addon';

export default function AddonPage(props: {
  params: Promise<{ eventId: string; addonId: string }>;
}) {
  const { eventId, addonId } = use(props.params);
  const eventData = useEventHeader(eventId as Id<'events'>);
  const addonConfig = useAddonConfig(eventId as Id<'events'>, addonId);
  const { redirectTo } = useAddonGating(eventId as Id<'events'>);
  const definition = getAddonById(addonId);
  const isGated = redirectTo !== null;

  if (!eventData || addonConfig === undefined) {
    return (
      <div className='container max-w-4xl mt-10'>
        <NewEventFormSkeleton />
      </div>
    );
  }

  // Add-on not found in registry or doesn't have a page component
  if (!definition?.PageComponent) {
    return (
      <div className='container mx-auto py-8 text-center'>
        <div className='max-w-md mx-auto'>
          <h1 className='text-2xl font-bold mb-4'>Add-on Not Found</h1>
          <p className='text-muted-foreground mb-6'>
            This add-on does not have a dedicated page.
          </p>
          <Link href={`/event/${eventId}`}>
            <Button>Return to Event</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { event } = eventData;
  const config = addonConfig
    ? (addonConfig.config as Record<string, unknown>)
    : null;

  return (
    <div className='container max-w-4xl mt-10'>
      {!isGated && (
        <div className='w-max'>
          <Link href={`/event/${eventId}`}>
            <Button variant='ghost' className='flex items-center gap-1 pl-2'>
              <Icons.back />
              <span>{event.title}</span>
            </Button>
          </Link>
        </div>
      )}
      <h1 className='text-4xl font-heading my-4'>
        {definition.pageTitle ?? definition.name}
      </h1>

      <definition.PageComponent eventId={event._id} config={config} />
    </div>
  );
}
