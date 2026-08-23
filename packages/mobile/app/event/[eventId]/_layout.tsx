import { useEffect } from 'react';
import { View } from 'react-native';
import { router, Stack, useLocalSearchParams, usePathname } from 'expo-router';

import { SafeAreaView } from '@/components/ui/safe-area-view';
import { LoadingState } from '@/components/molecules';
import { useAddonCompletionStatus } from '@/hooks/use-addons';
import {
  getRequiredEventRedirect,
  isEventGateExemptPath,
} from '@/lib/event-access-policy';

export default function EventLayout() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const pathname = usePathname();
  const isGateExempt = isEventGateExemptPath(pathname, eventId);
  const completionStatus = useAddonCompletionStatus(
    isGateExempt ? undefined : eventId
  );
  const redirectTarget = getRequiredEventRedirect(eventId, completionStatus);

  useEffect(() => {
    if (!isGateExempt && redirectTarget) {
      router.replace(redirectTarget);
    }
  }, [isGateExempt, redirectTarget]);

  if (
    !isGateExempt &&
    (completionStatus === undefined || redirectTarget !== null)
  ) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-1 items-center justify-center'>
          <LoadingState />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    />
  );
}
