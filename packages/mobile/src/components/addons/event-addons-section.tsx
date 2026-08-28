import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { AddonCard } from './addon-card';
import { SectionHeader } from '@/components/ui/section-header';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AddonConfig = any;

interface EventAddonsSectionProps {
  addons: AddonConfig[];
  eventId: string;
}

export function EventAddonsSection({
  addons,
  eventId,
}: EventAddonsSectionProps) {
  if (!addons || addons.length === 0) return null;

  return (
    <View className='mt-4 px-4'>
      <SectionHeader
        title='Add-ons'
        actionLabel='View All'
        onAction={() => router.push(`/event/${eventId}/addons`)}
      />
      <View className='mt-2 gap-2'>
        {addons.slice(0, 3).map((addon: AddonConfig) => (
          <AddonCard
            key={addon._id ?? addon.addonType}
            addonType={addon.addonType}
            config={addon.config ?? {}}
            onPress={() =>
              router.push(`/event/${eventId}/addons/${addon.addonType}`)
            }
          />
        ))}
        {addons.length > 3 ? (
          <Text className='text-center text-sm text-muted-foreground'>
            +{addons.length - 3} more add-ons
          </Text>
        ) : null}
      </View>
    </View>
  );
}
