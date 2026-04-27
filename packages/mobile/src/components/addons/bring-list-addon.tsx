import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useGlobalUser } from '@/context/global-user-context';
import { useAddonData, useSetAddonData } from '@/hooks/use-addons';
import { toast } from '@groupi/shared/platform';

interface BringListAddonProps {
  eventId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BringItem = any;

export function BringListAddon({ eventId, config }: BringListAddonProps) {
  const { person } = useGlobalUser();
  const personId = person?._id as string | undefined;
  const addonData = useAddonData(eventId, 'bring-list');
  const setAddonData = useSetAddonData();

  const items: BringItem[] = config?.items ?? [];

  // Build claim map from addon data
  const claims = new Map<string, { personId: string; name: string }[]>();
  if (addonData) {
    for (const entry of addonData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = entry as any;
      if (d.key?.startsWith('claim:')) {
        const itemId = d.key.split(':')[1];
        const existing = claims.get(itemId) ?? [];
        existing.push({
          personId: d.data?.personId ?? '',
          name: d.data?.name ?? 'Someone',
        });
        claims.set(itemId, existing);
      }
    }
  }

  async function handleToggleClaim(itemId: string) {
    if (!personId) return;

    const key = `claim:${itemId}:${personId}`;
    const currentClaims = claims.get(itemId) ?? [];
    const alreadyClaimed = currentClaims.some(c => c.personId === personId);

    try {
      if (alreadyClaimed) {
        // Unclaim — set empty data to indicate removal
        await setAddonData({
          eventId,
          addonType: 'bring-list',
          key,
          data: null,
        });
        toast.info('Item unclaimed');
      } else {
        await setAddonData({
          eventId,
          addonType: 'bring-list',
          key,
          data: { personId, name: person?.bio ?? 'Me' },
        });
        toast.success("You're bringing this!");
      }
    } catch {
      toast.error('Failed to update claim');
    }
  }

  if (items.length === 0) {
    return (
      <View className='items-center py-8'>
        <Text className='text-base text-muted-foreground'>
          No items on the bring list
        </Text>
      </View>
    );
  }

  return (
    <View className='gap-3'>
      {items.map((item: BringItem, index: number) => {
        const itemClaims = claims.get(item.id) ?? [];
        const isClaimed = itemClaims.some(c => c.personId === personId);
        const needed = item.quantity ?? 1;
        const claimedCount = itemClaims.length;

        return (
          <Pressable
            key={item.id ?? index}
            onPress={() => handleToggleClaim(item.id)}
            className='rounded-card border border-border bg-card p-4'
          >
            <View className='flex-row items-center justify-between'>
              <View className='flex-1'>
                <Text className='text-base font-medium text-foreground'>
                  {item.name ?? `Item ${index + 1}`}
                </Text>
                <Text className='text-sm text-muted-foreground'>
                  {claimedCount} / {needed} claimed
                </Text>
              </View>
              <Ionicons
                name={isClaimed ? 'checkmark-circle' : 'add-circle-outline'}
                size={24}
                color={isClaimed ? '#22c55e' : '#9ca3af'}
              />
            </View>

            {/* Claimed by avatars */}
            {itemClaims.length > 0 ? (
              <View className='mt-2 flex-row gap-1'>
                {itemClaims.slice(0, 5).map((claim, ci) => (
                  <UserAvatar key={ci} name={claim.name} size='xs' />
                ))}
                {itemClaims.length > 5 ? (
                  <Text className='text-xs text-muted-foreground'>
                    +{itemClaims.length - 5}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
