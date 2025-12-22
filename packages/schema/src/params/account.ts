/* eslint-disable no-redeclare */
import { z } from 'zod';

// ============================================================================
// ACCOUNT DOMAIN PARAMETER SCHEMAS
// ============================================================================

// Fetch account settings parameters
export const GetAccountSettingsParams = z.object({});

export type GetAccountSettingsParams = z.infer<typeof GetAccountSettingsParams>;

// Check username availability parameters
export const CheckUsernameAvailabilityParams = z.object({
  username: z.string().min(1),
});

export type CheckUsernameAvailabilityParams = z.infer<
  typeof CheckUsernameAvailabilityParams
>;

// Update account settings parameters
export const UpdateAccountSettingsParams = z.object({
  username: z.string().nullable().optional(),
  email: z.string().email().optional(),
});

export type UpdateAccountSettingsParams = z.infer<
  typeof UpdateAccountSettingsParams
>;

// Unlink account parameters
export const UnlinkAccountParams = z.object({
  accountId: z.string(),
});

export type UnlinkAccountParams = z.infer<typeof UnlinkAccountParams>;

// Delete account parameters
export const DeleteAccountParams = z.object({});

export type DeleteAccountParams = z.infer<typeof DeleteAccountParams>;

// Update profile parameters
export const UpdateProfileParams = z.object({
  name: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  imageKey: z.string().nullable().optional(),
  pronouns: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  oldImageKey: z.string().nullable().optional(),
});

export type UpdateProfileParams = z.infer<typeof UpdateProfileParams>;
