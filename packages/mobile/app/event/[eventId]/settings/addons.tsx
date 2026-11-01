import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';

import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { toast } from '@groupi/shared/platform';
import { AddonsStep } from '@/components/create-event/addons-step';
import { DetailScreenTemplate } from '@/components/templates';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { EmptyState } from '@/components/ui/empty-state';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { getPublicBaseUrl } from '@/lib/public-urls';
import { useEventHeader } from '@/hooks/use-events';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import {
  eventFeaturePresentation,
  participationResetWarnings,
} from '@/lib/event-feature-placement';
import { LoadingState } from '@/components/molecules';
import { useReplaceBuiltInAddonConfigs } from '@/hooks/use-addons';
import {
  CreateEventProvider,
  useCreateEventForm,
  type FormState,
} from '@/context/create-event-context';

const MANAGEABLE_ADDON_TYPES = [
  'reminders',
  'bring-list',
  'questionnaire',
  'discord',
] as const;

export function ManageAddonsForm({
  eventId,
  existing,
}: {
  eventId: Id<'events'>;
  existing: NonNullable<
    ReturnType<typeof useQuery<typeof api.addons.queries.getEventAddons>>
  >;
}) {
  const { formState } = useCreateEventForm();
  const replaceBuiltInAddonConfigs = useReplaceBuiltInAddonConfigs();
  const [isSaving, setIsSaving] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const allowNavigation = useUnsavedChanges(
    JSON.stringify(formState.addonConfigs) !==
      JSON.stringify(
        Object.fromEntries(
          existing
            .filter(
              addon =>
                addon.enabled &&
                MANAGEABLE_ADDON_TYPES.some(type => type === addon.addonType)
            )
            .map(addon => [addon.addonType, addon.config])
        )
      )
  );

  async function persist() {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const addons = MANAGEABLE_ADDON_TYPES.flatMap(addonType => {
        const config = formState.addonConfigs[addonType];
        return config ? [{ addonType, config }] : [];
      });

      await replaceBuiltInAddonConfigs({ eventId, addons });

      toast.success('Event features updated');
      allowNavigation();
      router.back();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update add-ons'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave() {
    if (isSaving || confirmPending) return;
    const resets = participationResetWarnings(existing, formState.addonConfigs);
    if (!resets.length) {
      await persist();
      return;
    }
    setConfirmPending(true);
    showConfirmDialog({
      title: 'Reset saved participation data?',
      message: `These changes will permanently delete ${resets.join(' and ')}. Existing participant data cannot be restored. Save these changes?`,
      confirmLabel: 'Reset and save',
      cancelLabel: 'Keep editing',
      destructive: true,
      onCancel: () => setConfirmPending(false),
      onConfirm: async () => {
        setConfirmPending(false);
        await persist();
      },
    });
  }

  return (
    <AddonsStep
      onBack={() => router.back()}
      onNext={handleSave}
      submitLabel={isSaving ? 'Saving…' : 'Save changes'}
      isSubmitting={isSaving || confirmPending}
    />
  );
}

export default function ManageAddonsScreen() {
  const { eventId: eventIdParam } = useLocalSearchParams<{
    eventId: string;
  }>();
  const eventId = eventIdParam as Id<'events'>;
  const header = useEventHeader(eventId);
  const role = header?.userMembership?.role;
  const canManage = role === 'ORGANIZER' || role === 'MODERATOR';
  const addons = useQuery(
    api.addons.queries.getEventAddons,
    canManage ? { eventId } : 'skip'
  );
  if (header === undefined)
    return (
      <DetailScreenTemplate title='Event feature settings'>
        <LoadingState />
      </DetailScreenTemplate>
    );
  if (!canManage)
    return (
      <DetailScreenTemplate title='Event feature settings'>
        <EmptyState
          icon='lock-closed-outline'
          title='Settings unavailable'
          description='Only current Event managers can configure these features.'
        />
      </DetailScreenTemplate>
    );

  if (addons === undefined) {
    return (
      <DetailScreenTemplate title='Event feature settings' scrollable={false}>
        <LoadingState />
      </DetailScreenTemplate>
    );
  }

  const existingConfigs = addons
    .filter(
      addon =>
        addon.enabled &&
        MANAGEABLE_ADDON_TYPES.some(type => type === addon.addonType)
    )
    .reduce<FormState['addonConfigs']>((configs, addon) => {
      configs[addon.addonType] = addon.config;
      return configs;
    }, {});

  const preserved = addons.filter(
    addon => !MANAGEABLE_ADDON_TYPES.some(type => type === addon.addonType)
  );
  const invalidBuiltins = addons.some(
    addon =>
      addon.enabled &&
      MANAGEABLE_ADDON_TYPES.some(type => type === addon.addonType) &&
      eventFeaturePresentation(addon.addonType, addon.config).kind ===
        'unavailable'
  );
  const openWeb = async () => {
    try {
      await WebBrowser.openBrowserAsync(
        `${getPublicBaseUrl()}/event/${encodeURIComponent(eventId)}/settings/addons`
      );
    } catch {
      toast.error('Unable to open Event feature settings');
    }
  };
  if (invalidBuiltins)
    return (
      <DetailScreenTemplate title='Event feature settings'>
        <Text accessibilityRole='alert'>
          A saved feature has an unsupported configuration. Its configuration
          and participant data are preserved. Review it in the full web settings
          before changing Event features.
        </Text>
        <Button onPress={() => void openWeb()}>
          Review saved configuration in browser
        </Button>
      </DetailScreenTemplate>
    );
  return (
    <DetailScreenTemplate title='Event feature settings' scrollable={false}>
      <View className='flex-1'>
        <CreateEventProvider initialState={{ addonConfigs: existingConfigs }}>
          {preserved.length > 0 && (
            <ScrollView
              className='max-h-48 shrink-0'
              contentContainerClassName='gap-2 p-4'
            >
              <Text accessibilityRole='header'>Additional saved features</Text>
              {preserved.map(addon => (
                <Text key={addon.addonType}>
                  {
                    eventFeaturePresentation(addon.addonType, addon.config)
                      .title
                  }{' '}
                  · {addon.enabled ? 'enabled' : 'disabled'} · configuration
                  preserved
                </Text>
              ))}
              <Button onPress={() => void openWeb()}>
                Manage additional features in browser
              </Button>
            </ScrollView>
          )}
          <ManageAddonsForm eventId={eventId} existing={addons} />
        </CreateEventProvider>
      </View>
    </DetailScreenTemplate>
  );
}
