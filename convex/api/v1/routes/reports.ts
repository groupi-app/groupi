import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import { ErrorResponseSchema } from '../schemas/common';
import {
  CreateReportRequestSchema,
  ReportCreateResponseSchema,
} from '../schemas/reports';

// Type for Hono app with Convex context
type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createReportRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // POST /reports - Create report
  const createReportRoute = createRoute({
    method: 'post',
    path: '/reports',
    tags: ['Reports'],
    summary: 'Create report',
    description: 'Report content for review by administrators',
    security: [{ apiKey: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateReportRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Report created',
        content: {
          'application/json': {
            schema: ReportCreateResponseSchema,
          },
        },
      },
      400: {
        description: 'Bad request - duplicate report',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(createReportRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const body = c.req.valid('json');

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const createFn = internal.api.v1.internal.reports.createReport;
      const result = await ctx.runMutation(createFn, {
        personId,
        targetType: body.targetType,
        targetId: body.targetId,
        reason: body.reason,
        details: body.details,
      });

      return c.json(
        {
          success: true as const,
          data: {
            reportId: result.reportId,
          },
        },
        201
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create report';
      return c.json(
        {
          success: false as const,
          error: { code: 'BAD_REQUEST', message },
        },
        400
      );
    }
  });

  return app;
}
