import { View, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { router } from 'expo-router';
import { useMutation } from 'convex/react';

import { useGlobalUser } from '@/context/global-user-context';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { signOut } from '@/lib/auth-client';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

export default function AccountSettingsScreen() {
  const { user, person } = useGlobalUser();
  const deleteAccount = useMutation(api.users.mutations.deleteUserAccount);

  function handleDeleteAccount() {
    const username = user?.username as string;
    showConfirmDialog({
      title: 'Delete Account',
      message: `This will permanently delete your account and all associated data. This action cannot be undone.`,
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

      <ScrollView className='flex-1 px-4' contentContainerClassName='pb-8'>
        {/* Account info */}
        <View className='gap-4 pt-4'>
          <InfoRow label='Email' value={(user?.email as string) ?? 'Not set'} />
          <InfoRow
            label='Username'
            value={user?.username ? `@${user.username as string}` : 'Not set'}
          />
          <InfoRow
            label='Display Name'
            value={(user?.name as string) ?? 'Not set'}
          />
          <InfoRow
            label='Pronouns'
            value={(person?.pronouns as string) ?? 'Not set'}
          />
        </View>

        {/* Danger zone */}
        <View className='mt-12'>
          <Text className='mb-3 text-base font-semibold text-error'>
            Danger Zone
          </Text>
          <Button variant='destructive' onPress={handleDeleteAccount}>
            Delete Account
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className='border-b border-border py-3'>
      <Text className='text-sm text-muted-foreground'>{label}</Text>
      <Text className='mt-1 text-base text-foreground'>{value}</Text>
    </View>
  );
}
