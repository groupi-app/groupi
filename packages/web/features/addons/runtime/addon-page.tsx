'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import type { Id } from '@/convex/_generated/dataModel';
import { useAddonConfig } from '../hooks';
import { useAddonGating } from './use-addon-gating';
import { getAddonById } from './catalog';

export function AddonPage({
  eventId,
  addonId,
}: {
  eventId: Id<'events'>;
  addonId: string;
}) {
  const eventData = useQuery(api.events.queries.getEventHeader, { eventId });
  const addonConfig = useAddonConfig(eventId, addonId);
  const { redirectTo, isLoading: gatingLoading } = useAddonGating(eventId);

  if (eventData === undefined || addonConfig === undefined) {
    return <p role='status'>Loading add-on…</p>;
  }

  const definition = getAddonById(addonId, addonConfig?.config);
  if (!eventData || !addonConfig?.enabled || !definition?.PageComponent) {
    const reason = !addonConfig
      ? 'This add-on has not been added to this event.'
      : !addonConfig.enabled
        ? 'This add-on is disabled for this event.'
        : 'This add-on does not have an available page.';
    return (
      <div className='container mx-auto py-8 text-center'>
        <div className='max-w-md mx-auto'>
          <h1 className='font-heading text-2xl font-bold mb-4'>
            Add-on unavailable
          </h1>
          <p className='text-muted-foreground mb-6'>{reason}</p>
          <Button asChild>
            <Link href={`/event/${eventId}`}>Return to Event</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { event } = eventData;
  return (
    <div className='container max-w-4xl mt-10'>
      {!gatingLoading && redirectTo === null && (
        <div className='w-max'>
          <Button
            asChild
            variant='ghost'
            className='flex items-center gap-1 pl-2'
          >
            <Link href={`/event/${eventId}`}>
              <Icons.back />
              <span>{event.title}</span>
            </Link>
          </Button>
        </div>
      )}
      <h1 className='text-4xl font-heading my-4'>
        {definition.pageTitle ?? definition.name}
      </h1>
      <definition.PageComponent
        key={`${eventId}:${addonId}`}
        eventId={event._id}
        addonType={addonId}
        config={addonConfig.config}
      />
    </div>
  );
}
