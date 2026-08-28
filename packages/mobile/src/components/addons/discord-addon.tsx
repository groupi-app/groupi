import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import * as WebBrowser from 'expo-web-browser';
import { useCSSVariable } from 'uniwind';

import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useEventHeader } from '@/hooks/use-events';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { LoadingState } from '@/components/molecules';
import { toast } from '@groupi/shared/platform';

interface DiscordAddonProps {
  eventId: string;
  config: Record<string, unknown>;
}

export function DiscordAddon({ eventId, config }: DiscordAddonProps) {
  const typedEventId = eventId as Id<'events'>;
  const discordInfo = useQuery(api.discord.queries.getDiscordEventInfo, {
    eventId: typedEventId,
  });
  const headerData = useEventHeader(typedEventId);
  const primaryColor = String(
    useCSSVariable('--color-primary') ?? 'transparent'
  );
  const guildName =
    discordInfo?.guildName ??
    (typeof config.guildName === 'string'
      ? config.guildName
      : 'Discord server');

  if (discordInfo === undefined || headerData === undefined) {
    return <LoadingState message='Checking Discord sync...' />;
  }

  const discordEventUrl =
    discordInfo?.discordEventId && discordInfo.guildId
      ? `https://discord.com/events/${encodeURIComponent(discordInfo.guildId)}/${encodeURIComponent(discordInfo.discordEventId)}`
      : null;
  const hasDate = Boolean(headerData?.event.chosenDateTime);
  const status = discordInfo?.error
    ? 'Sync failed'
    : discordEventUrl
      ? 'Synced'
      : hasDate
        ? 'Syncing'
        : 'Waiting for a date';

  async function openDiscordEvent() {
    if (!discordEventUrl) return;
    try {
      await WebBrowser.openBrowserAsync(discordEventUrl);
    } catch {
      toast.error('Unable to open the Discord event');
    }
  }

  return (
    <Card className='gap-4'>
      <View className='flex-row items-center gap-3'>
        <View className='h-11 w-11 items-center justify-center rounded-card bg-primary/10'>
          <Ionicons name='logo-discord' size={24} color={primaryColor} />
        </View>
        <View className='flex-1'>
          <Text className='text-base font-semibold text-foreground'>
            Discord Event
          </Text>
          <Text className='text-sm text-muted-foreground'>{guildName}</Text>
        </View>
      </View>

      <View className='rounded-input bg-muted p-3'>
        <Text className='text-xs font-medium uppercase text-muted-foreground'>
          Status
        </Text>
        <Text
          className={`mt-1 text-sm font-semibold ${discordInfo?.error ? 'text-text-error' : 'text-foreground'}`}
        >
          {status}
        </Text>
        {discordInfo?.error ? (
          <Text className='mt-1 text-sm text-text-error'>
            {discordInfo.error}
          </Text>
        ) : !hasDate ? (
          <Text className='mt-1 text-sm text-muted-foreground'>
            Choose an event date to create the scheduled Discord event.
          </Text>
        ) : null}
      </View>

      {discordEventUrl ? (
        <Button variant='outline' onPress={() => void openDiscordEvent()}>
          <Ionicons name='open-outline' size={17} color={primaryColor} />
          <Text>Open in Discord</Text>
        </Button>
      ) : null}
    </Card>
  );
}
