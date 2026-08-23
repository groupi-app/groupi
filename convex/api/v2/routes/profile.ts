import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { createValidationHook } from '../validation';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import { ErrorResponseSchema } from '../schemas/common';
import {
  ProfileSchema,
  UpdateProfileRequestSchema,
  UsernameParamSchema,
} from '../schemas/profile';

// Type for Hono app with Convex context
type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createProfileRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });

  // GET /profile - Get current user's profile
  const getCurrentProfileRoute = createRoute({
    method: 'get',
    path: '/profile',
    tags: ['Profile'],
    summary: 'Get current profile',
    description: "Get the authenticated user's profile",
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'User profile',
        content: {
          'application/json': {
            schema: ProfileSchema,
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
      404: {
        description: 'Profile not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(getCurrentProfileRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const getFn = internal.api.v1.internal.profile.getCurrentProfile;
    const result = await ctx.runQuery(getFn, { personId });

    if (!result) {
      return c.json(
        {
          error: { code: 'NOT_FOUND', message: 'Profile not found' },
        },
        404
      );
    }

    return c.json(result, 200);
  });

  // GET /profile/:username - Get profile by username
  const getProfileByUsernameRoute = createRoute({
    method: 'get',
    path: '/profile/{username}',
    tags: ['Profile'],
    summary: 'Get profile by username',
    description: "Get a user's public profile by their username",
    security: [{ apiKey: [] }],
    request: {
      params: UsernameParamSchema,
    },
    responses: {
      200: {
        description: 'User profile',
        content: {
          'application/json': {
            schema: ProfileSchema,
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
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(getProfileByUsernameRoute, async c => {
    const ctx = c.get('ctx');
    const { username } = c.req.valid('param');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const getFn = internal.api.v1.internal.profile.getProfileByUsername;
    const result = await ctx.runQuery(getFn, { username });

    if (!result) {
      return c.json(
        {
          error: { code: 'NOT_FOUND', message: 'User not found' },
        },
        404
      );
    }

    return c.json(result, 200);
  });

  // PUT /profile - Update current user's profile
  const updateProfileRoute = createRoute({
    method: 'put',
    path: '/profile',
    tags: ['Profile'],
    summary: 'Update profile',
    description: "Update the authenticated user's profile",
    security: [{ apiKey: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdateProfileRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated profile',
        content: {
          'application/json': {
            schema: ProfileSchema,
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

  app.openapi(updateProfileRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const userId = c.get('userId');
    const body = c.req.valid('json');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const updateFn = internal.api.v1.internal.profile.updateProfile;
    const result = await ctx.runMutation(updateFn, {
      personId,
      userId,
      ...body,
    });

    return c.json(result, 200);
  });

  return app;
}
