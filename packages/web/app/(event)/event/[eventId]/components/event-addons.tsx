'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useEventAddons } from '@/hooks/convex/use-addons';
import { useEventHeaderData } from '@/hooks/convex';
import {
  getAddonRegistry,
  getAddonById,
  type AddonDefinition,
} from '@/app/(newEvent)/create/components/addon-registry';

// Import addon modules so they self-register
import '@/app/(newEvent)/create/components/addons/reminder-addon';
import '@/app/(newEvent)/create/components/addons/questionnaire-addon';

type HeaderData = NonNullable<ReturnType<typeof useEventHeaderData>>;

interface EnabledAddon {
  config: {
    addonType: string;
    enabled: boolean;
    config: unknown;
    eventId: string;
  };
  definition: AddonDefinition;
}

interface EventAddonsProps {
  data: HeaderData;
}

/**
 * Add-ons section on the event page.
 * Renders all enabled add-ons from the registry using their EventCardComponent.
 * Only rendered when the event has at least one active add-on.
 */
export function EventAddons({ data }: EventAddonsProps) {
  const { event, userMembership } = data;
  const isOrganizer = userMembership.role === 'ORGANIZER';
  const addonConfigs = useEventAddons(event._id);

  // Ensure the addon registry is loaded
  getAddonRegistry();

  // Filter to enabled add-ons that have a registered handler
  const enabledAddons: EnabledAddon[] = [];
  for (const c of addonConfigs ?? []) {
    if (!c.enabled) continue;
    const definition = getAddonById(c.addonType as string);
    if (!definition) continue;
    enabledAddons.push({ config: c, definition });
  }

  // Don't render if no add-ons are active
  if (enabledAddons.length === 0) {
    return null;
  }

  return (
    <div>
      <div className='flex items-center gap-2'>
        <h2 className='text-xl font-heading font-medium'>Add-ons</h2>
        {isOrganizer && (
          <Link href={`/event/${event._id}/manage-addons`}>
            <Button className='flex items-center gap-1' size='sm'>
              <Icons.settings className='size-4' />
              <span>Manage</span>
            </Button>
          </Link>
        )}
      </div>
      <div className='mt-2 flex flex-wrap gap-2'>
        {enabledAddons.map(({ config: addonConfig, definition }) => (
          <definition.EventCardComponent
            key={addonConfig.addonType}
            eventId={event._id}
            config={addonConfig.config as Record<string, unknown>}
            chosenDateTime={event.chosenDateTime}
          />
        ))}
      </div>
    </div>
  );
}
