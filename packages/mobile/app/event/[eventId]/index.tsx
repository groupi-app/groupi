import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-muted"
        >
          <Ionicons name="arrow-back" size={20} color="#6b7280" />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">Event</Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-xl font-bold text-foreground">
          Event Detail
        </Text>
        <Text className="mt-2 text-center text-base text-muted-foreground">
          Full event page coming in Phase 2
        </Text>
        <Text className="mt-4 text-sm text-muted-foreground">
          ID: {eventId}
        </Text>
      </View>
    </SafeAreaView>
  );
}
