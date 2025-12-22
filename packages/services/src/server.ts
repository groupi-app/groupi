// ============================================================================
// SERVER-ONLY EXPORTS
// ============================================================================
// This entry point exports server-only code (cache functions, auth helpers)
// Import from '@groupi/services/server' in server components, server actions, and route handlers
// DO NOT import from this in client components

import 'server-only';

// Cache layer (Next.js 16 "use cache" functions)
export * from './cache';

// Auth instance and helpers that use next/headers
export { auth } from './domains/auth';
export * from './domains/auth-helpers';

// Database client (Prisma) - safe to export from server entry point
export { db } from './infrastructure/db';
