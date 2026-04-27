import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { PortalHost } from '@rn-primitives/portal';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ActionMenuProvider } from '@/components/ui/action-menu';

import { ConvexClientProvider } from '@/providers/convex-provider';
import { ThemeProvider } from '@/theme/theme-provider';
import { GlobalUserProvider } from '@/context/global-user-context';
import { GlobalPresenceTracker } from '@/components/global-presence-tracker';
import { setupPlatformAdapters } from '@/lib/platform-setup';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    const cleanup = setupPlatformAdapters();
    SplashScreen.hideAsync();
    return cleanup;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ConvexClientProvider>
            <GlobalUserProvider>
              <BottomSheetModalProvider>
                <ActionMenuProvider>
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
                </ActionMenuProvider>
              </BottomSheetModalProvider>
              <GlobalPresenceTracker />
              <StatusBar style='auto' />
              <PortalHost />
              <Toast />
            </GlobalUserProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
