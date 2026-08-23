import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';
import { ErrorResponseSchema } from '../schemas/common';
import {
  FriendListResponseSchema,
  FriendRequestListResponseSchema,
  UserSearchResponseSchema,
  SendFriendRequestSchema,
  FriendRequestResponseSchema,
  FriendActionResponseSchema,
  FriendshipStatusResponseSchema,
  FriendshipIdParamSchema,
  SearchQuerySchema,
} from '../schemas/friends';
import { z } from '@hono/zod-openapi';

type Variables = {
  ctx: ActionCtx;
  userId: string;
  personId: string;
};

export function createFriendRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // GET /friends - List friends
  const listFriendsRoute = createRoute({
    method: 'get',
    path: '/friends',
    tags: ['Friends'],
    summary: 'List friends',
    description: 'Get list of all friends for the authenticated user',
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'List of friends',
        content: {
          'application/json': {
            schema: FriendListResponseSchema,
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

  app.openapi(listFriendsRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.friends.listFriends;
    const result = await ctx.runQuery(listFn, { personId });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // GET /friends/requests/incoming - List incoming friend requests
  const listIncomingRequestsRoute = createRoute({
    method: 'get',
    path: '/friends/requests/incoming',
    tags: ['Friends'],
    summary: 'List incoming requests',
    description: 'Get list of pending friend requests received',
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'List of incoming friend requests',
        content: {
          'application/json': {
            schema: FriendRequestListResponseSchema,
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

  app.openapi(listIncomingRequestsRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.friends.listPendingRequests;
    const result = await ctx.runQuery(listFn, { personId });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // GET /friends/requests/outgoing - List sent friend requests
  const listOutgoingRequestsRoute = createRoute({
    method: 'get',
    path: '/friends/requests/outgoing',
    tags: ['Friends'],
    summary: 'List outgoing requests',
    description: 'Get list of pending friend requests sent',
    security: [{ apiKey: [] }],
    responses: {
      200: {
        description: 'List of outgoing friend requests',
        content: {
          'application/json': {
            schema: FriendRequestListResponseSchema,
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

  app.openapi(listOutgoingRequestsRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const listFn = internal.api.v1.internal.friends.listSentRequests;
    const result = await ctx.runQuery(listFn, { personId });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // GET /friends/search - Search users to add as friends
  const searchUsersRoute = createRoute({
    method: 'get',
    path: '/friends/search',
    tags: ['Friends'],
    summary: 'Search users',
    description: 'Search for users by name or username to send friend requests',
    security: [{ apiKey: [] }],
    request: {
      query: SearchQuerySchema,
    },
    responses: {
      200: {
        description: 'Search results',
        content: {
          'application/json': {
            schema: UserSearchResponseSchema,
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

  app.openapi(searchUsersRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { q } = c.req.valid('query');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const searchFn = internal.api.v1.internal.friends.searchUsers;
    const result = await ctx.runQuery(searchFn, { personId, searchTerm: q });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // GET /friends/status/:personId - Get friendship status with a user
  const getFriendshipStatusRoute = createRoute({
    method: 'get',
    path: '/friends/status/{targetPersonId}',
    tags: ['Friends'],
    summary: 'Get friendship status',
    description: 'Get the friendship status with another user',
    security: [{ apiKey: [] }],
    request: {
      params: z.object({
        targetPersonId: z.string(),
      }),
    },
    responses: {
      200: {
        description: 'Friendship status',
        content: {
          'application/json': {
            schema: FriendshipStatusResponseSchema,
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

  app.openapi(getFriendshipStatusRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { targetPersonId } = c.req.valid('param');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const statusFn = internal.api.v1.internal.friends.getFriendshipStatus;
    const result = await ctx.runQuery(statusFn, { personId, targetPersonId });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // POST /friends/requests - Send friend request
  const sendFriendRequestRoute = createRoute({
    method: 'post',
    path: '/friends/requests',
    tags: ['Friends'],
    summary: 'Send friend request',
    description: 'Send a friend request to another user',
    security: [{ apiKey: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: SendFriendRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Friend request sent',
        content: {
          'application/json': {
            schema: FriendRequestResponseSchema,
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

  app.openapi(sendFriendRequestRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const body = c.req.valid('json');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const sendFn = internal.api.v1.internal.friends.sendFriendRequest;
    const result = await ctx.runMutation(sendFn, {
      requesterId: personId,
      addresseeId: body.personId,
    });

    return c.json(
      {
        success: true as const,
        data: result,
      },
      200
    );
  });

  // POST /friends/requests/:friendshipId/accept - Accept friend request
  const acceptFriendRequestRoute = createRoute({
    method: 'post',
    path: '/friends/requests/{friendshipId}/accept',
    tags: ['Friends'],
    summary: 'Accept friend request',
    description: 'Accept a pending friend request',
    security: [{ apiKey: [] }],
    request: {
      params: FriendshipIdParamSchema,
    },
    responses: {
      200: {
        description: 'Friend request accepted',
        content: {
          'application/json': {
            schema: FriendActionResponseSchema,
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
      404: {
        description: 'Friend request not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(acceptFriendRequestRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { friendshipId } = c.req.valid('param');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const acceptFn = internal.api.v1.internal.friends.acceptFriendRequest;
    await ctx.runMutation(acceptFn, { friendshipId, personId });

    return c.json(
      {
        success: true as const,
        data: { message: 'Friend request accepted' },
      },
      200
    );
  });

  // POST /friends/requests/:friendshipId/decline - Decline friend request
  const declineFriendRequestRoute = createRoute({
    method: 'post',
    path: '/friends/requests/{friendshipId}/decline',
    tags: ['Friends'],
    summary: 'Decline friend request',
    description: 'Decline a pending friend request',
    security: [{ apiKey: [] }],
    request: {
      params: FriendshipIdParamSchema,
    },
    responses: {
      200: {
        description: 'Friend request declined',
        content: {
          'application/json': {
            schema: FriendActionResponseSchema,
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
      404: {
        description: 'Friend request not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(declineFriendRequestRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { friendshipId } = c.req.valid('param');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const declineFn = internal.api.v1.internal.friends.declineFriendRequest;
    await ctx.runMutation(declineFn, { friendshipId, personId });

    return c.json(
      {
        success: true as const,
        data: { message: 'Friend request declined' },
      },
      200
    );
  });

  // DELETE /friends/requests/:friendshipId - Cancel friend request
  const cancelFriendRequestRoute = createRoute({
    method: 'delete',
    path: '/friends/requests/{friendshipId}',
    tags: ['Friends'],
    summary: 'Cancel friend request',
    description: 'Cancel a pending friend request you sent',
    security: [{ apiKey: [] }],
    request: {
      params: FriendshipIdParamSchema,
    },
    responses: {
      200: {
        description: 'Friend request cancelled',
        content: {
          'application/json': {
            schema: FriendActionResponseSchema,
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
      404: {
        description: 'Friend request not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(cancelFriendRequestRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { friendshipId } = c.req.valid('param');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const cancelFn = internal.api.v1.internal.friends.cancelFriendRequest;
    await ctx.runMutation(cancelFn, { friendshipId, personId });

    return c.json(
      {
        success: true as const,
        data: { message: 'Friend request cancelled' },
      },
      200
    );
  });

  // DELETE /friends/:friendshipId - Remove friend
  const removeFriendRoute = createRoute({
    method: 'delete',
    path: '/friends/{friendshipId}',
    tags: ['Friends'],
    summary: 'Remove friend',
    description: 'Remove a friend from your friends list',
    security: [{ apiKey: [] }],
    request: {
      params: FriendshipIdParamSchema,
    },
    responses: {
      200: {
        description: 'Friend removed',
        content: {
          'application/json': {
            schema: FriendActionResponseSchema,
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
      404: {
        description: 'Friendship not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(removeFriendRoute, async c => {
    const ctx = c.get('ctx');
    const personId = c.get('personId');
    const { friendshipId } = c.req.valid('param');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589)
    const removeFn = internal.api.v1.internal.friends.removeFriend;
    await ctx.runMutation(removeFn, { friendshipId, personId });

    return c.json(
      {
        success: true as const,
        data: { message: 'Friend removed' },
      },
      200
    );
  });

  return app;
}
