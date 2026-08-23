import { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useQuery, useMutation } from 'convex/react';

import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@groupi/shared/platform';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

type EmailEntry = {
  address: string;
  isPrimary: boolean;
  isVerified?: boolean;
  status: 'verified' | 'pending';
  expiresAt?: number;
};

export function EmailSection() {
  const [newEmail, setNewEmail] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);

  const successColor = useCSSVariable('--color-success') as string | undefined;
  const warningColor = useCSSVariable('--color-warning') as string | undefined;

  const emails = useQuery(api.emails.queries.getCurrentUserEmails, {});
  const emailAvailability = useQuery(
    api.emails.queries.checkEmailAvailability,
    newEmail.trim() ? { email: newEmail.trim() } : 'skip'
  );

  const requestAddEmail = useMutation(api.emails.mutations.requestAddEmail);
  const removeEmail = useMutation(api.emails.mutations.removeAdditionalEmail);
  const makePrimaryEmail = useMutation(api.emails.mutations.setPrimaryEmail);
  const resendVerification = useMutation(
    api.emails.mutations.resendVerificationEmail
  );

  async function handleAddEmail() {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    if (emailAvailability && !emailAvailability.available) {
      toast.error(emailAvailability.reason);
      return;
    }

    setIsAddingEmail(true);
    try {
      await requestAddEmail({ email });
      toast.success(`Verification email sent to ${email}`);
      setNewEmail('');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to send verification email'
      );
    } finally {
      setIsAddingEmail(false);
    }
  }

  function handleRemoveEmail(email: string) {
    showConfirmDialog({
      title: 'Remove Email Address',
      message: `Are you sure you want to remove ${email} from your account? This action cannot be undone.`,
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        try {
          await removeEmail({ email });
          toast.success('Email removed from your account');
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to remove email'
          );
        }
      },
    });
  }

  function handleMakePrimary(email: string) {
    showConfirmDialog({
      title: 'Change Primary Email',
      message: `Are you sure you want to make ${email} your primary email address? This will be used for account authentication and important notifications.`,
      confirmLabel: 'Make Primary',
      onConfirm: async () => {
        try {
          await makePrimaryEmail({ email });
          toast.success('Primary email updated');
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to update primary email'
          );
        }
      },
    });
  }

  async function handleResendVerification(email: string) {
    try {
      await resendVerification({ email });
      toast.success('Verification email resent');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to resend verification'
      );
    }
  }

  if (!emails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Addresses</CardTitle>
        </CardHeader>
        <CardContent className='items-center justify-center py-6'>
          <ActivityIndicator size='small' />
        </CardContent>
      </Card>
    );
  }

  const sortedEmails = [...emails.allEmails].sort(
    (a: EmailEntry, b: EmailEntry) => {
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      if (a.status === 'verified' && b.status === 'pending') return -1;
      if (a.status === 'pending' && b.status === 'verified') return 1;
      return 0;
    }
  );

  const canAddEmail = newEmail.trim() && emailAvailability?.available;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Addresses</CardTitle>
      </CardHeader>
      <CardContent className='gap-3'>
        {sortedEmails.map((email: EmailEntry) => (
          <View
            key={email.address}
            className='gap-2 rounded-input border border-border p-3'
          >
            <View className='flex-row items-center gap-2'>
              <Ionicons
                name={
                  email.status === 'verified' ? 'mail-outline' : 'time-outline'
                }
                size={16}
                color={
                  email.status === 'verified'
                    ? (successColor ?? '#22c55e')
                    : (warningColor ?? '#f59e0b')
                }
              />
              <Text className='flex-1 font-medium' numberOfLines={1}>
                {email.address}
              </Text>
            </View>

            <View className='flex-row flex-wrap items-center gap-2'>
              {email.isPrimary && (
                <Badge variant='default'>
                  <Text>Primary</Text>
                </Badge>
              )}
              {email.status === 'verified' && !email.isPrimary && (
                <Badge variant='secondary'>
                  <Text>Verified</Text>
                </Badge>
              )}
              {email.status === 'pending' && (
                <>
                  <Badge variant='outline'>
                    <Text className='text-text-warning'>Pending</Text>
                  </Badge>
                  {email.expiresAt ? (
                    <Text className='text-xs text-muted-foreground'>
                      Expires {new Date(email.expiresAt).toLocaleDateString()}
                    </Text>
                  ) : null}
                </>
              )}
            </View>

            <View className='flex-row items-center gap-2'>
              {email.status === 'pending' && (
                <Button
                  size='sm'
                  variant='outline'
                  onPress={() => handleResendVerification(email.address)}
                >
                  Resend
                </Button>
              )}
              {email.status === 'verified' && !email.isPrimary && (
                <Button
                  size='sm'
                  variant='outline'
                  onPress={() => handleMakePrimary(email.address)}
                >
                  Make Primary
                </Button>
              )}
              {!email.isPrimary && (
                <Button
                  size='sm'
                  variant='ghost'
                  onPress={() => handleRemoveEmail(email.address)}
                >
                  <Ionicons name='trash-outline' size={16} color='#ef4444' />
                </Button>
              )}
            </View>
          </View>
        ))}

        <Separator />

        <Text variant='small' className='font-medium'>
          Add Email Address
        </Text>
        <View className='flex-row items-center gap-2'>
          <View className='flex-1'>
            <Input
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder='Enter email address'
              keyboardType='email-address'
              autoCapitalize='none'
              autoCorrect={false}
            />
          </View>
          <Button
            onPress={handleAddEmail}
            disabled={!canAddEmail}
            isLoading={isAddingEmail}
            loadingText='Adding...'
            size='sm'
          >
            Add
          </Button>
        </View>
        {newEmail.trim() &&
          emailAvailability &&
          !emailAvailability.available && (
            <Text className='text-xs text-destructive'>
              {emailAvailability.reason}
            </Text>
          )}
        <Text variant='muted' className='text-xs'>
          A verification email will be sent to the address you provide.
        </Text>
      </CardContent>
    </Card>
  );
}
