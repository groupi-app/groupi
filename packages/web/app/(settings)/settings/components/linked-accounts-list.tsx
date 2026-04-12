'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUnlinkAccount } from '@/hooks/convex/use-accounts';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { authClient } from '@/lib/auth-client';

type LinkedAccount = {
  id: string;
  providerId: string;
  username?: string;
  accountId?: string;
};

export function LinkedAccountsList({
  linkedAccounts,
  userEmail,
  onAccountsChanged,
}: {
  linkedAccounts: LinkedAccount[];
  userEmail: string;
  onAccountsChanged?: () => void;
}) {
  const [unlinkingAccountId, setUnlinkingAccountId] = useState<string | null>(
    null
  );
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [pendingUnlinkAccountId, setPendingUnlinkAccountId] = useState<
    string | null
  >(null);

  // Use Convex mutation for unlinking accounts
  const unlinkAccountMutation = useUnlinkAccount();

  // Listen for storage events to detect when account linking completes in another tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'account-linked' && e.newValue) {
        onAccountsChanged?.();
        // Clear the flag
        localStorage.removeItem('account-linked');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [onAccountsChanged]);

  const handleLinkAccount = async (provider: 'discord' | 'google') => {
    try {
      // Use Better Auth's linkSocial method
      // We need to intercept the redirect and open it in a new tab
      // Use relative URL to guarantee same-origin (avoids CORS issues from
      // NEXT_PUBLIC_BASE_URL mismatches like www vs non-www)
      const response = await fetch('/api/auth/link-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        redirect: 'manual', // Don't follow redirects, get the URL instead
        body: JSON.stringify({
          provider,
          callbackURL: '/settings/account',
        }),
      });

      // Check for redirect response (status 302, 301, etc.)
      if (response.status >= 300 && response.status < 400) {
        const redirectURL = response.headers.get('Location');
        if (redirectURL) {
          // Open the redirect URL in a new tab
          window.open(redirectURL, '_blank', 'noopener,noreferrer');
          return;
        }
      }

      // Handle error responses from the link-social endpoint
      if (response.status >= 400) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || '';
        const lowerMessage = errorMessage.toLowerCase();

        if (lowerMessage.includes('different emails')) {
          toast.error(
            'Cannot link this account because it uses a different email address. Please contact support if you need help.'
          );
        } else if (lowerMessage.includes('not linked')) {
          toast.error(
            'Unable to link this account. The account may already be associated with another user.'
          );
        } else {
          toast.error(errorMessage || 'Failed to link account');
        }
        return;
      }

      // If no redirect header, try to get URL from response body
      const data = await response.json().catch(() => null);
      if (data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
        return;
      }

      // Fallback: use the client method directly (will redirect in current tab)
      // This happens if the fetch approach doesn't work
      const { error } = await authClient.linkSocial({
        provider,
        callbackURL: '/settings/account',
      });

      if (error) {
        const message = error.message?.toLowerCase() || '';
        // Handle user cancellation gracefully - don't show error
        if (
          message.includes('cancel') ||
          message.includes('closed') ||
          message.includes('denied') ||
          message.includes('access_denied')
        ) {
          return;
        }
        toast.error(error.message || 'Failed to link account');
      }
    } catch (err) {
      toast.error('Failed to initiate account linking. Please try again.');
      console.error('Account linking error:', err);
    }
  };

  const handleUnlinkClick = (accountId: string) => {
    setPendingUnlinkAccountId(accountId);
    setUnlinkDialogOpen(true);
  };

  const handleUnlinkAccount = async () => {
    if (!pendingUnlinkAccountId) return;

    setUnlinkingAccountId(pendingUnlinkAccountId);
    setUnlinkDialogOpen(false);

    try {
      const result = await unlinkAccountMutation(pendingUnlinkAccountId);

      if (result.success) {
        onAccountsChanged?.();
      }
    } catch (error) {
      // Error handling is done in the hook via toast
      console.error('Unlink account error:', error);
    } finally {
      setUnlinkingAccountId(null);
      setPendingUnlinkAccountId(null);
    }
  };

  const getProviderDisplayName = (providerId: string) => {
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
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId.toLowerCase()) {
      case 'discord':
        return Icons.discord;
      case 'google':
        return Icons.google;
      default:
        return null;
    }
  };

  const linkedProviders = linkedAccounts.map((acc: LinkedAccount) =>
    acc.providerId.toLowerCase()
  );
  const hasDiscord = linkedProviders.includes('discord');
  const hasGoogle = linkedProviders.includes('google');

  const availableProviders = [
    {
      id: 'discord' as const,
      name: 'Discord',
      icon: Icons.discord,
      linked: hasDiscord,
    },
    {
      id: 'google' as const,
      name: 'Google',
      icon: Icons.google,
      linked: hasGoogle,
    },
  ].filter(provider => !provider.linked);

  const pendingAccount = pendingUnlinkAccountId
    ? linkedAccounts.find(
        (acc: LinkedAccount) => acc.id === pendingUnlinkAccountId
      )
    : null;
  const pendingProviderName = pendingAccount
    ? getProviderDisplayName(pendingAccount.providerId)
    : '';

  // Get remaining linked accounts (excluding the one being unlinked)
  const remainingAccounts = pendingUnlinkAccountId
    ? linkedAccounts.filter(
        (acc: LinkedAccount) => acc.id !== pendingUnlinkAccountId
      )
    : [];

  // Build the list of remaining auth methods
  const buildRemainingAuthMethodsMessage = () => {
    const methods: string[] = [];

    // Add remaining OAuth accounts
    remainingAccounts.forEach(account => {
      const providerName = getProviderDisplayName(account.providerId);
      if (account.providerId.toLowerCase() === 'discord' && account.username) {
        methods.push(`${providerName} (@${account.username})`);
      } else if (
        account.providerId.toLowerCase() === 'google' &&
        account.username
      ) {
        methods.push(`${providerName} (${account.username})`);
      } else {
        methods.push(providerName);
      }
    });

    // Add email/magic link if available
    if (userEmail) {
      methods.push(`your email address (${userEmail}) via magic link`);
    }

    if (methods.length === 0) {
      return 'Make sure you have another way to log in.';
    }

    if (methods.length === 1) {
      return `You can still log in through ${methods[0]}.`;
    }

    // Format multiple methods: "method1, method2, or method3"
    const lastMethod = methods.pop();
    return `You can still log in through ${methods.join(', ')}, or through ${lastMethod}.`;
  };

  return (
    <>
      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unlink {pendingProviderName} Account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {buildRemainingAuthMethodsMessage()} Are you sure you want to
              unlink this account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlinkAccount}>
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {linkedAccounts.length > 0 ? (
            <div className='space-y-2'>
              {linkedAccounts.map((account: LinkedAccount) => {
                const Icon = getProviderIcon(account.providerId);
                return (
                  <div
                    key={account.id}
                    className='flex items-center justify-between p-3 border rounded-md'
                  >
                    <div className='flex items-center gap-2'>
                      {Icon && <Icon className='size-5' />}
                      <span className='font-medium'>
                        {getProviderDisplayName(account.providerId)}
                      </span>
                      <span className='text-sm text-muted-foreground'>
                        {account.providerId.toLowerCase() === 'discord' &&
                        account.username
                          ? `@${account.username}`
                          : account.providerId.toLowerCase() === 'google' &&
                              account.username
                            ? account.username
                            : 'Connected'}
                      </span>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => handleUnlinkClick(account.id)}
                      isLoading={unlinkingAccountId === account.id}
                      loadingText='Unlinking...'
                    >
                      Unlink
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>No linked accounts</p>
          )}

          <div>
            {availableProviders.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full sm:w-auto'
                    icon={<Icons.plus className='size-4' />}
                  >
                    Link Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start'>
                  {availableProviders.map(provider => {
                    const ProviderIcon = provider.icon;
                    return (
                      <DropdownMenuItem
                        key={provider.id}
                        onClick={() => handleLinkAccount(provider.id)}
                        className='cursor-pointer'
                      >
                        <ProviderIcon className='size-4 mr-2' />
                        Link {provider.name}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <p className='text-sm text-muted-foreground'>
                All available accounts are linked
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
