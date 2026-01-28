/**
 * Groupi Mobile App - Expo + NativeWind + Shared Business Logic
 * Minimal starter using Expo, NativeWind (TailwindCSS), and @groupi/shared
 */

import React, { useEffect } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

// Convex setup
import { ConvexReactClient } from 'convex/react';
import { ConvexProvider } from 'convex/react';

// Platform adapters setup
import { setupPlatformAdapters } from './lib/platform-setup';

// Import shared business logic (when available)
// import { createAuthHooks } from '@groupi/shared/hooks';

// Types
export type RootStackParamList = {
  Home: undefined;
  Auth: undefined;
  Event: { eventId: string };
  Profile: { userId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Initialize Convex client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL || '');

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Basic home screen component - ready for Uniwind styling
function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 16,
          color: '#000000',
        }}
      >
        Groupi Mobile
      </Text>
      <Text
        style={{
          fontSize: 16,
          textAlign: 'center',
          color: '#8E8E93',
          marginBottom: 8,
        }}
      >
        Expo + React Native + Uniwind + @groupi/shared
      </Text>
      <Text
        style={{
          fontSize: 14,
          textAlign: 'center',
          color: '#8E8E93',
        }}
      >
        Ready for cross-platform business logic!
      </Text>
    </View>
  );
}

function AppContent() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Setup platform adapters for React Native/Expo
    const cleanup = setupPlatformAdapters();

    // Hide splash screen after setup
    SplashScreen.hideAsync();

    return cleanup;
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ConvexProvider client={convex}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name='Home' component={HomeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast />
      </ConvexProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return <AppContent />;
}
