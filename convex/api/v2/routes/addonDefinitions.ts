import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { DefinitionDocumentSchema } from '../../../addonTemplates/definition';
import { ErrorResponseSchema } from '../schemas/common';
type Variables = { ctx: ActionCtx; userId: string; personId: string };
const params = z.object({ id: z.string().min(1) });
const version = z.number().int().positive();
const versionBody = z.object({ expectedVersion: version }).strict();
const output = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  iconName: z.string(),
  template: z.unknown(),
  version: z.number(),
  isPublished: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
const response = (schema: z.ZodType) => ({
  description: 'Template definition',
  content: { 'application/json': { schema } },
});
const validationError = z.object({
  error: z.object({
    code: z.literal('VALIDATION_ERROR'),
    message: z.string(),
    issues: z
      .array(z.object({ path: z.string(), message: z.string() }))
      .optional(),
  }),
});
const errors = {
  400: response(validationError),
  401: response(ErrorResponseSchema),
  404: response(ErrorResponseSchema),
  409: response(ErrorResponseSchema),
};
const body = (schema: z.ZodType) => ({
  required: true,
  content: { 'application/json': { schema } },
});
const common = { tags: ['Add-on authoring'], security: [{ apiKey: [] }] };
export function createAddonDefinitionRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: (result, c) => {
      if (result.success) return;
      const issues = result.error.issues.slice(0, 10).map(issue => ({
        path: issue.path
          .map(segment => String(segment))
          .join('.')
          .slice(0, 200),
        message: (issue.code === 'unrecognized_keys'
          ? 'Unknown fields are not supported'
          : issue.message
        ).slice(0, 240),
      }));
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid template definition; correct the listed fields.',
            issues,
          },
        },
        400
      );
    },
  });
  app.openapi(
    createRoute({
      ...common,
      method: 'get',
      path: '/addon-template-definitions',
      summary: 'List owned draft and published definitions',
      request: {
        query: z.object({
          limit: z.coerce.number().int().min(1).max(100).default(20),
          cursor: z.string().min(1).optional(),
        }),
      },
      responses: {
        200: response(
          z.object({
            items: z.array(output),
            nextCursor: z.string().nullable(),
          })
        ),
        ...errors,
      },
    }),
    async c => {
      const q = c.req.valid('query');
      const result = await c
        .get('ctx')
        .runQuery(internal.addonTemplates.rest.list, {
          personId: c.get('personId') as Id<'persons'>,
          limit: q.limit,
          cursor: q.cursor ?? null,
        });
      return c.json(result, 200);
    }
  );
  app.openapi(
    createRoute({
      ...common,
      method: 'get',
      path: '/addon-template-definitions/{id}',
      summary: 'Read an owned definition',
      request: { params },
      responses: { 200: response(output), ...errors },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.addonTemplates.rest.get, {
          personId: c.get('personId'),
          id: c.req.valid('param').id,
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      ...common,
      method: 'post',
      path: '/addon-template-definitions',
      summary: 'Create a complete definition as a draft',
      description:
        'Strict portable document schema version 1. send_webhook actions are not supported.',
      request: { body: body(DefinitionDocumentSchema) },
      responses: { 201: response(output), ...errors },
    }),
    async c =>
      c.json(
        await c.get('ctx').runMutation(internal.addonTemplates.rest.create, {
          personId: c.get('personId') as Id<'persons'>,
          document: c.req.valid('json'),
        }),
        201
      )
  );
  app.openapi(
    createRoute({
      ...common,
      method: 'patch',
      path: '/addon-template-definitions/{id}',
      summary: 'Replace an owned definition at the expected version',
      request: {
        params,
        body: body(
          DefinitionDocumentSchema.safeExtend({ expectedVersion: version })
        ),
      },
      responses: { 200: response(output), ...errors },
    }),
    async c => {
      const { expectedVersion, ...document } = c.req.valid('json') as z.infer<
        typeof DefinitionDocumentSchema
      > & { expectedVersion: number };
      return c.json(
        await c.get('ctx').runMutation(internal.addonTemplates.rest.change, {
          personId: c.get('personId'),
          id: c.req.valid('param').id,
          expectedVersion,
          document,
          operation: 'replace',
        }),
        200
      );
    }
  );
  for (const operation of ['publish', 'unpublish'] as const) {
    app.openapi(
      createRoute({
        ...common,
        method: 'post',
        path: `/addon-template-definitions/{id}/${operation}`,
        summary: `${operation} an owned definition`,
        request: { params, body: body(versionBody) },
        responses: { 200: response(output), ...errors },
      }),
      async c =>
        c.json(
          await c.get('ctx').runMutation(internal.addonTemplates.rest.change, {
            personId: c.get('personId'),
            id: c.req.valid('param').id,
            expectedVersion: (
              c.req.valid('json') as z.infer<typeof versionBody>
            ).expectedVersion,
            operation,
          }),
          200
        )
    );
  }
  app.openapi(
    createRoute({
      ...common,
      method: 'delete',
      path: '/addon-template-definitions/{id}',
      summary:
        'Delete an owned definition without changing enabled event snapshots',
      request: {
        params,
        query: z
          .object({ expectedVersion: z.coerce.number().int().positive() })
          .strict(),
      },
      responses: {
        200: response(z.object({ id: z.string(), deleted: z.literal(true) })),
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runMutation(internal.addonTemplates.rest.change, {
          personId: c.get('personId'),
          id: c.req.valid('param').id,
          expectedVersion: c.req.valid('query').expectedVersion,
          operation: 'delete',
        }),
        200
      )
  );
  return app;
}
