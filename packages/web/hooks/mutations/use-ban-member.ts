'use client';

import { useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useCallback } from 'react';
import { toast } from 'sonner';

// Dynamic require to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let eventMutations: any;
function initApi() {
  if (!eventMutations) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    eventMutations = api.events?.mutations ?? {};
  }
}
initApi();

export function useBanMember() {
  const banMember = useMutation(eventMutations.banMember);

  return useCallback(
    async (membershipId: Id<'memberships'>, reason?: string) => {
      try {
        const result = await banMember({
          membershipId,
          reason,
        });

        toast.success('Member banned from event');
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to ban member';
        toast.error(message);
        throw error;
      }
    },
    [banMember]
  );
}
