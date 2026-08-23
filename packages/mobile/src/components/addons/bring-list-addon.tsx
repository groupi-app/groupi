import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useGlobalUser } from '@/context/global-user-context';
import {
  useAddonData,
  useDeleteAddonData,
  useSetAddonData,
} from '@/hooks/use-addons';
import { toast } from '@groupi/shared/platform';
import {
  buildClaimSummaries,
  getBringListItems,
  getPersonClaims,
  setClaimQuantity,
} from '@/lib/addon-contracts';

interface BringListAddonProps {
  eventId: string;
  config: unknown;
}

export function BringListAddon({ eventId, config }: BringListAddonProps) {
  const { person } = useGlobalUser();
  const personId = person?._id as string | undefined;
  const addonData = useAddonData(eventId, 'bring-list');
  const setAddonData = useSetAddonData();
  const deleteAddonData = useDeleteAddonData();
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const primaryColor = String(
    useCSSVariable('--color-primary') ?? 'transparent'
  );
  const successColor = String(
    useCSSVariable('--color-success') ?? 'transparent'
  );
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );

  const items = getBringListItems(config);
  const claimSummaries = buildClaimSummaries(addonData);
  const myClaims = getPersonClaims(addonData, personId);

  async function handleClaimChange(itemId: string, quantity: number) {
    if (!personId) return;

    const key = `claims:${personId}`;
    const updatedClaims = setClaimQuantity(myClaims, itemId, quantity);

    setSavingItemId(itemId);
    try {
      if (Object.keys(updatedClaims).length === 0) {
        await deleteAddonData({ eventId, addonType: 'bring-list', key });
        toast.info('Item unclaimed');
      } else {
        await setAddonData({
          eventId,
          addonType: 'bring-list',
          key,
          data: updatedClaims,
        });
        toast.success(
          quantity > 0 ? "You're bringing this!" : 'Item unclaimed'
        );
      }
    } catch {
      // The mutation hook presents the actionable error.
    } finally {
      setSavingItemId(null);
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
      {items.map(item => {
        const summary = claimSummaries[item.id];
        const itemClaims = summary?.claimants ?? [];
        const myClaimQuantity = myClaims[item.id] ?? 0;
        const claimedCount = summary?.totalClaimed ?? 0;
        const remainingForMe = Math.max(
          0,
          item.quantity - (claimedCount - myClaimQuantity)
        );
        const isClaimed = myClaimQuantity > 0;
        const isSaving = savingItemId === item.id;

        return (
          <Pressable
            key={item.id}
            accessibilityRole={item.quantity === 1 ? 'checkbox' : undefined}
            accessibilityState={
              item.quantity === 1 ? { checked: isClaimed } : undefined
            }
            disabled={isSaving}
            onPress={
              item.quantity === 1
                ? () => handleClaimChange(item.id, isClaimed ? 0 : 1)
                : undefined
            }
            className='rounded-card border border-border bg-card p-4'
          >
            <View className='flex-row items-center justify-between'>
              <View className='flex-1'>
                <Text className='text-base font-medium text-foreground'>
                  {item.name}
                </Text>
                <Text className='text-sm text-muted-foreground'>
                  {claimedCount} / {item.quantity} claimed
                </Text>
              </View>
              {item.quantity === 1 ? (
                <Ionicons
                  name={isClaimed ? 'checkmark-circle' : 'add-circle-outline'}
                  size={24}
                  color={isClaimed ? successColor : mutedColor}
                />
              ) : (
                <View className='flex-row items-center gap-3'>
                  <Pressable
                    accessibilityRole='button'
                    accessibilityLabel={`Bring one fewer ${item.name}`}
                    disabled={myClaimQuantity === 0 || isSaving}
                    onPress={() =>
                      handleClaimChange(item.id, myClaimQuantity - 1)
                    }
                    className='h-9 w-9 items-center justify-center rounded-button border border-border'
                  >
                    <Ionicons
                      name='remove'
                      size={18}
                      color={myClaimQuantity > 0 ? primaryColor : mutedColor}
                    />
                  </Pressable>
                  <Text className='min-w-5 text-center text-base font-semibold text-foreground'>
                    {myClaimQuantity}
                  </Text>
                  <Pressable
                    accessibilityRole='button'
                    accessibilityLabel={`Bring one more ${item.name}`}
                    disabled={myClaimQuantity >= remainingForMe || isSaving}
                    onPress={() =>
                      handleClaimChange(item.id, myClaimQuantity + 1)
                    }
                    className='h-9 w-9 items-center justify-center rounded-button border border-border'
                  >
                    <Ionicons
                      name='add'
                      size={18}
                      color={
                        myClaimQuantity < remainingForMe
                          ? primaryColor
                          : mutedColor
                      }
                    />
                  </Pressable>
                </View>
              )}
            </View>

            {/* Claimed by avatars */}
            {itemClaims.length > 0 ? (
              <View className='mt-2 flex-row gap-1'>
                {itemClaims.slice(0, 5).map(claim => (
                  <View
                    key={claim.personId}
                    className='flex-row items-center gap-0.5'
                  >
                    <UserAvatar
                      name={claim.personId === personId ? 'You' : 'Attendee'}
                      size='xs'
                    />
                    {claim.quantity > 1 ? (
                      <Text className='text-xs text-muted-foreground'>
                        ×{claim.quantity}
                      </Text>
                    ) : null}
                  </View>
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
