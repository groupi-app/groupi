import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams } from 'expo-router';

import { DetailScreenTemplate } from '@/components/templates';
import { LoadingState } from '@/components/molecules';
import { useAddonConfig } from '@/hooks/use-addons';
import { ReminderAddon } from '@/components/addons/reminder-addon';
import { QuestionnaireAddon } from '@/components/addons/questionnaire-addon';
import { BringListAddon } from '@/components/addons/bring-list-addon';
import { DiscordAddon } from '@/components/addons/discord-addon';
import { CustomAddonFallback } from '@/components/addons/custom-addon-fallback';
import { getCustomAddonSummary } from '@/lib/addon-contracts';

const ADDON_TITLES: Record<string, string> = {
  reminders: 'Reminders',
  questionnaire: 'Questionnaire',
  'bring-list': 'Bring List',
  discord: 'Discord',
};

export default function AddonDetailScreen() {
  const { eventId, addonType } = useLocalSearchParams<{
    eventId: string;
    addonType: string;
  }>();
  const addonConfig = useAddonConfig(eventId, addonType);

  const title =
    ADDON_TITLES[addonType] ??
    getCustomAddonSummary(addonConfig?.config)?.name ??
    'Add-on';

  if (addonConfig === undefined) {
    return (
      <DetailScreenTemplate title={title}>
        <LoadingState />
      </DetailScreenTemplate>
    );
  }

  if (addonConfig === null) {
    return (
      <DetailScreenTemplate title={title}>
        <View className='items-center py-12'>
          <Text className='text-base text-muted-foreground'>
            This add-on is not enabled
          </Text>
        </View>
      </DetailScreenTemplate>
    );
  }

  const config = addonConfig.config ?? {};

  return (
    <DetailScreenTemplate title={title}>
      {addonType === 'reminders' ? (
        <ReminderAddon eventId={eventId} config={config} />
      ) : addonType === 'questionnaire' ? (
        <QuestionnaireAddon eventId={eventId} config={config} />
      ) : addonType === 'bring-list' ? (
        <BringListAddon eventId={eventId} config={config} />
      ) : addonType === 'discord' ? (
        <DiscordAddon eventId={eventId} config={config} />
      ) : addonType.startsWith('custom:') ? (
        <CustomAddonFallback
          eventId={eventId}
          addonType={addonType}
          config={config}
        />
      ) : (
        <View className='items-center py-12'>
          <Text className='text-base text-muted-foreground'>
            This add-on type is not yet supported on mobile
          </Text>
        </View>
      )}
    </DetailScreenTemplate>
  );
}
