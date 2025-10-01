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

// Create user from webhook parameters
export const CreateUserFromWebhookParams = z.object({
  id: PersonSchema.shape.id,
  firstName: PersonSchema.shape.firstName,
  lastName: PersonSchema.shape.lastName,
  username: PersonSchema.shape.username,
  imageUrl: PersonSchema.shape.imageUrl,
});

export type CreateUserFromWebhookParams = z.infer<
  typeof CreateUserFromWebhookParams
>;

// Update user from webhook parameters
export const UpdateUserFromWebhookParams = z.object({
  id: PersonSchema.shape.id,
  firstName: PersonSchema.shape.firstName.optional(),
  lastName: PersonSchema.shape.lastName.optional(),
  username: PersonSchema.shape.username.optional(),
  imageUrl: PersonSchema.shape.imageUrl.optional(),
});

export type UpdateUserFromWebhookParams = z.infer<
  typeof UpdateUserFromWebhookParams
>;

// Delete user from webhook parameters
export const DeleteUserFromWebhookParams = z.object({
  userId: PersonSchema.shape.id,
});

export type DeleteUserFromWebhookParams = z.infer<
  typeof DeleteUserFromWebhookParams
>;
