import '../global.css';

import { useEffect } from 'react';
import {
  Redirect,
  Stack,
  type Href,
  useGlobalSearchParams,
  usePathname,
  useSegments,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { PortalHost } from '@rn-primitives/portal';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ActionMenuProvider } from '@/components/ui/action-menu';

import { ConvexClientProvider } from '@/providers/convex-provider';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';
import {
  GlobalUserProvider,
  useGlobalUser,
} from '@/context/global-user-context';
import { GlobalPresenceTracker } from '@/components/global-presence-tracker';
import { setupPlatformAdapters } from '@/lib/platform-setup';
import {
  PushNotificationProvider,
  PushNotificationResponseHandler,
} from '@/context/push-notification-context';
import { configureForegroundNotifications } from '@/lib/push-notifications';
import { getAuthRouteDecision } from '@/lib/auth-route-policy';
import { ActivityIndicator, View } from 'react-native';

SplashScreen.preventAutoHideAsync();
configureForegroundNotifications();

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function RootNavigator() {
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
        name='invite/[inviteId]'
        options={{
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const cleanup = setupPlatformAdapters();
    SplashScreen.hideAsync();
    return cleanup;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexClientProvider>
          <ThemeProvider>
            <GlobalUserProvider>
              <PushNotificationProvider>
                <BottomSheetModalProvider>
                  <ActionMenuProvider>
                    <RootNavigator />
                    <PushNotificationResponseHandler />
                  </ActionMenuProvider>
                </BottomSheetModalProvider>
                <GlobalPresenceTracker />
                <ThemedStatusBar />
                <PortalHost />
                <Toast />
              </PushNotificationProvider>
            </GlobalUserProvider>
          </ThemeProvider>
        </ConvexClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
