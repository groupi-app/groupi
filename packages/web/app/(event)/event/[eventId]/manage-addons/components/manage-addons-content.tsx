'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useEventHeader } from '@/hooks/convex';
import {
  useEventAddons,
  useEnableAddon,
  useDisableAddon,
  useUpdateAddonConfig,
} from '@/hooks/convex/use-addons';
import { Id } from '@/convex/_generated/dataModel';
import { NewEventFormSkeleton } from '@/components/skeletons';
import { getAddonRegistry } from '@/app/(newEvent)/create/components/addon-registry';

// Import addon modules so they self-register
import '@/app/(newEvent)/create/components/addons/reminder-addon';
import '@/app/(newEvent)/create/components/addons/questionnaire-addon';
import '@/app/(newEvent)/create/components/addons/bring-list-addon';

export function ManageAddonsContent({ eventId }: { eventId: string }) {
  const eventData = useEventHeader(eventId as Id<'events'>);
  const addonConfigs = useEventAddons(eventId as Id<'events'>);
  const enableAddon = useEnableAddon();
  const disableAddon = useDisableAddon();
  const updateAddonConfig = useUpdateAddonConfig();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const allAddons = getAddonRegistry();

  const handleSave = useCallback(
    async (addonType: string, config: Record<string, unknown>) => {
      setIsSaving(true);
      try {
        const existing = addonConfigs?.find(
          (c: { addonType: string; enabled: boolean }) =>
            c.addonType === addonType && c.enabled
        );
        if (existing) {
          await updateAddonConfig(eventId as Id<'events'>, addonType, config);
        } else {
          await enableAddon(eventId as Id<'events'>, addonType, config);
        }
        toast.success('Add-on updated');
      } catch {
        toast.error('Failed to update add-on');
      } finally {
        setIsSaving(false);
      }
    },
    [eventId, addonConfigs, enableAddon, updateAddonConfig]
  );

  const handleDisable = useCallback(
    async (addonType: string) => {
      setIsSaving(true);
      try {
        await disableAddon(eventId as Id<'events'>, addonType);
        toast.success('Add-on disabled');
      } catch {
        toast.error('Failed to disable add-on');
      } finally {
        setIsSaving(false);
      }
    },
    [eventId, disableAddon]
  );

  if (!eventData) {
    return (
      <div className='container max-w-4xl mt-10'>
        <NewEventFormSkeleton />
      </div>
    );
  }

  const { event } = eventData;

  return (
    <div className='container max-w-4xl mt-10'>
      <div className='w-max'>
        <Link href={`/event/${eventId}`}>
          <Button variant='ghost' className='flex items-center gap-1 pl-2'>
            <Icons.back />
            <span>{event.title}</span>
          </Button>
        </Link>
      </div>
      <h1 className='text-4xl font-heading my-4'>Manage Add-ons</h1>
      <p className='text-muted-foreground text-sm mb-6'>
        Enable or disable optional features for your event.
      </p>

      <div className='flex flex-col gap-3'>
        {allAddons.map(addon => {
          const addonConfig = addonConfigs?.find(
            (c: { addonType: string; enabled: boolean; config: unknown }) =>
              c.addonType === addon.id && c.enabled
          );
          const config = addonConfig
            ? (addonConfig.config as Record<string, unknown>)
            : null;

          return (
            <addon.ManageConfigComponent
              key={addon.id}
              eventId={event._id}
              config={config}
              chosenDateTime={event.chosenDateTime}
              onSave={newConfig => handleSave(addon.id, newConfig)}
              onDisable={() => handleDisable(addon.id)}
              isSaving={isSaving}
            />
          );
        })}
      </div>

      <div className='flex justify-end mt-6'>
        <Button
          onClick={() => router.push(`/event/${eventId}`)}
          variant='secondary'
        >
          Done
        </Button>
      </div>
    </div>
  );
}
