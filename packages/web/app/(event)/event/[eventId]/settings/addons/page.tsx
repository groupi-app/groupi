'use client';

import { use, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useEventHeader } from '@/hooks/convex';
import {
  useEventAddons,
  useEnableAddon,
  useDisableAddon,
  useUpdateAddonConfig,
} from '@/hooks/convex/use-addons';
import { Id } from '@/convex/_generated/dataModel';
import { SettingsPageTemplate } from '@/components/templates';
import { NewEventFormSkeleton } from '@/components/skeletons';
import { getAddonRegistry } from '@/app/(newEvent)/create/components/addon-registry';
import { registerCustomAddonsFromConfigs } from '@/lib/custom-addon-registration';
import { TemplatePicker } from '../../manage-addons/components/template-picker';

import '@/app/(newEvent)/create/components/addons/reminder-addon';
import '@/app/(newEvent)/create/components/addons/questionnaire-addon';
import '@/app/(newEvent)/create/components/addons/bring-list-addon';
import '@/app/(newEvent)/create/components/addons/discord-addon';

export default function EventSettingsAddonsPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);
  const eventData = useEventHeader(eventId as Id<'events'>);
  const addonConfigs = useEventAddons(eventId as Id<'events'>);
  const enableAddon = useEnableAddon();
  const disableAddon = useDisableAddon();
  const updateAddonConfig = useUpdateAddonConfig();
  const [isSaving, setIsSaving] = useState(false);

  if (addonConfigs) {
    registerCustomAddonsFromConfigs(
      addonConfigs as Array<{
        addonType: string;
        config: unknown;
        enabled: boolean;
      }>
    );
  }

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

  const event = eventData?.event;

  return (
    <SettingsPageTemplate
      title='Add-ons'
      description='Enable or disable optional features for your event.'
      backHref={`/event/${eventId}/settings`}
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
