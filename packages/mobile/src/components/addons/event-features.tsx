import { View } from 'react-native';
import { router } from 'expo-router';
import type { useEventAddons } from '@/hooks/use-addons';
import { useAddonCompletionStatus } from '@/hooks/use-addons';
import { eventFeaturePresentation } from '@/lib/event-feature-placement';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ReminderAddon } from './reminder-addon';
import { DiscordAddon } from './discord-addon';
import { CustomAddonFallback } from './custom-addon-fallback';

type FeatureProps = {
  eventId: string;
  addons: (Pick<
    NonNullable<ReturnType<typeof useEventAddons>>[number],
    'addonType' | 'enabled'
  > & { config: Record<string, unknown> })[];
};
/** Personal reminder preferences and Discord status belong beside dates and RSVP. */
export function EventPlanningFeatures({ eventId, addons }: FeatureProps) {
  return (
    <View className='gap-4 px-4'>
      {addons
        .filter(addon => addon.enabled)
        .map(addon => {
          const feature = eventFeaturePresentation(
            addon.addonType,
            addon.config
          );
          if (feature.kind === 'reminders')
            return (
              <View key={addon.addonType} className='gap-2'>
                <Text
                  accessibilityRole='header'
                  className='font-semibold text-foreground'
                >
                  Remind me
                </Text>
                <ReminderAddon eventId={eventId} config={addon.config} />
              </View>
            );
          if (feature.kind === 'discord')
            return (
              <DiscordAddon
                key={addon.addonType}
                eventId={eventId}
                config={addon.config}
              />
            );
          return null;
        })}
    </View>
  );
}
/** Participation stays discoverable under its own name, without an add-on catalogue. */
export function EventParticipationFeatures({ eventId, addons }: FeatureProps) {
  const completion = useAddonCompletionStatus(eventId);
  return (
    <View className='gap-4 px-4'>
      {addons
        .filter(addon => addon.enabled)
        .map(addon => {
          const feature = eventFeaturePresentation(
            addon.addonType,
            addon.config
          );
          if (feature.kind === 'reminders' || feature.kind === 'discord')
            return null;
          if (feature.kind === 'custom')
            return (
              <CustomAddonFallback
                key={addon.addonType}
                eventId={eventId}
                addonType={addon.addonType}
                config={addon.config}
              />
            );
          if (feature.kind === 'unavailable')
            return (
              <View
                key={addon.addonType}
                className='gap-2 rounded-card border border-border p-4'
              >
                <Text
                  accessibilityRole='header'
                  className='font-semibold text-foreground'
                >
                  Saved event feature
                </Text>
                <Text>
                  This saved feature is unavailable in this app version. Its
                  configuration and participant data are preserved. Event
                  managers can review it in Event Settings.
                </Text>
              </View>
            );
          const completed = completion?.addons.find(
            item => item.addonType === addon.addonType
          )?.completed;
          return (
            <View key={addon.addonType} className='gap-2'>
              <Button
                variant='outline'
                accessibilityLabel={feature.title}
                accessibilityHint={
                  feature.kind === 'questionnaire'
                    ? 'Open your Event details and saved answers'
                    : 'Open items to bring and your saved claims'
                }
                onPress={() =>
                  router.push(
                    `/event/${eventId}/addons/${encodeURIComponent(addon.addonType)}`
                  )
                }
              >
                {feature.title}
              </Button>
              {feature.kind === 'questionnaire' && (
                <Text className='text-sm text-muted-foreground'>
                  {completed === undefined
                    ? 'Review your details for this Event.'
                    : completed
                      ? 'Your details are complete. You can review your saved answers.'
                      : 'Complete your details for this Event.'}
                </Text>
              )}
            </View>
          );
        })}
    </View>
  );
}
