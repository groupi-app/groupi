import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import { ErrorResponseSchema } from '../schemas/common';
import {
  CustomThemeListResponseSchema,
  CustomThemeResponseSchema,
  CreateCustomThemeRequestSchema,
  UpdateCustomThemeRequestSchema,
  ThemeIdParamSchema,
  ThemePreferencesResponseSchema,
  SetThemePreferenceRequestSchema,
} from '../schemas/themes';

// Type for Hono app with Convex context
type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createThemeRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // GET /themes - List custom themes
  const listThemesRoute = createRoute({
    method: 'get',
    path: '/themes',
    tags: ['Themes'],
    summary: 'List custom themes',
    description: 'Get all custom themes created by the authenticated user',
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'List of custom themes',
        content: {
          'application/json': {
            schema: CustomThemeListResponseSchema,
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

  app.openapi(listThemesRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.themes.listCustomThemes;
    const result = await ctx.runQuery(listFn, { personId });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // GET /themes/preferences - Get theme preferences
  const getPreferencesRoute = createRoute({
    method: 'get',
    path: '/themes/preferences',
    tags: ['Themes'],
    summary: 'Get theme preferences',
    description: "Get the authenticated user's theme preferences",
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'Theme preferences',
        content: {
          'application/json': {
            schema: ThemePreferencesResponseSchema,
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

  app.openapi(getPreferencesRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const getFn = internal.api.v1.internal.themes.getThemePreferences;
    const result = await ctx.runQuery(getFn, { personId });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // POST /themes - Create custom theme
  const createThemeRoute = createRoute({
    method: 'post',
    path: '/themes',
    tags: ['Themes'],
    summary: 'Create custom theme',
    description: 'Create a new custom theme',
    security: [{ apiKey: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateCustomThemeRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Theme created',
        content: {
          'application/json': {
            schema: CustomThemeResponseSchema,
          },
        },
      },
      400: {
        description: 'Bad request',
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

  app.openapi(createThemeRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const body = c.req.valid('json');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const createFn = internal.api.v1.internal.themes.createCustomTheme;
    const result = await ctx.runMutation(createFn, {
      personId,
      ...body,
      tokenOverrides: body.tokenOverrides ?? undefined,
    });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      201
    );
  });

  // PUT /themes/:themeId - Update custom theme
  const updateThemeRoute = createRoute({
    method: 'put',
    path: '/themes/{themeId}',
    tags: ['Themes'],
    summary: 'Update custom theme',
    description: 'Update a custom theme (must be the owner)',
    security: [{ apiKey: [] }],
    request: {
      params: ThemeIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateCustomThemeRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated theme',
        content: {
          'application/json': {
            schema: CustomThemeResponseSchema,
          },
        },
      },
      400: {
        description: 'Bad request',
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
        description: 'Forbidden - not the theme owner',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Theme not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(updateThemeRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { themeId } = c.req.valid('param');
    const body = c.req.valid('json');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const updateFn = internal.api.v1.internal.themes.updateCustomTheme;
    const result = await ctx.runMutation(updateFn, {
      themeId,
      personId,
      ...body,
    });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // DELETE /themes/:themeId - Delete custom theme
  const deleteThemeRoute = createRoute({
    method: 'delete',
    path: '/themes/{themeId}',
    tags: ['Themes'],
    summary: 'Delete custom theme',
    description: 'Delete a custom theme (must be the owner)',
    security: [{ apiKey: [] }],
    request: {
      params: ThemeIdParamSchema,
    },
    responses: {
      200: {
        description: 'Theme deleted',
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
        description: 'Forbidden - not the theme owner',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Theme not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(deleteThemeRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { themeId } = c.req.valid('param');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const deleteFn = internal.api.v1.internal.themes.deleteCustomTheme;
    await ctx.runMutation(deleteFn, { themeId, personId });

    return c.json(
      {
        success: true as const,
        data: { message: 'Theme deleted successfully' },
      },
      200
    );
  });

  // PUT /themes/preferences - Set theme preference
  const setPreferenceRoute = createRoute({
    method: 'put',
    path: '/themes/preferences',
    tags: ['Themes'],
    summary: 'Set theme preferences',
    description:
      "Set the authenticated user's active theme and system preferences",
    security: [{ apiKey: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: SetThemePreferenceRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated theme preferences',
        content: {
          'application/json': {
            schema: ThemePreferencesResponseSchema,
          },
        },
      },
      400: {
        description: 'Bad request',
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

  app.openapi(setPreferenceRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const body = c.req.valid('json');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const setFn = internal.api.v1.internal.themes.setThemePreference;
    const result = await ctx.runMutation(setFn, {
      personId,
      ...body,
      selectedCustomThemeId: body.selectedCustomThemeId ?? undefined,
    });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  return app;
}
