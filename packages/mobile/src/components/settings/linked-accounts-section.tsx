import { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAction, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { useActionMenu } from '@/components/ui/action-menu';
import { getPublicBaseUrl } from '@/lib/public-urls';
import { toast } from '@groupi/shared/platform';
import { Ionicons } from '@expo/vector-icons';

type LinkedAccount = {
  id: string;
  providerId: string;
  accountId: string;
  username?: string;
  createdAt: number;
};

function getProviderDisplayName(providerId: string): string {
  switch (providerId.toLowerCase()) {
    case 'discord':
      return 'Discord';
    case 'google':
      return 'Google';
    case 'credential':
      return 'Email/Password';
    default:
      return providerId;
  }
}

function getProviderIcon(providerId: string): keyof typeof Ionicons.glyphMap {
  switch (providerId.toLowerCase()) {
    case 'discord':
      return 'logo-discord';
    case 'google':
      return 'logo-google';
    default:
      return 'link-outline';
  }
}

export function LinkedAccountsSection() {
  const [accounts, setAccounts] = useState<LinkedAccount[] | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const { showActionMenu } = useActionMenu();

  const fetchAccounts = useAction(
    api.accounts.queries.getLinkedAccountsWithUsernames
  );
  const unlinkAccountMutation = useMutation(
    api.accounts.mutations.unlinkAccount
  );

  const refetch = useCallback(() => {
    setFetchKey(k => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchAccounts({});
        if (!cancelled) {
          setAccounts(result);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch linked accounts:', error);
        if (!cancelled) {
          setAccounts([]);
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [fetchAccounts, fetchKey]);

  function handleUnlinkClick(account: LinkedAccount) {
    const providerName = getProviderDisplayName(account.providerId);
    showConfirmDialog({
      title: `Unlink ${providerName} Account?`,
      message:
        'Make sure you have another way to log in before unlinking this account.',
      confirmLabel: 'Unlink',
      destructive: true,
      onConfirm: async () => {
        setUnlinkingId(account.id);
        try {
          await unlinkAccountMutation({ accountId: account.id });
          toast.success(`${providerName} account unlinked`);
          refetch();
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to unlink account'
          );
        } finally {
          setUnlinkingId(null);
        }
      },
    });
  }

  function handleLinkAccount() {
    const linkedProviders = (accounts ?? []).map(a =>
      a.providerId.toLowerCase()
    );
    const availableProviders: {
      id: string;
      name: string;
      linked: boolean;
    }[] = [
      {
        id: 'discord',
        name: 'Discord',
        linked: linkedProviders.includes('discord'),
      },
      {
        id: 'google',
        name: 'Google',
        linked: linkedProviders.includes('google'),
      },
    ].filter(p => !p.linked);

    if (availableProviders.length === 0) {
      toast.info('All available accounts are linked');
      return;
    }

    showActionMenu({
      title: 'Link Account',
      message: 'Select a provider to link',
      options: availableProviders.map(provider => ({
        label: `Link ${provider.name}`,
        onPress: () => {
          toast.info(
            `To link your ${provider.name} account, please use the web app at ${getPublicBaseUrl()}/settings/account`
          );
        },
      })),
    });
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
        </CardHeader>
        <CardContent className='items-center justify-center py-6'>
          <ActivityIndicator size='small' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Accounts</CardTitle>
      </CardHeader>
      <CardContent className='gap-3'>
        {accounts && accounts.length > 0 ? (
          accounts.map(account => (
            <View
              key={account.id}
              className='flex-row items-center justify-between rounded-input border border-border p-3'
            >
              <View className='flex-row items-center gap-2'>
                <Ionicons
                  name={getProviderIcon(account.providerId)}
                  size={20}
                  color='#6b7280'
                />
                <View>
                  <Text className='font-medium'>
                    {getProviderDisplayName(account.providerId)}
                  </Text>
                  <Text className='text-sm text-muted-foreground'>
                    {account.providerId.toLowerCase() === 'discord' &&
                    account.username
                      ? `@${account.username}`
                      : account.providerId.toLowerCase() === 'google' &&
                          account.username
                        ? account.username
                        : 'Connected'}
                  </Text>
                </View>
              </View>
              <Button
                size='sm'
                variant='outline'
                onPress={() => handleUnlinkClick(account)}
                isLoading={unlinkingId === account.id}
                loadingText='...'
              >
                Unlink
              </Button>
            </View>
          ))
        ) : (
          <Text className='text-sm text-muted-foreground'>
            No linked accounts
          </Text>
        )}

        <Button variant='outline' onPress={handleLinkAccount}>
          <Ionicons name='add' size={16} color='#6b7280' />
          <Text>Link Account</Text>
        </Button>
      </CardContent>
    </Card>
  );
}
