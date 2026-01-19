/**
 * Event Screen - React Native implementation
 * Uses shared event hooks from @groupi/shared
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import shared business logic
import { createEventHooks } from '@groupi/shared/hooks';
import {
  formatDateTime,
  createButtonA11yProps,
  createHeadingA11yProps,
} from '@groupi/shared';

import { Colors } from '../theme/colors';
import type { RootStackParamList } from '../App';
import type { ConvexApi } from '@groupi/shared/hooks';

// Placeholder API until Convex is integrated - returns empty hooks for now

const mockApi = {} as ConvexApi;
const { useEventHeader, useJoinEvent, useLeaveEvent } =
  createEventHooks(mockApi);

type EventScreenRouteProp = RouteProp<RootStackParamList, 'Event'>;
type EventScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Event'
>;

export function EventScreen() {
  const route = useRoute<EventScreenRouteProp>();
  const navigation = useNavigation<EventScreenNavigationProp>();
  const { eventId } = route.params;

  // Use shared hooks - cast eventId to ConvexId type
  const event = useEventHeader(
    eventId as import('@groupi/shared/hooks').ConvexId<'events'>
  );
  const joinEventMutation = useJoinEvent();
  const leaveEventMutation = useLeaveEvent();

  // Loading and error states
  const loading = event === undefined;
  const error = event === null;

  const handleJoinEvent = async () => {
    try {
      await joinEventMutation({ eventId });
    } catch (err) {
      console.error('Failed to join event:', err);
    }
  };

  const handleLeaveEvent = async () => {
    try {
      await leaveEventMutation({ eventId });
    } catch (err) {
      console.error('Failed to leave event:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load event</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
            {...createButtonA11yProps('Go back')}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isAttending = event.userMembership?.role === 'ATTENDEE';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} {...createHeadingA11yProps(event.title, 1)}>
          {event.title}
        </Text>

        {event.description && (
          <Text style={styles.description}>{event.description}</Text>
        )}

        <View style={styles.details}>
          <Text style={styles.detailLabel}>Created</Text>
          <Text style={styles.detailValue}>
            {formatDateTime(event._creationTime)}
          </Text>
        </View>

        {event.chosenDateTime && (
          <View style={styles.details}>
            <Text style={styles.detailLabel}>Scheduled</Text>
            <Text style={styles.detailValue}>
              {formatDateTime(event.chosenDateTime)}
            </Text>
          </View>
        )}

        {event.location && (
          <View style={styles.details}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{event.location}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {isAttending ? (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleLeaveEvent}
              {...createButtonA11yProps('Leave event')}
            >
              <Text style={styles.secondaryButtonText}>Leave Event</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={handleJoinEvent}
              {...createButtonA11yProps('Join event')}
            >
              <Text style={styles.buttonText}>Join Event</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  details: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  actions: {
    marginTop: 32,
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  secondaryButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '600',
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
  errorText: {
    fontSize: 16,
    color: Colors.light.notification,
    textAlign: 'center',
    marginBottom: 20,
  },
});
