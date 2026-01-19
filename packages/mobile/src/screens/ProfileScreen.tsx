/**
 * Profile Screen - React Native implementation
 * Uses shared user hooks from @groupi/shared
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

// Import shared business logic
import { createAuthHooks } from '@groupi/shared/hooks';
import {
  generateInitials,
  createButtonA11yProps,
  createHeadingA11yProps,
} from '@groupi/shared';

import { Colors } from '../theme/colors';
import type { RootStackParamList } from '../App';
import type { ConvexApi } from '@groupi/shared/hooks';

// Placeholder API until Convex is integrated - returns empty hooks for now

const mockApi = {} as ConvexApi;
const authHooks = createAuthHooks(mockApi);

type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;

export function ProfileScreen() {
  // route.params?.userId could be used to fetch a specific user profile
  // For now, we only show the current user's profile
  void useRoute<ProfileScreenRouteProp>();
  void useNavigation();

  // Use shared hooks
  const currentUser = authHooks.useCurrentUser();
  const logoutFn = authHooks.useLogout();

  // For now, we'll show current user profile
  // In a full implementation, we'd fetch the specific user if userId is provided
  const user = currentUser;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logoutFn();
            // Navigation will be handled by auth state change in App.tsx
          } catch (_error) {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    // TODO: Implement edit profile functionality
    Alert.alert('Coming Soon', 'Profile editing will be available soon!');
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = generateInitials(user.firstName, user.lastName);
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name} {...createHeadingA11yProps(fullName, 1)}>
            {fullName}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>First Name</Text>
            <Text style={styles.infoValue}>{user.firstName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Name</Text>
            <Text style={styles.infoValue}>{user.lastName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          {user.timezone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Timezone</Text>
              <Text style={styles.infoValue}>{user.timezone}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
            {...createButtonA11yProps('Edit profile')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            {...createButtonA11yProps('Sign out')}
          >
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: Colors.light.secondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.light.secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  actions: {
    gap: 16,
  },
  editButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.notification,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: Colors.light.notification,
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
});
