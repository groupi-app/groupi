import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalUser } from '@/context/global-user-context';
import { signOut } from '@/lib/auth-client';
import { router } from 'expo-router';

export default function YouScreen() {
  const { user } = useGlobalUser();

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/sign-in');
  }

  const initials = user?.name
    ? (user.name as string)
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center px-6 pt-12">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary">
          <Text className="text-2xl font-bold text-primary-foreground">
            {initials}
          </Text>
        </View>

        <Text className="text-xl font-bold text-foreground">
          {user?.name || 'Unknown'}
        </Text>
        {user?.username ? (
          <Text className="mt-1 text-base text-muted-foreground">
            @{user.username}
          </Text>
        ) : null}
        <Text className="mt-1 text-sm text-muted-foreground">
          {user?.email}
        </Text>

        <Text className="mt-8 text-center text-base text-muted-foreground">
          Full profile coming in Phase 3
        </Text>

        <Pressable
          className="mt-8 w-full items-center rounded-button bg-destructive py-3"
          onPress={handleSignOut}
        >
          <Text className="text-base font-semibold text-destructive-foreground">
            Sign Out
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
