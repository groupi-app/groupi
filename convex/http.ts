import { httpRouter } from 'convex/server';
import { authComponent, createAuth } from './auth';

/**
 * HTTP router for Convex
 *
 * This file configures HTTP endpoints including Better Auth routes.
 * The auth component handles all authentication-related HTTP requests.
 */

const http = httpRouter();

// Register Better Auth routes
// This handles all auth endpoints like /api/auth/signin, /api/auth/signout, etc.
authComponent.registerRoutes(http, createAuth);

export default http;
