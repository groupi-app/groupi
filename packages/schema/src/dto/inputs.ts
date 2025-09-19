import { z } from 'zod';
import {
  NotificationMethodTypeSchema,
  NotificationTypeSchema,
  WebhookFormatSchema,
} from '../generated';

// ============================================================================
// SETTINGS INPUT SCHEMAS
// ============================================================================

export const UpdateUserSettingsInputSchema = z.object({
  notificationMethods: z.array(
    z.object({
      id: z.string().optional(),
      type: NotificationMethodTypeSchema,
      name: z.string().optional(),
      value: z.string(),
      enabled: z.boolean(),
      notifications: z.array(
        z.object({
          notificationType: NotificationTypeSchema,
          enabled: z.boolean(),
        })
      ),
      // Webhook-specific fields
      webhookFormat: WebhookFormatSchema.optional(),
      customTemplate: z.string().optional(),
      webhookHeaders: z.string().optional(), // JSON string
    })
  ),
});

export type UpdateUserSettingsInput = z.infer<
  typeof UpdateUserSettingsInputSchema
>;

// ============================================================================
// EVENT INPUT SCHEMAS
// ============================================================================

export const CreateEventInputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  dateTime: z.string().optional(),
  potentialDateTimes: z.array(z.string()).optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

export const UpdateEventDetailsInputSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
});

export type UpdateEventDetailsInput = z.infer<
  typeof UpdateEventDetailsInputSchema
>;

// ============================================================================
// POST INPUT SCHEMAS
// ============================================================================

export const CreatePostInputSchema = z.object({
  title: z.string(),
  content: z.string(),
  eventId: z.string(),
});

export type CreatePostInput = z.infer<typeof CreatePostInputSchema>;

export const UpdatePostInputSchema = z.object({
  postId: z.string(),
  title: z.string(),
  content: z.string(),
});

export type UpdatePostInput = z.infer<typeof UpdatePostInputSchema>;

// ============================================================================
// REPLY INPUT SCHEMAS
// ============================================================================

export const CreateReplyInputSchema = z.object({
  content: z.string(),
  postId: z.string(),
});

export type CreateReplyInput = z.infer<typeof CreateReplyInputSchema>;

export const UpdateReplyInputSchema = z.object({
  replyId: z.string(),
  content: z.string(),
});

export type UpdateReplyInput = z.infer<typeof UpdateReplyInputSchema>;

// ============================================================================
// INVITE INPUT SCHEMAS
// ============================================================================

export const CreateInviteInputSchema = z.object({
  eventId: z.string(),
  inviteeName: z.string().optional(),
});

export type CreateInviteInput = z.infer<typeof CreateInviteInputSchema>;

// ============================================================================
// AVAILABILITY INPUT SCHEMAS
// ============================================================================

export const UpdateAvailabilityInputSchema = z.object({
  potentialDateTimeId: z.string(),
  available: z.boolean(),
});

export type UpdateAvailabilityInput = z.infer<
  typeof UpdateAvailabilityInputSchema
>;

export const UpdateMemberAvailabilitiesInputSchema = z.object({
  eventId: z.string(),
  availabilityUpdates: z.array(UpdateAvailabilityInputSchema),
});

export type UpdateMemberAvailabilitiesInput = z.infer<
  typeof UpdateMemberAvailabilitiesInputSchema
>;
