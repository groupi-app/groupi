import {
  Redirect,
  Stack,
  type Href,
  useGlobalSearchParams,
  usePathname,
  useSegments,
} from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useGlobalUser } from '@/context/global-user-context';
import { getAuthRouteDecision } from '@/lib/auth-route-policy';

export function RootNavigator() {
  const { isAuthenticated, isLoading, needsOnboarding } = useGlobalUser();
  const segments = useSegments();
  const pathname = usePathname();
  const { returnTo } = useGlobalSearchParams<{ returnTo?: string }>();
  const decision = getAuthRouteDecision({
    isLoading,
    isAuthenticated,
    needsOnboarding,
    rootSegment: segments[0],
    pathname,
    returnTo,
  });

  if (decision.kind === 'loading') {
    return (
      <View className='flex-1 items-center justify-center bg-background'>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  if (decision.kind === 'sign-in') {
    return (
      <Redirect
        href={{
          pathname: '/(auth)/sign-in',
          params: decision.returnTo ? { returnTo: decision.returnTo } : {},
        }}
      />
    );
  }

  if (decision.kind === 'onboarding') {
    return (
      <Redirect
        href={{
          pathname: '/onboarding',
          params: decision.returnTo ? { returnTo: decision.returnTo } : {},
        }}
      />
    );
  }

  if (decision.kind === 'home') {
    return <Redirect href='/(tabs)' />;
  }

  if (decision.kind === 'return-to') {
    return <Redirect href={decision.destination as Href} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='(auth)' />
      <Stack.Screen name='(tabs)' />
      <Stack.Screen
        name='onboarding'
        options={{
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name='event/[eventId]'
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name='create-event/index'
        options={{
          presentation: 'modal',
          gestureEnabled: true,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name='friends/index'
        options={{
          presentation: 'modal',
          gestureEnabled: true,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name='profile/[userId]'
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name='settings'
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name='invites/index'
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name='notifications/index'
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name='invite/[inviteId]'
        options={{
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
