import { z, extendZodWithOpenApi } from '@hono/zod-openapi';
extendZodWithOpenApi(z);
import { TimestampSchema, UserSummarySchema } from './common';
import { ReportSummarySchema } from './reports';

/**
 * Admin-related API schemas
 */

// Admin user summary (includes person data)
export const AdminUserSummarySchema = z
  .object({
    userId: z.string(),
    user: UserSummarySchema,
    person: z
      .object({
        id: z.string(),
        bio: z.string().nullable(),
        pronouns: z.string().nullable(),
      })
      .nullable(),
    createdAt: TimestampSchema,
  })
  .openapi('AdminUserSummary');

// Admin event summary
export const AdminEventSummarySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    location: z.string().nullable(),
    creatorId: z.string(),
    memberCount: z.number().int(),
    chosenDateTime: TimestampSchema.nullable(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  })
  .openapi('AdminEventSummary');

// Set user role request
export const SetUserRoleRequestSchema = z
  .object({
    role: z.enum(['user', 'admin']).openapi({
      example: 'admin',
      description: 'The role to assign to the user',
    }),
  })
  .openapi('SetUserRoleRequest');

// User ID parameter
export const UserIdParamSchema = z.object({
  userId: z.string().openapi({
    example: 'abc123...',
    description: 'Better Auth user ID',
  }),
});

// Admin user list response
export const AdminUserListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(AdminUserSummarySchema),
  })
  .openapi('AdminUserListResponse');

// Admin event list response
export const AdminEventListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(AdminEventSummarySchema),
  })
  .openapi('AdminEventListResponse');

// Admin report list response
export const AdminReportListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(ReportSummarySchema),
  })
  .openapi('AdminReportListResponse');
