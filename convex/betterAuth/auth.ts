/**
 * Static auth export for Better Auth schema generation.
 *
 * This file is ONLY used for schema generation and should not contain
 * any other code. The Better Auth CLI uses this to generate the schema.
 *
 * Run: cd convex/betterAuth && npx @better-auth/cli generate -y
 */
import { createAuthOptions } from '../auth';
import { betterAuth } from 'better-auth/minimal';

// Create auth instance with dummy context for schema generation
// The actual runtime uses createAuth() with a real context
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth = betterAuth(createAuthOptions({} as any));
