import { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';

import { useGlobalUser } from '@/context/global-user-context';
import { Text } from '@/components/ui/text';
import { LabeledInput as Input } from '@/components/ui/labeled-input';
import { LabeledTextarea as Textarea } from '@/components/ui/labeled-textarea';
import { Button } from '@/components/ui/button';
import { getSafeAuthReturnPath } from '@/lib/auth-route-policy';

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

export default function OnboardingScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const {
    user,
    isAuthenticated,
    isLoading: isGlobalLoading,
    needsOnboarding,
  } = useGlobalUser();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Debounced username for availability check
  const [debouncedUsername, setDebouncedUsername] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username.trim().toLowerCase());
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  // Pre-populate display name from OAuth
  useEffect(() => {
    if (user?.name && !displayName) {
      setDisplayName(user.name as string);
    }
  }, [user?.name, displayName]);

  // Check availability
  const isValidForCheck =
    debouncedUsername.length >= 3 &&
    debouncedUsername.length <= 50 &&
    USERNAME_PATTERN.test(debouncedUsername);

  const availability = useQuery(
    api.users.queries.checkUsernameAvailability,
    isValidForCheck ? { username: debouncedUsername } : 'skip'
  );

  const completeOnboarding = useMutation(
    api.users.mutations.completeOnboarding
  );

  // Redirect if not needing onboarding
  useEffect(() => {
    if (!isGlobalLoading && isAuthenticated && needsOnboarding === false) {
      router.replace((getSafeAuthReturnPath(returnTo) ?? '/(tabs)') as Href);
    }
  }, [isGlobalLoading, isAuthenticated, needsOnboarding, returnTo]);

  const getUnameError = useCallback((): string | undefined => {
    const trimmed = username.trim();
    if (!trimmed) return undefined;
    if (trimmed.length < 3) return 'Username must be at least 3 characters';
    if (trimmed.length > 50) return 'Username must be at most 50 characters';
    if (!USERNAME_PATTERN.test(trimmed))
      return 'Only letters, numbers, underscores, and dashes';
    if (availability && !availability.available)
      return availability.reason ?? 'Username is taken';
    return undefined;
  }, [username, availability]);

  const usernameError = getUnameError();
  const isAvailable = availability?.available === true && !usernameError;

  async function handleSubmit() {
    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername || usernameError) return;

    setIsSubmitting(true);
    setError('');

    try {
      await completeOnboarding({
        username: trimmedUsername,
        displayName: displayName.trim() || undefined,
        pronouns: pronouns.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isGlobalLoading) {
    return (
      <SafeAreaView className='flex-1 items-center justify-center bg-background'>
        <ActivityIndicator size='large' />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <ScrollView
        className='flex-1 px-6'
        keyboardShouldPersistTaps='handled'
        contentContainerClassName='pb-8 pt-8'
      >
        <Text className='text-3xl font-bold text-foreground'>Welcome!</Text>
        <Text className='mt-2 text-base text-muted-foreground'>
          Let&apos;s set up your profile to get started.
        </Text>

        <View className='mt-8 gap-5'>
          <View>
            <Input
              label='Username *'
              placeholder='your_username'
              value={username}
              onChangeText={setUsername}
              autoCapitalize='none'
              autoCorrect={false}
              error={usernameError}
              helperText={isAvailable ? 'Username is available!' : undefined}
            />
          </View>

          <Input
            label='Display Name'
            placeholder='How others will see you'
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Input
            label='Pronouns'
            placeholder='e.g. she/her, he/him, they/them'
            value={pronouns}
            onChangeText={setPronouns}
          />

          <Textarea
            label='Bio'
            placeholder='Tell people a bit about yourself...'
            value={bio}
            onChangeText={setBio}
            maxLength={500}
          />

          {error ? (
            <Text className='text-sm text-text-error'>{error}</Text>
          ) : null}

          <Button
            onPress={handleSubmit}
            disabled={
              isSubmitting ||
              !username.trim() ||
              !!usernameError ||
              !isAvailable
            }
            className='mt-2'
          >
            <Text>{isSubmitting ? 'Setting up...' : 'Complete Setup'}</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
