import { Redirect, Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { useCSSVariable } from 'uniwind';
import { useGlobalUser } from '@/context/global-user-context';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

export default function TabsLayout() {
  const { isAuthenticated, isLoading, needsOnboarding } = useGlobalUser();

  const unreadCount = useQuery(
    api.notifications.queries.getUnreadNotificationCount,
    isAuthenticated ? {} : 'skip'
  );

  const didRedirectRef = useRef(false);

  // All hooks must be called before any conditional returns
  const primaryColor = useCSSVariable('--color-primary') as string | undefined;
  const mutedColor = useCSSVariable('--color-muted-foreground') as
    | string
    | undefined;
  const bgColor = useCSSVariable('--color-card') as string | undefined;
  const borderColor = useCSSVariable('--color-border') as string | undefined;

  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      needsOnboarding &&
      !didRedirectRef.current
    ) {
      didRedirectRef.current = true;
      router.replace('/onboarding');
    }
  }, [isLoading, isAuthenticated, needsOnboarding]);

  if (isLoading) {
    return (
      <View className='flex-1 items-center justify-center bg-background'>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href='/(auth)/sign-in' />;
  }

  if (needsOnboarding === undefined || needsOnboarding === null) {
    return (
      <View className='flex-1 items-center justify-center bg-background'>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  if (needsOnboarding) {
    return (
      <View className='flex-1 items-center justify-center bg-background'>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  const badgeCount = unreadCount?.count ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primaryColor ?? '#8b00b8',
        tabBarInactiveTintColor: mutedColor ?? '#9ca3af',
        tabBarStyle: {
          backgroundColor: bgColor ?? undefined,
          borderTopColor: borderColor ?? undefined,
          borderTopWidth: 1,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name='home' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='notifications'
        options={{
          title: 'Notifications',
          tabBarBadge: badgeCount > 0 ? badgeCount : undefined,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name='notifications' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='you'
        options={{
          title: 'You',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name='person' size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
