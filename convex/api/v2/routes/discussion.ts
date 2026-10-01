import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import type { FunctionArgs } from 'convex/server';
import { internal } from '../../../_generated/api';
import { createValidationHook } from '../validation';
const attachment = z
  .object({
    storageId: z.string(),
    filename: z.string().min(1).max(255),
    size: z.number(),
    mimeType: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    isSpoiler: z.boolean().optional(),
    altText: z.string().optional(),
  })
  .strict();
const body = z
  .object({
    title: z.string().optional(),
    content: z.string().optional(),
    text: z.string().optional(),
    attachments: z.array(attachment).max(10).optional(),
    attachmentsToAdd: z.array(attachment).max(10).optional(),
    attachmentIdsToDelete: z.array(z.string()).max(10).optional(),
  })
  .strict();
type Variables = { ctx: ActionCtx; personId: string; userId: string };
export function createDiscussionRoutes(kind: 'posts' | 'replies') {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });
  const parent = kind === 'posts' ? 'events' : 'posts';
  const responses = {
    200: {
      description: 'Discussion result',
      content: { 'application/json': { schema: z.any() } },
    },
  };
  app.openapi(
    createRoute({
      method: 'get',
      path: `/${parent}/{parentId}/${kind}`,
      tags: ['Discussion'],
      request: {
        params: z.object({ parentId: z.string() }),
        query: z.object({
          pagination: z.enum(['cursor']).optional(),
          limit: z.coerce.number().int().min(1).max(100).optional(),
          cursor: z.string().optional(),
        }),
      },
      responses,
    }),
    async c => {
      const q = c.req.valid('query');
      const paged =
        q.pagination === 'cursor' ||
        q.limit !== undefined ||
        q.cursor !== undefined;
      const result = await c
        .get('ctx')
        .runQuery(internal.discussion.rest.list, {
          kind,
          parentId: c.req.valid('param').parentId,
          personId: c.get('personId') as Id<'persons'>,
          limit: paged ? (q.limit ?? 20) : undefined,
          cursor: q.cursor,
        });
      return c.json(paged ? result : result.items, 200);
    }
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: `/${kind}/{id}`,
      tags: ['Discussion'],
      request: { params: z.object({ id: z.string() }) },
      responses,
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.discussion.rest.read, {
          kind,
          id: c.req.valid('param').id,
          personId: c.get('personId') as Id<'persons'>,
        }),
        200
      )
  );
  for (const operation of ['create', 'edit', 'delete'] as const) {
    const operationBody = body.superRefine((value, ctx) => {
      const allowed = [
        ...(kind === 'posts' ? ['title', 'content'] : ['text']),
        ...(operation === 'create'
          ? ['attachments']
          : ['attachmentsToAdd', 'attachmentIdsToDelete']),
      ];
      if (
        !Object.keys(value).length ||
        Object.keys(value).some(key => !allowed.includes(key))
      )
        ctx.addIssue({
          code: 'custom',
          message: 'Provide fields supported by this content operation.',
        });
    });
    const method =
      operation === 'create'
        ? 'post'
        : operation === 'edit'
          ? 'patch'
          : 'delete';
    const path =
      operation === 'create' ? `/${parent}/{id}/${kind}` : `/${kind}/{id}`;
    app.openapi(
      createRoute({
        method,
        path,
        tags: ['Discussion'],
        request: {
          params: z.object({ id: z.string() }),
          ...(operation === 'delete'
            ? {}
            : {
                body: {
                  content: { 'application/json': { schema: operationBody } },
                },
              }),
        },
        responses: {
          ...responses,
          201: {
            description: 'Created',
            content: { 'application/json': { schema: z.any() } },
          },
          204: { description: 'Deleted' },
        },
      }),
      async c => {
        const input =
          operation === 'delete' ? {} : operationBody.parse(await c.req.json());
        const args = {
          kind,
          operation,
          id: c.req.valid('param').id,
          personId: c.get('personId') as Id<'persons'>,
          body: input,
        };
        // Public IDs are validated by Convex and all authorization occurs in the shared mutation transaction.
        const result = await c
          .get('ctx')
          .runMutation(
            internal.discussion.rest.write,
            args as FunctionArgs<typeof internal.discussion.rest.write>
          );
        if (operation === 'delete') return c.body(null, 204);
        if (operation === 'create')
          return c.json(
            kind === 'posts'
              ? { postId: 'postId' in result ? result.postId : null }
              : { replyId: 'replyId' in result ? result.replyId : null },
            201
          );
        return c.json(result, 200);
      }
    );
  }
  return app;
}
