import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useCSSVariable } from 'uniwind';

import { getCustomAddonSummary } from '@/lib/addon-contracts';
import { getPublicEventAddonUrl } from '@/lib/public-urls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { toast } from '@groupi/shared/platform';

interface CustomAddonFallbackProps {
  eventId: string;
  addonType: string;
  config: Record<string, unknown>;
}

export function CustomAddonFallback({
  eventId,
  addonType,
  config,
}: CustomAddonFallbackProps) {
  const summary = getCustomAddonSummary(config);
  const primaryColor = String(
    useCSSVariable('--color-primary') ?? 'transparent'
  );
  const onPrimaryColor = String(
    useCSSVariable('--color-primary-foreground') ?? 'transparent'
  );

  async function openWebAddon() {
    try {
      await WebBrowser.openBrowserAsync(
        getPublicEventAddonUrl(eventId, addonType)
      );
    } catch {
      toast.error('Unable to open this Event feature');
    }
  }

  return (
    <Card className='gap-4'>
      <View className='flex-row items-center gap-3'>
        <View className='h-11 w-11 items-center justify-center rounded-card bg-primary/10'>
          <Ionicons
            name='extension-puzzle-outline'
            size={23}
            color={primaryColor}
          />
        </View>
        <View className='flex-1'>
          <Text className='text-base font-semibold text-foreground'>
            {summary?.name ?? 'Event feature'}
          </Text>
          <Text className='text-sm text-muted-foreground'>
            {summary?.description ?? 'A custom tool for this event'}
          </Text>
        </View>
      </View>

      <Text className='text-sm text-muted-foreground'>
        Open the full experience in your browser. Your saved information stays
        with this Event.
      </Text>

      <Button
        accessibilityLabel={`Open ${summary?.name ?? 'Event feature'} in browser`}
        accessibilityHint='Opens the full Event feature in your browser'
        onPress={() => void openWebAddon()}
      >
        <Ionicons name='open-outline' size={17} color={onPrimaryColor} />
        <Text>Open {summary?.name ?? 'Event feature'}</Text>
      </Button>
    </Card>
  );
}
