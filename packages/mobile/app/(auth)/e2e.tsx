import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useMutation } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { api } from 'convex/_generated/api';
import { LoadingState } from '@/components/molecules/loading-state';
import { Button } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { completeNativeAuthCallback } from '@/lib/native-auth-actions';

const CONSUMED_FIXTURE_KEY = 'groupi-e2e-consumed-fixture';

function firstParam(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : value?.[0];
}

export default function NativeE2ELoginScreen() {
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const redeemFixture = useMutation(api.e2e.mutations.redeemMobileFixture);
  const startedCode = useRef<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loginCode = firstParam(params.code);
    if (startedCode.current === loginCode) return;
    startedCode.current = loginCode ?? null;
    let active = true;

    async function authenticateFixture() {
      try {
        if (process.env.EXPO_PUBLIC_E2E_TESTING !== 'true') {
          throw new Error('E2E login is disabled');
        }

        if (!loginCode) throw new Error('Missing E2E login code');

        // The login code is intentionally single-use. Remember its event on
        // the device so a reload can leave this route without a network call.
        try {
          const storedFixture =
            await SecureStore.getItemAsync(CONSUMED_FIXTURE_KEY);
          const consumed = storedFixture
            ? (JSON.parse(storedFixture) as {
                loginCode?: unknown;
                eventId?: unknown;
              })
            : null;
          if (
            consumed?.loginCode === loginCode &&
            typeof consumed.eventId === 'string'
          ) {
            if (active) router.replace(`/event/${consumed.eventId}`);
            return;
          }
        } catch {
          // Corrupt or unavailable local state should not block a fresh login.
        }

        const fixture = await redeemFixture({ loginCode });
        const result = await completeNativeAuthCallback(fixture.cookieHeader);
        if (!result.success) throw new Error(result.message);

        await SecureStore.setItemAsync(
          CONSUMED_FIXTURE_KEY,
          JSON.stringify({ loginCode, eventId: fixture.eventId })
        );

        if (active) router.replace(`/event/${fixture.eventId}`);
      } catch {
        if (active) setError(true);
      }
    }

    void authenticateFixture();
    return () => {
      active = false;
    };
  }, [params.code, redeemFixture]);

  if (!error) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <LoadingState message='Preparing the test event…' />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-1 items-center justify-center gap-4 px-6'>
        <Text className='text-center text-2xl font-bold text-foreground'>
          Test sign-in could not be completed
        </Text>
        <Text className='text-center text-base text-muted-foreground'>
          This one-time test link is unavailable, expired, or has already been
          used.
        </Text>
        <Button className='mt-2 w-full' onPress={() => router.replace('/')}>
          Return to Groupi
        </Button>
      </View>
    </SafeAreaView>
  );
}
