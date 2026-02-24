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

// Handle OPTIONS for CORS preflight
http.route({
  pathPrefix: '/api/v1/',
  method: 'OPTIONS',
  handler: apiV1Handler,
});

export default http;
