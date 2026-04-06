import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function EmptyEvents() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Ionicons name="calendar-outline" size={36} color="#9ca3af" />
      </View>
      <Text className="text-xl font-bold text-foreground">No events yet</Text>
      <Text className="mt-2 text-center text-base text-muted-foreground">
        Create your first event or join one to get started
      </Text>
    </View>
  );
}
