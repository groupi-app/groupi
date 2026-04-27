import { FlatList } from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, router } from 'expo-router';

import { DetailScreenTemplate } from '@/components/templates';
import { LoadingState } from '@/components/molecules';
import { EmptyState } from '@/components/ui/empty-state';
import { AddonCard } from '@/components/addons/addon-card';
import { useEventAddons, useAddonCompletionStatus } from '@/hooks/use-addons';
import { useCanManageEvent } from '@/hooks/use-events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AddonConfig = any;

export default function AddonsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const addons = useEventAddons(eventId);
  const completionStatus = useAddonCompletionStatus(eventId);
  const permissions = useCanManageEvent(eventId as never);

  if (addons === undefined) {
    return (
      <DetailScreenTemplate title='Add-ons' scrollable={false}>
        <LoadingState />
      </DetailScreenTemplate>
    );
  }

  const completionMap = new Map<string, boolean>();
  if (completionStatus?.addons) {
    for (const a of completionStatus.addons) {
      completionMap.set(a.addonType, a.completed);
    }
  }

  return (
    <DetailScreenTemplate
      title='Add-ons'
      scrollable={false}
      headerRight={
        permissions?.canManage ? (
          <Text
            className='text-sm font-medium text-primary'
            onPress={() => router.push(`/event/${eventId}/addons/manage`)}
          >
            Manage
          </Text>
        ) : undefined
      }
    >
      <FlatList
        data={addons}
        keyExtractor={(item: AddonConfig) => item._id ?? item.addonType}
        className='px-4'
        contentContainerClassName='gap-3 pb-6'
        contentContainerStyle={
          (addons?.length ?? 0) === 0 ? { flex: 1 } : undefined
        }
        renderItem={({ item }: { item: AddonConfig }) => (
          <AddonCard
            addonType={item.addonType}
            config={item.config ?? {}}
            completed={completionMap.get(item.addonType)}
            onPress={() =>
              router.push(`/event/${eventId}/addons/${item.addonType}`)
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon='extension-puzzle-outline'
            title='No add-ons'
            description='This event has no add-ons enabled'
          />
        }
      />
    </DetailScreenTemplate>
  );
}
