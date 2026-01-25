'use client';

import { useQuery, useMutation, useAction } from 'convex/react';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let accountQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let accountMutations: any;

function initApi() {
  if (!accountQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    accountQueries = api.accounts?.queries ?? {};
    accountMutations = api.accounts?.mutations ?? {};
  }
}
initApi();

type LinkedAccount = {
  id: string;
  providerId: string;
  accountId: string;
  username?: string;
  createdAt: number;
};

/**
 * Get all linked accounts for the current user
 * Uses an action to fetch Discord usernames from Discord API
 */
export function useLinkedAccounts() {
  const [accounts, setAccounts] = useState<LinkedAccount[] | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const fetchAccounts = useAction(
    accountQueries.getLinkedAccountsWithUsernames
  );

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
  }, [fetchAccounts]);

  // Return undefined while loading to match useQuery behavior
  return isLoading ? undefined : accounts;
}

/**
 * Check which providers the user has linked
 */
export function useHasLinkedProviders() {
  return useQuery(accountQueries.hasLinkedProvider, {});
}

/**
 * Unlink an OAuth account
 */
export function useUnlinkAccount() {
  const unlinkAccount = useMutation(accountMutations.unlinkAccount);
  const { toast } = useToast();

  return useCallback(
    async (accountId: string) => {
      try {
        await unlinkAccount({ accountId });

        toast({
          title: 'Account Unlinked',
          description: 'The account has been successfully unlinked.',
        });

        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to unlink account. Please try again.';

        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });

        return { success: false, error: message };
      }
    },
    [unlinkAccount, toast]
  );
}

/**
 * Combined hook for account management
 */
export function useAccountManagement() {
  const linkedAccounts = useLinkedAccounts();
  const providers = useHasLinkedProviders();
  const unlinkAccount = useUnlinkAccount();

  return {
    // Data
    linkedAccounts: linkedAccounts ?? [],
    hasDiscord: providers?.discord ?? false,
    hasGoogle: providers?.google ?? false,

    // Loading state
    isLoading: linkedAccounts === undefined,

    // Actions
    unlinkAccount,
  };
}
