import { createAccountResolutionHooks } from '@groupi/shared/hooks';
import { useQuery, useMutation, usePaginatedQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
export const {
  useAccountRecipients,
  useAccountResponsibilities,
  useAccountReadiness,
  useAccountResolutionActions,
} = createAccountResolutionHooks(api, {
  useQuery,
  useMutation,
  usePaginatedQuery,
  useRecipientPagination: usePaginatedQuery,
});
