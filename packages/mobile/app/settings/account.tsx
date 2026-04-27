import { View, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { router } from 'expo-router';
import { useMutation } from 'convex/react';

import { useGlobalUser } from '@/context/global-user-context';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { signOut } from '@/lib/auth-client';
import { toast } from '@groupi/shared/platform';

import { UsernameSection } from '@/components/settings/username-section';
import { EmailSection } from '@/components/settings/email-section';
import { LinkedAccountsSection } from '@/components/settings/linked-accounts-section';
import { PasskeySection } from '@/components/settings/passkey-section';
import { ApiKeysSection } from '@/components/settings/api-keys-section';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

export default function AccountSettingsScreen() {
  const { user } = useGlobalUser();
  const deleteAccount = useMutation(api.users.mutations.deleteUserAccount);

  function handleDeleteAccount() {
    const username = user?.username as string;
    showConfirmDialog({
      title: 'Delete Account',
      message:
        'This will permanently delete your account and all associated data. This action cannot be undone.',
      confirmLabel: 'Delete Account',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteAccount({ confirmation: username });
          await signOut();
          router.replace('/(auth)/sign-in');
          toast.success('Account deleted');
        } catch {
          toast.error('Failed to delete account');
        }
      },
    });
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
            <CardTitle className='text-error'>Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className='mb-3 text-sm text-muted-foreground'>
              Once you delete your account, there is no going back. Please be
              certain.
            </Text>
            <Button variant='destructive' onPress={handleDeleteAccount}>
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
