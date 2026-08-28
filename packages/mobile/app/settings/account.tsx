import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { router } from 'expo-router';
import { useMutation } from 'convex/react';

import { useGlobalUser } from '@/context/global-user-context';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { LabeledInput } from '@/components/ui/labeled-input';
import { signOut } from '@/lib/auth-client';
import { toast } from '@groupi/shared/platform';

import { UsernameSection } from '@/components/settings/username-section';
import { EmailSection } from '@/components/settings/email-section';
import { LinkedAccountsSection } from '@/components/settings/linked-accounts-section';
import { PasskeySection } from '@/components/settings/passkey-section';
import { ApiKeysSection } from '@/components/settings/api-keys-section';

import { api } from 'convex/_generated/api';

export default function AccountSettingsScreen() {
  const { user } = useGlobalUser();
  const deleteAccount = useMutation(api.users.mutations.deleteUserAccount);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const username = (user?.username as string | undefined) ?? '';
  const usernameMatches =
    Boolean(username) &&
    confirmation.trim().toLowerCase() === username.trim().toLowerCase();

  async function handleDeleteAccount() {
    if (!usernameMatches || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteAccount({ confirmation });
      await signOut();
      router.replace('/(auth)/sign-in');
      toast.success('Account deleted');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete account'
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-row items-center px-4 py-3'>
        <BackButton />
        <Text className='text-lg font-semibold text-foreground'>Account</Text>
      </View>

      <ScrollView
        className='flex-1 px-4'
        contentContainerClassName='gap-6 pb-8'
      >
        <UsernameSection currentUsername={(user?.username as string) ?? null} />

        <EmailSection />

        <LinkedAccountsSection />

        <PasskeySection />

        <ApiKeysSection />

        {/* Danger Zone */}
        <Card>
          <CardHeader>
            <CardTitle className='text-text-error'>Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className='mb-3 text-sm text-muted-foreground'>
              Once you delete your account, there is no going back. Please be
              certain.
            </Text>
            {showDeleteConfirmation ? (
              <View className='gap-3'>
                <LabeledInput
                  label={`Type ${username || 'your username'} to confirm`}
                  value={confirmation}
                  onChangeText={setConfirmation}
                  autoCapitalize='none'
                  autoCorrect={false}
                  editable={!isDeleting}
                />
                <View className='flex-row gap-3'>
                  <Button
                    variant='outline'
                    className='flex-1'
                    disabled={isDeleting}
                    onPress={() => {
                      setShowDeleteConfirmation(false);
                      setConfirmation('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='destructive'
                    className='flex-1'
                    onPress={handleDeleteAccount}
                    disabled={!usernameMatches}
                    isLoading={isDeleting}
                    loadingText='Deleting...'
                  >
                    Delete Forever
                  </Button>
                </View>
              </View>
            ) : (
              <Button
                variant='destructive'
                onPress={() => setShowDeleteConfirmation(true)}
              >
                Delete Account
              </Button>
            )}
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
