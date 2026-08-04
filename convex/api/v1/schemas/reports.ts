import { z, extendZodWithOpenApi } from '@hono/zod-openapi';
extendZodWithOpenApi(z);
import { TimestampSchema } from './common';

/**
 * Report-related API schemas
 */

// Report target type enum
export const ReportTargetTypeSchema = z
  .enum(['USER', 'EVENT', 'POST', 'REPLY'])
  .openapi({
    example: 'POST',
    description: 'The type of content being reported',
  });

// Report reason enum
export const ReportReasonSchema = z
  .enum([
    'SPAM',
    'HARASSMENT',
    'HATE_SPEECH',
    'INAPPROPRIATE_CONTENT',
    'IMPERSONATION',
    'OTHER',
  ])
  .openapi({
    example: 'SPAM',
    description: 'Reason for the report',
  });

// Report status enum
export const ReportStatusSchema = z
  .enum(['PENDING', 'DISMISSED', 'ACTION_TAKEN'])
  .openapi({
    example: 'PENDING',
    description: 'Current status of the report',
  });

// Report summary
export const ReportSummarySchema = z
  .object({
    id: z.string(),
    reporterId: z.string(),
    targetType: ReportTargetTypeSchema,
    targetId: z.string(),
    reason: ReportReasonSchema,
    details: z.string().nullable(),
    status: ReportStatusSchema,
    createdAt: TimestampSchema,
  })
  .openapi('ReportSummary');

// Create report request body
export const CreateReportRequestSchema = z
  .object({
    targetType: ReportTargetTypeSchema.openapi({
      description: 'Type of content being reported',
    }),
    targetId: z.string().openapi({
      example: 'k170xyz...',
      description: 'ID of the content being reported',
    }),
    reason: ReportReasonSchema.openapi({
      description: 'Reason for reporting',
    }),
    details: z.string().max(2000).optional().openapi({
      example: 'This post contains spam links',
      description: 'Additional details about the report',
    }),
  })
  .openapi('CreateReportRequest');

// Report create response
export const ReportCreateResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      reportId: z.string(),
    }),
  })
  .openapi('ReportCreateResponse');
