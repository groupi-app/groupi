import '../global.css';

import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import Geologica from '../../../assets/fonts/Geologica.ttf';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { PortalHost } from '@rn-primitives/portal';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ActionMenuProvider } from '@/components/ui/action-menu';
import { MemberDrawerProvider } from '@/components/events/member-drawer';

import { ConvexClientProvider } from '@/providers/convex-provider';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';
import { GlobalUserProvider } from '@/context/global-user-context';
import { GlobalPresenceTracker } from '@/components/global-presence-tracker';
import { setupPlatformAdapters } from '@/lib/platform-setup';
import {
  PushNotificationProvider,
  PushNotificationResponseHandler,
} from '@/context/push-notification-context';
import { configureForegroundNotifications } from '@/lib/push-notifications';
import { RootNavigator } from '@/components/navigation/root-navigator';

SplashScreen.preventAutoHideAsync();
configureForegroundNotifications();

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geologica,
  });
  useEffect(() => {
    const cleanup = setupPlatformAdapters();
    return cleanup;
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexClientProvider>
          <ThemeProvider>
            <GlobalUserProvider>
              <PushNotificationProvider>
                <BottomSheetModalProvider>
                  <ActionMenuProvider>
                    <MemberDrawerProvider>
                      <RootNavigator />
                      <PushNotificationResponseHandler />
                    </MemberDrawerProvider>
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
