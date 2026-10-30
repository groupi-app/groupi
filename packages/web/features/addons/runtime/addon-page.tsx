'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import type { Id } from '@/convex/_generated/dataModel';
import { useAddonConfig } from '../hooks';
import { useAddonGating } from './use-addon-gating';
import {
  canRenderParticipantFeature,
  participantFeatureTitle,
} from './participant-features';
import { FeatureRenderingBoundary } from './feature-rendering-boundary';
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
    return <p role='status'>Loading event feature…</p>;
  }

  const definition = canRenderParticipantFeature(addonId, addonConfig?.config)
    ? getAddonById(addonId, addonConfig?.config)
    : undefined;
  if (!eventData || !addonConfig?.enabled || !definition?.PageComponent) {
    const reason = !addonConfig
      ? 'This feature has not been enabled for this event.'
      : !addonConfig.enabled
        ? 'This feature is disabled for this event.'
        : 'This saved feature does not have an available page in this version.';
    return (
      <div className='container mx-auto py-8 text-center'>
        <div className='max-w-md mx-auto'>
          <h1 className='font-heading text-2xl font-bold mb-4'>
            {addonConfig
              ? participantFeatureTitle(addonId, addonConfig.config)
              : 'Event feature unavailable'}
          </h1>
          <p role='status' className='text-muted-foreground mb-6'>
            {reason}{' '}
            {addonConfig &&
              'No saved information is changed by opening this page.'}
          </p>
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
      <FeatureRenderingBoundary
        key={`${eventId}:${addonId}:${addonConfig.updatedAt}`}
        title={participantFeatureTitle(addonId, addonConfig.config)}
      >
        <definition.PageComponent
          eventId={event._id}
          addonType={addonId}
          config={addonConfig.config}
        />
      </FeatureRenderingBoundary>
    </div>
  );
}
