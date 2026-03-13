import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import { requireEventMembership, requireEventRole } from '../middleware/auth';
import { ErrorResponseSchema, EventIdParamSchema } from '../schemas/common';
import {
  EventAddonParamSchema,
  EventAddonDataKeyParamSchema,
  EnableAddonRequestSchema,
  UpdateAddonConfigRequestSchema,
  SetAddonDataRequestSchema,
  AddonListResponseSchema,
  AddonConfigSingleResponseSchema,
  AddonDataListResponseSchema,
  AddonDataSingleResponseSchema,
  AddonSuccessResponseSchema,
} from '../schemas/addons';

// Type for Hono app with Convex context
type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createAddonRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // ===== ADDON CONFIG ROUTES =====

  // GET /events/:eventId/addons - List all addon configs
  const listAddonsRoute = createRoute({
    method: 'get',
    path: '/events/{eventId}/addons',
    tags: ['Add-ons'],
    summary: 'List add-ons',
    description: 'Get all add-on configurations for an event',
    security: [{ apiKey: [] }],
    request: {
      params: EventIdParamSchema,
    },
    responses: {
      200: {
        description: 'List of add-on configs',
        content: {
          'application/json': {
            schema: AddonListResponseSchema,
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
      403: {
        description: 'Forbidden - not a member',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(listAddonsRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId } = c.req.valid('param');

    await requireEventMembership(ctx, eventId, personId);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.addons.listEventAddons;
    const result = await ctx.runQuery(listFn, { eventId });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // POST /events/:eventId/addons/:addonType/enable - Enable addon
  const enableAddonRoute = createRoute({
    method: 'post',
    path: '/events/{eventId}/addons/{addonType}/enable',
    tags: ['Add-ons'],
    summary: 'Enable add-on',
    description:
      'Enable an add-on for an event with the given config. Requires MODERATOR role or higher.',
    security: [{ apiKey: [] }],
    request: {
      params: EventAddonParamSchema,
      body: {
        content: {
          'application/json': {
            schema: EnableAddonRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Add-on enabled',
        content: {
          'application/json': {
            schema: AddonSuccessResponseSchema,
          },
        },
      },
      400: {
        description: 'Bad request - invalid config or unknown addon type',
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
      403: {
        description: 'Forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(enableAddonRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId, addonType } = c.req.valid('param');
    const { config } = c.req.valid('json');

    await requireEventRole(ctx, eventId, personId, 'MODERATOR');

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const enableFn = internal.api.v1.internal.addons.enableAddon;
      await ctx.runMutation(enableFn, { eventId, addonType, config });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to enable add-on';
      return c.json(
        {
          success: false as const,
          error: { code: 'BAD_REQUEST', message },
        },
        400
      );
    }

    return c.json(
      {
        success: true as const,
        data: { message: `Add-on ${addonType} enabled successfully` },
      },
      200
    );
  });

  // POST /events/:eventId/addons/:addonType/disable - Disable addon
  const disableAddonRoute = createRoute({
    method: 'post',
    path: '/events/{eventId}/addons/{addonType}/disable',
    tags: ['Add-ons'],
    summary: 'Disable add-on',
    description:
      'Disable an add-on for an event. Requires MODERATOR role or higher.',
    security: [{ apiKey: [] }],
    request: {
      params: EventAddonParamSchema,
    },
    responses: {
      200: {
        description: 'Add-on disabled',
        content: {
          'application/json': {
            schema: AddonSuccessResponseSchema,
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
      403: {
        description: 'Forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(disableAddonRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId, addonType } = c.req.valid('param');

    await requireEventRole(ctx, eventId, personId, 'MODERATOR');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const disableFn = internal.api.v1.internal.addons.disableAddon;
    await ctx.runMutation(disableFn, { eventId, addonType });

    return c.json(
      {
        success: true as const,
        data: { message: `Add-on ${addonType} disabled successfully` },
      },
      200
    );
  });

  // PATCH /events/:eventId/addons/:addonType/config - Update addon config
  const updateAddonConfigRoute = createRoute({
    method: 'patch',
    path: '/events/{eventId}/addons/{addonType}/config',
    tags: ['Add-ons'],
    summary: 'Update add-on config',
    description:
      'Update the configuration for an enabled add-on. Requires MODERATOR role or higher.',
    security: [{ apiKey: [] }],
    request: {
      params: EventAddonParamSchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateAddonConfigRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Add-on config updated',
        content: {
          'application/json': {
            schema: AddonConfigSingleResponseSchema,
          },
        },
      },
      400: {
        description: 'Bad request - invalid config or addon not enabled',
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
      403: {
        description: 'Forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(updateAddonConfigRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId, addonType } = c.req.valid('param');
    const { config } = c.req.valid('json');

    await requireEventRole(ctx, eventId, personId, 'MODERATOR');

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const updateFn = internal.api.v1.internal.addons.updateAddonConfig;
      const result = await ctx.runMutation(updateFn, {
        eventId,
        addonType,
        config,
      });

      return c.json(
        {
          success: true as const,
          data: result,
        },
        200
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update add-on config';
      return c.json(
        {
          success: false as const,
          error: { code: 'BAD_REQUEST', message },
        },
        400
      );
    }
  });

  // ===== ADDON DATA ROUTES =====

  // GET /events/:eventId/addons/:addonType/data - List addon data
  const listAddonDataRoute = createRoute({
    method: 'get',
    path: '/events/{eventId}/addons/{addonType}/data',
    tags: ['Add-ons'],
    summary: 'List add-on data',
    description: 'Get all data entries for an add-on on an event',
    security: [{ apiKey: [] }],
    request: {
      params: EventAddonParamSchema,
    },
    responses: {
      200: {
        description: 'List of data entries',
        content: {
          'application/json': {
            schema: AddonDataListResponseSchema,
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
      403: {
        description: 'Forbidden - not a member',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(listAddonDataRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId, addonType } = c.req.valid('param');

    await requireEventMembership(ctx, eventId, personId);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const getDataFn = internal.api.v1.internal.addons.getAddonData;
    const result = await ctx.runQuery(getDataFn, { eventId, addonType });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // PUT /events/:eventId/addons/:addonType/data/:key - Set addon data entry
  const setAddonDataRoute = createRoute({
    method: 'put',
    path: '/events/{eventId}/addons/{addonType}/data/{key}',
    tags: ['Add-ons'],
    summary: 'Set add-on data',
    description:
      'Create or update a data entry for an add-on. The key is used for upsert. Updating an existing entry requires being the creator or MODERATOR+.',
    security: [{ apiKey: [] }],
    request: {
      params: EventAddonDataKeyParamSchema,
      body: {
        content: {
          'application/json': {
            schema: SetAddonDataRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Data entry created or updated',
        content: {
          'application/json': {
            schema: AddonDataSingleResponseSchema,
          },
        },
      },
      400: {
        description: 'Bad request - addon not enabled or data too large',
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
      403: {
        description: 'Forbidden - not a member or insufficient permissions',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(setAddonDataRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId, addonType, key } = c.req.valid('param');
    const { data } = c.req.valid('json');

    await requireEventMembership(ctx, eventId, personId);

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const setDataFn = internal.api.v1.internal.addons.setAddonData;
      const result = await ctx.runMutation(setDataFn, {
        eventId,
        addonType,
        key,
        data,
        personId,
      });

      return c.json(
        {
          success: true as const,
          data: {
            id: result.id,
            key: result.key,
            data: result.data,
            createdBy: result.createdBy,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          },
        },
        200
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to set add-on data';
      return c.json(
        {
          success: false as const,
          error: { code: 'BAD_REQUEST', message },
        },
        400
      );
    }
  });

  // DELETE /events/:eventId/addons/:addonType/data/:key - Delete addon data entry
  const deleteAddonDataRoute = createRoute({
    method: 'delete',
    path: '/events/{eventId}/addons/{addonType}/data/{key}',
    tags: ['Add-ons'],
    summary: 'Delete add-on data',
    description:
      'Delete a data entry for an add-on. Requires being the creator or MODERATOR+.',
    security: [{ apiKey: [] }],
    request: {
      params: EventAddonDataKeyParamSchema,
    },
    responses: {
      200: {
        description: 'Data entry deleted',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.object({ message: z.string() }),
            }),
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
      403: {
        description: 'Forbidden - not a member or insufficient permissions',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(deleteAddonDataRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { eventId, addonType, key } = c.req.valid('param');

    await requireEventMembership(ctx, eventId, personId);

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type instantiation is excessively deep (TS2589)
      const deleteFn = internal.api.v1.internal.addons.deleteAddonData;
      await ctx.runMutation(deleteFn, { eventId, addonType, key, personId });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete add-on data';
      return c.json(
        {
          success: false as const,
          error: { code: 'FORBIDDEN', message },
        },
        403
      );
    }

    return c.json(
      {
        success: true as const,
        data: { message: 'Data entry deleted successfully' },
      },
      200
    );
  });

  return app;
}
