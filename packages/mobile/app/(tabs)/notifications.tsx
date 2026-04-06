import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-foreground">
          Notifications
        </Text>
        <Text className="mt-2 text-center text-base text-muted-foreground">
          Coming in Phase 3
        </Text>
      </View>
    </SafeAreaView>
  );
}
