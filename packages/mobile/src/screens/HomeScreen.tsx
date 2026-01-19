/**
 * Home Screen - React Native implementation
 * Uses shared event hooks from @groupi/shared
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import shared business logic
import { createEventHooks, createAuthHooks } from '@groupi/shared/hooks';
import {
  formatDate,
  createListA11yProps,
  createListItemA11yProps,
  createButtonA11yProps,
} from '@groupi/shared';

import { Colors } from '../theme/colors';
import type { RootStackParamList } from '../App';
import type { ConvexApi } from '@groupi/shared/hooks';

// Placeholder API until Convex is integrated - returns empty hooks for now

const mockApi = {} as ConvexApi;
const authHooks = createAuthHooks(mockApi);
const eventHooks = createEventHooks(mockApi);

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

/** Event list item type for rendering */
interface EventListItem {
  _id: string;
  title: string;
  description?: string;
  _creationTime: number;
}

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [refreshing, setRefreshing] = React.useState(false);

  // Use shared hooks
  const currentUser = authHooks.useCurrentUser();
  const events = eventHooks.useUserEvents();
  const createEventMutation = eventHooks.useCreateEvent();

  // Loading states
  const loading = events === undefined;

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Convex queries auto-refetch, so we just need to wait a bit
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleCreateEvent = async () => {
    try {
      const newEventId = await createEventMutation({
        title: 'New Event',
        description: 'Created from mobile app',
      });

      if (newEventId) {
        navigation.navigate('Event', { eventId: newEventId as string });
      }
    } catch (err) {
      // Error handling would use toast from shared platform layer
      console.error('Failed to create event:', err);
    }
  };

  const handleEventPress = (eventId: string) => {
    navigation.navigate('Event', { eventId });
  };

  const renderEvent = ({
    item,
    index,
  }: {
    item: EventListItem;
    index: number;
  }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => handleEventPress(item._id)}
      {...createListItemA11yProps(
        `${item.title}. ${item.description || ''}. Created ${formatDate(item._creationTime)}`,
        index,
        events?.length
      )}
    >
      <Text style={styles.eventTitle}>{item.title}</Text>
      {item.description && (
        <Text style={styles.eventDescription}>{item.description}</Text>
      )}
      <Text style={styles.eventDate}>
        Created {formatDate(item._creationTime)}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !events) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome back{currentUser ? `, ${currentUser.firstName}` : ''}!
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateEvent}
          {...createButtonA11yProps('Create new event')}
        >
          <Text style={styles.createButtonText}>+ Create Event</Text>
        </TouchableOpacity>
      </View>

      {events && events.length > 0 ? (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          {...createListA11yProps(events.length, 'Your events')}
        />
      ) : (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No events yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first event to get started!
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  eventCard: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 12,
    color: Colors.light.secondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.secondary,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.light.secondary,
    textAlign: 'center',
  },
});
