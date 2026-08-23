import { useState, useEffect, useCallback, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useQuery, useMutation } from 'convex/react';

import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@groupi/shared/platform';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

interface UsernameSectionProps {
  currentUsername: string | null;
}

export function UsernameSection({ currentUsername }: UsernameSectionProps) {
  const [username, setUsername] = useState(currentUsername ?? '');
  const [availabilityStatus, setAvailabilityStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');
  const [usernameToCheck, setUsernameToCheck] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const originalUsernameRef = useRef(currentUsername);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const successColor = useCSSVariable('--color-success') as string | undefined;
  const errorColor = useCSSVariable('--color-error') as string | undefined;
  const mutedColor = useCSSVariable('--color-muted-foreground') as
    | string
    | undefined;

  const usernameAvailability = useQuery(
    api.users.queries.checkUsernameAvailability,
    usernameToCheck ? { username: usernameToCheck } : 'skip'
  );

  const updateProfile = useMutation(api.users.mutations.updateUserProfile);

  useEffect(() => {
    if (usernameAvailability) {
      setAvailabilityStatus(
        usernameAvailability.available ? 'available' : 'taken'
      );
    }
  }, [usernameAvailability]);

  const checkAvailability = useCallback((value: string) => {
    if (!value || value.trim() === '') {
      setAvailabilityStatus('idle');
      setUsernameToCheck(null);
      return;
    }

    if (value === originalUsernameRef.current) {
      setAvailabilityStatus('idle');
      setUsernameToCheck(null);
      return;
    }

    setAvailabilityStatus('checking');
    setUsernameToCheck(value.trim());
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const timer = setTimeout(() => {
      if (username) {
        checkAvailability(username);
      } else {
        setAvailabilityStatus('idle');
      }
    }, 500);

    debounceTimerRef.current = timer;

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [username, checkAvailability]);

  const hasChanges = username !== (originalUsernameRef.current ?? '');
  const canSave =
    hasChanges &&
    (availabilityStatus === 'available' || availabilityStatus === 'idle') &&
    username.trim().length >= 3;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await updateProfile({ username: username.trim() });
      originalUsernameRef.current = username.trim();
      setAvailabilityStatus('idle');
      setUsernameToCheck(null);
      toast.success('Username updated');
    } catch {
      toast.error('Failed to update username');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
      </CardHeader>
      <CardContent className='gap-3'>
        <Text variant='small' className='font-medium'>
          Username
        </Text>
        <View className='flex-row items-center gap-2'>
          <View className='flex-1'>
            <Input
              value={username}
              onChangeText={setUsername}
              placeholder='Enter username'
              autoCapitalize='none'
              autoCorrect={false}
            />
          </View>
          {availabilityStatus === 'checking' && (
            <ActivityIndicator size='small' color={mutedColor} />
          )}
          {availabilityStatus === 'available' && (
            <Ionicons
              name='checkmark-circle'
              size={20}
              color={successColor ?? '#22c55e'}
            />
          )}
          {availabilityStatus === 'taken' && (
            <Ionicons
              name='close-circle'
              size={20}
              color={errorColor ?? '#ef4444'}
            />
          )}
        </View>
        {availabilityStatus === 'available' && (
          <Text className='text-sm text-text-success'>
            {usernameAvailability?.reason ?? 'Username is available'}
          </Text>
        )}
        {availabilityStatus === 'taken' && (
          <Text className='text-sm text-text-error'>
            {usernameAvailability?.reason ?? 'Username is already taken'}
          </Text>
        )}
        {hasChanges && (
          <Button
            onPress={handleSave}
            disabled={!canSave}
            isLoading={isSaving}
            loadingText='Saving...'
          >
            Save Username
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
