/* eslint-disable no-redeclare */
import { z } from 'zod';
import { PersonSchema } from '../generated';

// ============================================================================
// PERSON DOMAIN PARAMETER SCHEMAS
// ============================================================================

// Get person data parameters
export const GetPersonDataParams = z.object({
  personId: PersonSchema.shape.id,
});

export type GetPersonDataParams = z.infer<typeof GetPersonDataParams>;

// Get user dashboard data parameters
export const GetUserDashboardDataParams = z.object({});

export type GetUserDashboardDataParams = z.infer<
  typeof GetUserDashboardDataParams
>;

// NOTE: CreateUserParams and UpdateUserParams have been removed.
// Person table no longer has firstName, lastName, username, imageUrl fields.
// User creation/updates should use Better Auth admin APIs (createUserAdmin, updateUserAdmin)
// which properly handle both User (auth data) and Person (app data) records.

// Delete user parameters
export const DeleteUserParams = z.object({
  userId: PersonSchema.shape.id,
});

export type DeleteUserParams = z.infer<typeof DeleteUserParams>;

// Get user profile parameters
export const GetUserProfileParams = z.object({
  userId: PersonSchema.shape.id,
});

export type GetUserProfileParams = z.infer<typeof GetUserProfileParams>;
