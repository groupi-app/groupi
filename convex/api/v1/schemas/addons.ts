import { z } from '@hono/zod-openapi';
import { TimestampSchema } from './common';

/**
 * Add-on related API schemas
 */

// Addon type path parameter
export const AddonTypeParamSchema = z.object({
  addonType: z.string().openapi({
    example: 'questionnaire',
    description: 'Add-on type identifier',
  }),
});

// Addon type + event ID path parameters (combined for nested routes)
export const EventAddonParamSchema = z.object({
  eventId: z.string().openapi({
    example: 'k170xyz...',
    description: 'Event ID',
  }),
  addonType: z.string().openapi({
    example: 'questionnaire',
    description: 'Add-on type identifier',
  }),
});

// Addon type + event ID + data key path parameters
export const EventAddonDataKeyParamSchema = z.object({
  eventId: z.string().openapi({
    example: 'k170xyz...',
    description: 'Event ID',
  }),
  addonType: z.string().openapi({
    example: 'questionnaire',
    description: 'Add-on type identifier',
  }),
  key: z.string().openapi({
    example: 'response:abc123',
    description: 'Data entry key',
  }),
});

// Freeform config object — validated by addon handler
export const AddonConfigSchema = z.record(z.string(), z.unknown()).openapi({
  description: `Freeform JSON config object. Shape depends on addon type:

- **reminders**: \`{ reminderOffset: "1_HOUR" | "1_DAY" | "2_DAYS" | ... }\`
- **questionnaire**: \`{ questions: [{ id: string, type: "text" | "single_choice" | "multi_choice", label: string, required?: boolean, options?: string[] }] }\`
- **bring-list**: \`{ items: [{ id: string, name: string, quantity: number }] }\`
- **discord**: \`{ guildId: string, guildName: string }\`

Config is validated server-side by the addon's handler.`,
  example: {
    questions: [
      {
        id: 'q1',
        type: 'text',
        label: 'Dietary restrictions?',
        required: true,
      },
    ],
  },
});

// Enable addon request body
export const EnableAddonRequestSchema = z
  .object({
    config: AddonConfigSchema,
  })
  .openapi('EnableAddonRequest');

// Update addon config request body
export const UpdateAddonConfigRequestSchema = z
  .object({
    config: AddonConfigSchema,
  })
  .openapi('UpdateAddonConfigRequest');

// Set addon data request body
export const SetAddonDataRequestSchema = z
  .object({
    data: z.unknown().openapi({
      description: 'Arbitrary data payload for this addon entry',
      example: { answer: 'No dietary restrictions' },
    }),
  })
  .openapi('SetAddonDataRequest');

// Addon config response object
export const AddonConfigResponseSchema = z
  .object({
    id: z.string(),
    addonType: z.string(),
    enabled: z.boolean(),
    config: z.unknown(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .openapi('AddonConfig');

// Addon list response
export const AddonListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(AddonConfigResponseSchema),
  })
  .openapi('AddonListResponse');

// Single addon config response
export const AddonConfigSingleResponseSchema = z
  .object({
    success: z.literal(true),
    data: AddonConfigResponseSchema,
  })
  .openapi('AddonConfigResponse');

// Addon data entry response object
export const AddonDataEntrySchema = z
  .object({
    id: z.string(),
    key: z.string(),
    data: z.unknown(),
    createdBy: z.string().nullable(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .openapi('AddonDataEntry');

// Addon data list response
export const AddonDataListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(AddonDataEntrySchema),
  })
  .openapi('AddonDataListResponse');

// Addon data single response
export const AddonDataSingleResponseSchema = z
  .object({
    success: z.literal(true),
    data: AddonDataEntrySchema,
  })
  .openapi('AddonDataResponse');

// Success message response (for enable/disable/delete)
export const AddonSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({ message: z.string() }),
  })
  .openapi('AddonSuccessResponse');
