'use client';

import type { AddonConfiguration } from '../../model/types';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useEventHeader } from '@/hooks/convex/use-events';
import {
  useEventAddons,
  useEnableAddon,
  useDisableAddon,
  useUpdateAddonConfig,
} from '../../hooks/use-addons';
import type { Id } from '@/convex/_generated/dataModel';
import { SettingsPageTemplate } from '@/components/templates';
import { Button } from '@/components/ui/button';
import { NewEventFormSkeleton } from '@/components/skeletons';
import { getAddonById, getEventAddonDefinitions } from '../catalog';
import {
  canRenderParticipantFeature,
  participantFeatureTitle,
} from '../participant-features';
import { useConfigurationConfirmation } from '../configuration-confirmation';
import { FeatureRenderingBoundary } from '../feature-rendering-boundary';
import { TemplatePicker } from './template-picker';

function resetExplanation(type: string, disabling: boolean) {
  const reset =
    type === 'bring-list'
      ? 'Existing claims will be cleared.'
      : type === 'questionnaire'
        ? 'Existing responses will be cleared.'
        : type === 'discord'
          ? 'The connected Discord event may be removed or recreated.'
          : type.startsWith('custom:')
            ? 'Saved responses and interactions may be reset.'
            : 'Scheduled reminders will be updated.';
  return `${disabling ? 'Disable this event feature?' : 'Save this configuration change?'} ${reset} Other event features remain unchanged.`;
}
export function EventSettingsAddons({ eventId }: { eventId: string }) {
  const typedEventId = eventId as Id<'events'>;
  const eventData = useEventHeader(typedEventId);
  const configs = useEventAddons(typedEventId);
  const enableAddon = useEnableAddon();
  const disableAddon = useDisableAddon();
  const updateConfig = useUpdateAddonConfig();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const managementRoot = useRef<HTMLDivElement>(null);
  const { confirm, dialog, confirming } =
    useConfigurationConfirmation(managementRoot);
  const role = eventData?.userMembership?.role;
  const manager = role === 'ORGANIZER' || role === 'MODERATOR';
  const allAddons = getEventAddonDefinitions(configs);
  const unavailable = (configs ?? []).filter(
    row =>
      !getAddonById(row.addonType, row.config as Record<string, unknown>) ||
      !canRenderParticipantFeature(row.addonType, row.config)
  );
  const disabledSaved = (configs ?? []).filter(
    row =>
      !row.enabled &&
      canRenderParticipantFeature(row.addonType, row.config) &&
      getAddonById(row.addonType, row.config as Record<string, unknown>)
  );
  async function save(type: string, config: AddonConfiguration) {
    const existing = configs?.find(
      row => row.addonType === type && row.enabled
    );
    if (existing && JSON.stringify(existing.config) === JSON.stringify(config))
      return true;
    const perform = async () => {
      if (!manager) throw new Error('Event management access required.');
      if (existing) await updateConfig(typedEventId, type, config);
      else await enableAddon(typedEventId, type, config);
      toast.success('Event feature updated');
    };
    if (existing)
      return confirm(
        'Change event feature?',
        resetExplanation(type, false),
        perform
      );
    setSaving(true);
    setError('');
    try {
      await perform();
      return true;
    } catch {
      setError(
        'Unable to enable this feature. Your edits are still here. Try again.'
      );
      return false;
    } finally {
      setSaving(false);
    }
  }
  async function disable(type: string) {
    return confirm(
      'Disable event feature?',
      resetExplanation(type, true),
      async () => {
        if (!manager) throw new Error('Event management access required.');
        await disableAddon(typedEventId, type);
        toast.success('Event feature disabled');
      }
    );
  }
  return (
    <SettingsPageTemplate
      title='Add-ons'
      description='Choose and configure your event features.'
      backHref={`/event/${eventId}/settings`}
      backLabel='Event settings'
      maxWidth='md'
    >
      {eventData === undefined || configs === undefined ? (
        <NewEventFormSkeleton />
      ) : !manager ? (
        <p role='alert'>
          Only current event organizers and moderators can configure these
          features.
        </p>
      ) : (
        <>
          <div
            ref={managementRoot}
            tabIndex={-1}
            className='flex flex-col gap-3'
          >
            {allAddons.map(addon => {
              const row = configs.find(item => item.addonType === addon.id);
              if (
                row &&
                (!row.enabled ||
                  !canRenderParticipantFeature(row.addonType, row.config))
              )
                return null;
              return (
                <FeatureRenderingBoundary
                  key={`${eventId}:${addon.id}:${row?.updatedAt ?? 'new'}`}
                  title={
                    row
                      ? participantFeatureTitle(row.addonType, row.config)
                      : addon.name
                  }
                  management
                >
                  <addon.ManageConfigComponent
                    eventId={typedEventId}
                    config={
                      row ? (row.config as Record<string, unknown>) : null
                    }
                    chosenDateTime={eventData?.event.chosenDateTime}
                    onSave={config => save(addon.id, config)}
                    onDisable={() => disable(addon.id)}
                    isSaving={saving || confirming}
                  />
                </FeatureRenderingBoundary>
              );
            })}
            {disabledSaved.map(row => {
              const definition = getAddonById(
                row.addonType,
                row.config as Record<string, unknown>
              )!;
              return (
                <section
                  key={row.addonType}
                  className='space-y-2 rounded-card border border-border p-4'
                >
                  <h2 className='font-heading font-semibold'>
                    {definition.name}
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Disabled. The saved configuration is retained.
                  </p>
                  <Button
                    variant='outline'
                    disabled={saving || confirming}
                    onClick={() =>
                      void save(row.addonType, row.config as AddonConfiguration)
                    }
                  >
                    Enable {definition.name}
                  </Button>
                </section>
              );
            })}
            {unavailable.map((row, index) => (
              <section
                key={row.addonType}
                aria-label={`Saved feature ${index + 1}`}
                className='space-y-2 rounded-card border border-border p-4'
              >
                <h2 className='font-heading font-semibold'>
                  {participantFeatureTitle(row.addonType, row.config)}
                </h2>
                <p className='text-sm text-muted-foreground'>
                  This feature cannot be configured in this version. Its saved
                  configuration and participant information are retained.
                </p>
                <p className='text-sm'>
                  {row.enabled ? 'Enabled' : 'Disabled'}
                </p>
              </section>
            ))}
          </div>
          {error && (
            <p role='alert' className='text-destructive'>
              {error}
            </p>
          )}
          <TemplatePicker eventId={typedEventId} onSelect={save} />
          {dialog}
        </>
      )}
    </SettingsPageTemplate>
  );
}
