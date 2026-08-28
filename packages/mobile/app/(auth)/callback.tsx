import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';

import { LoadingState } from '@/components/molecules/loading-state';
import { Button } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { getSafeAuthReturnPath } from '@/lib/auth-route-policy';
import { completeNativeAuthCallback } from '@/lib/native-auth-actions';

function firstParam(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : value?.[0];
}

export default function NativeAuthCallbackScreen() {
  const params = useLocalSearchParams<{
    cookie?: string | string[];
    error?: string | string[];
    returnTo?: string | string[];
  }>();
  const [error, setError] = useState(false);
  const returnTo = getSafeAuthReturnPath(firstParam(params.returnTo));

  useEffect(() => {
    let active = true;

    async function completeCallback() {
      try {
        const callbackCookie = firstParam(params.cookie);
        if (firstParam(params.error) || !callbackCookie) {
          throw new Error('Authentication callback failed');
        }

        const result = await completeNativeAuthCallback(callbackCookie);
        if (!result.success) throw new Error(result.message);

        if (active) router.replace((returnTo ?? '/(tabs)') as Href);
      } catch {
        if (active) setError(true);
      }
    }

    void completeCallback();
    return () => {
      active = false;
    };
  }, [params.cookie, params.error, returnTo]);

  if (!error) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <LoadingState message='Finishing sign in…' />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-1 items-center justify-center gap-4 px-6'>
        <Text className='text-center text-2xl font-bold text-foreground'>
          Sign-in link could not be completed
        </Text>
        <Text className='text-center text-base text-muted-foreground'>
          The link may have expired or already been used. Request a new code or
          sign-in link and try again.
        </Text>
        <Button
          className='mt-2 w-full'
          onPress={() =>
            router.replace({
              pathname: '/(auth)/sign-in',
              params: returnTo ? { returnTo } : undefined,
            })
          }
        >
          Back to sign in
        </Button>
      </View>
    </SafeAreaView>
  );
}
