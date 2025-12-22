/* eslint-disable no-redeclare */
import { z } from 'zod';
import { UserSchema, AccountSchema } from '../generated';

// ============================================================================
// ACCOUNT DOMAIN DATA TYPES
// ============================================================================

// Linked account data (OAuth providers)
export const LinkedAccountData = AccountSchema.pick({
  id: true,
  providerId: true,
  accountId: true,
  createdAt: true,
}).extend({
  username: z.string().nullable().optional(),
});

export type LinkedAccountData = z.infer<typeof LinkedAccountData>;

// Account settings data
export const AccountSettingsData = UserSchema.pick({
  id: true,
  username: true,
  email: true,
}).extend({
  linkedAccounts: z.array(LinkedAccountData),
});

export type AccountSettingsData = z.infer<typeof AccountSettingsData>;

// Username availability response
export const UsernameAvailabilityData = z.object({
  available: z.boolean(),
});

export type UsernameAvailabilityData = z.infer<typeof UsernameAvailabilityData>;
