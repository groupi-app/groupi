import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';

import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { toast } from '@groupi/shared/platform';
import { AddonsStep } from '@/components/create-event/addons-step';
import { DetailScreenTemplate } from '@/components/templates';
import { LoadingState } from '@/components/molecules';
import { useReplaceBuiltInAddonConfigs } from '@/hooks/use-addons';
import {
  CreateEventProvider,
  useCreateEventForm,
} from '@/context/create-event-context';

const MANAGEABLE_ADDON_TYPES = [
  'reminders',
  'bring-list',
  'questionnaire',
  'discord',
] as const;

function ManageAddonsForm({ eventId }: { eventId: Id<'events'> }) {
  const { formState } = useCreateEventForm();
  const replaceBuiltInAddonConfigs = useReplaceBuiltInAddonConfigs();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const addons = MANAGEABLE_ADDON_TYPES.flatMap(addonType => {
        const config = formState.addonConfigs[addonType];
        return config ? [{ addonType, config }] : [];
      });

      await replaceBuiltInAddonConfigs({ eventId, addons });

      toast.success('Add-ons updated');
      router.back();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update add-ons'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AddonsStep
      onBack={() => router.back()}
      onNext={handleSave}
      submitLabel={isSaving ? 'Saving…' : 'Save changes'}
      isSubmitting={isSaving}
    />
  );
}

export default function ManageAddonsScreen() {
  const { eventId: eventIdParam } = useLocalSearchParams<{
    eventId: string;
  }>();
  const eventId = eventIdParam as Id<'events'>;
  const addons = useQuery(api.addons.queries.getEventAddons, { eventId });

  if (addons === undefined) {
    return (
      <DetailScreenTemplate title='Manage add-ons' scrollable={false}>
        <LoadingState />
      </DetailScreenTemplate>
    );
  }

  const existingConfigs = Object.fromEntries(
    addons
      .filter(
        addon =>
          addon.enabled &&
          MANAGEABLE_ADDON_TYPES.includes(
            addon.addonType as (typeof MANAGEABLE_ADDON_TYPES)[number]
          )
      )
      .map(addon => [addon.addonType, addon.config as Record<string, unknown>])
  ) as Record<string, Record<string, unknown>>;

  return (
    <DetailScreenTemplate title='Manage add-ons' scrollable={false}>
      <View className='flex-1'>
        <CreateEventProvider initialState={{ addonConfigs: existingConfigs }}>
          <ManageAddonsForm eventId={eventId} />
        </CreateEventProvider>
      </View>
    </DetailScreenTemplate>
  );
}
