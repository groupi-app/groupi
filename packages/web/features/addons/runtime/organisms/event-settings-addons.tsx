'use client';

import type { AddonConfiguration } from '../../model/types';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useEventHeader } from '@/hooks/convex/use-events';
import {
  useEventAddons,
  useEnableAddon,
  useDisableAddon,
  useUpdateAddonConfig,
} from '../../hooks/use-addons';
import { Id } from '@/convex/_generated/dataModel';
import { SettingsPageTemplate } from '@/components/templates';
import { NewEventFormSkeleton } from '@/components/skeletons';
import { getEventAddonDefinitions } from '../catalog';
import { TemplatePicker } from './template-picker';

export function EventSettingsAddons({ eventId }: { eventId: string }) {
  const eventData = useEventHeader(eventId as Id<'events'>);
  const addonConfigs = useEventAddons(eventId as Id<'events'>);
  const enableAddon = useEnableAddon();
  const disableAddon = useDisableAddon();
  const updateAddonConfig = useUpdateAddonConfig();
  const [isSaving, setIsSaving] = useState(false);

  const allAddons = getEventAddonDefinitions(addonConfigs);

  const handleSave = useCallback(
    async (addonType: string, config: AddonConfiguration) => {
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

  const event = eventData?.event;

  return (
    <SettingsPageTemplate
      title='Add-ons'
      description='Enable or disable optional features for your event.'
      backHref={`/event/${eventId}/settings`}
      backLabel='Event settings'
      maxWidth='md'
    >
      {!event ? (
        <NewEventFormSkeleton />
      ) : (
        <>
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
                  key={`${event._id}:${addon.id}`}
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

          <TemplatePicker
            eventId={eventId as Id<'events'>}
            onSelect={async (addonType, config) => {
              await handleSave(addonType, config);
            }}
          />
        </>
      )}
    </SettingsPageTemplate>
  );
}
