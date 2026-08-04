import { httpRouter } from 'convex/server';
import { authComponent, createAuth } from './auth';
import { handler as apiV1Handler } from './api/v1/index';

/**
 * HTTP router for Convex
 *
 * This file configures HTTP endpoints including:
 * - Better Auth routes for authentication
 * - REST API v1 routes for public API access
 */

const http = httpRouter();

// Register Better Auth routes
// This handles all auth endpoints like /api/auth/signin, /api/auth/signout, etc.
authComponent.registerRoutes(http, createAuth);

// REST API v1 routes
// These handle all /api/v1/* endpoints with API key authentication
http.route({
  path: '/api/v1/health',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  path: '/api/v1/docs',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  path: '/api/v1/openapi.json',
  method: 'GET',
  handler: apiV1Handler,
});

// Events routes
http.route({
  path: '/api/v1/events',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  path: '/api/v1/events',
  method: 'POST',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/events/',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/events/',
  method: 'PATCH',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/events/',
  method: 'DELETE',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/events/',
  method: 'POST',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/events/',
  method: 'PUT',
  handler: apiV1Handler,
});

// Posts routes
http.route({
  pathPrefix: '/api/v1/posts/',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/posts/',
  method: 'PATCH',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/posts/',
  method: 'DELETE',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/posts/',
  method: 'POST',
  handler: apiV1Handler,
});

// Replies routes
http.route({
  pathPrefix: '/api/v1/replies/',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/replies/',
  method: 'PATCH',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/replies/',
  method: 'DELETE',
  handler: apiV1Handler,
});

// Notifications routes
http.route({
  path: '/api/v1/notifications',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  path: '/api/v1/notifications',
  method: 'DELETE',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/notifications/',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/notifications/',
  method: 'POST',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/notifications/',
  method: 'DELETE',
  handler: apiV1Handler,
});

// Muting routes
http.route({
  path: '/api/v1/muting',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/muting/',
  method: 'POST',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/muting/',
  method: 'DELETE',
  handler: apiV1Handler,
});

// Profile routes
http.route({
  path: '/api/v1/profile',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  path: '/api/v1/profile',
  method: 'PUT',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/profile/',
  method: 'GET',
  handler: apiV1Handler,
});

// Settings routes
http.route({
  pathPrefix: '/api/v1/settings/',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/settings/',
  method: 'PUT',
  handler: apiV1Handler,
});

// Themes routes
http.route({
  path: '/api/v1/themes',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  path: '/api/v1/themes',
  method: 'POST',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/themes/',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/themes/',
  method: 'PUT',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/themes/',
  method: 'DELETE',
  handler: apiV1Handler,
});

// Invites routes (note: /events/:eventId/invites is covered by events pathPrefix)
http.route({
  pathPrefix: '/api/v1/invites/',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/invites/',
  method: 'POST',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/invites/',
  method: 'DELETE',
  handler: apiV1Handler,
});

// Reports routes
http.route({
  path: '/api/v1/reports',
  method: 'POST',
  handler: apiV1Handler,
});

// Admin routes
http.route({
  pathPrefix: '/api/v1/admin/',
  method: 'GET',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/admin/',
  method: 'DELETE',
  handler: apiV1Handler,
});

http.route({
  pathPrefix: '/api/v1/admin/',
  method: 'PUT',
  handler: apiV1Handler,
});

// Handle OPTIONS for CORS preflight
http.route({
  pathPrefix: '/api/v1/',
  method: 'OPTIONS',
  handler: apiV1Handler,
});

export default http;
