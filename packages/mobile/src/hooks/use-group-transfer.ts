import { createGroupTransferHooks } from '@groupi/shared/hooks';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
export const { useGroupTransfer } = createGroupTransferHooks(api, {
  useQuery,
  useMutation,
});
