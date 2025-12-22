// ============================================================================
// AUTH TYPES (Client-Safe)
// ============================================================================
// This file exports auth-related types that can be safely imported in client components
// It does NOT import any server-only code (next/headers, next/cache, etc.)

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import {
  twoFactor,
  username,
  phoneNumber,
  magicLink,
  oneTap,
  admin,
  apiKey,
} from 'better-auth/plugins';
import { PrismaClient } from '@prisma/client';

// Create a minimal auth instance just for type inference
// This does NOT use next/headers or any server-only APIs
// Must match the real auth instance configuration for accurate types
const _authForTypes = betterAuth({
  database: prismaAdapter(new PrismaClient(), {
    provider: 'postgresql',
  }),
  plugins: [
    twoFactor(),
    username(),
    phoneNumber(),
    magicLink({
      sendMagicLink: async () => {
        // Stub function for type inference only - not used in runtime
      },
    }),
    oneTap({
      clientId: 'dummy-client-id-for-types',
    }),
    admin(),
    apiKey(),
  ],
  user: {
    additionalFields: {
      imageKey: {
        type: 'string',
        required: false,
        input: false,
      },
      pronouns: {
        type: 'string',
        required: false,
        input: false,
      },
      bio: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
  // Minimal config for type inference only
  baseURL: 'http://localhost',
  secret: 'dummy-secret-for-types',
});

// Export types that can be safely imported in client components
export type Session = typeof _authForTypes.$Infer.Session;
export type User = typeof _authForTypes.$Infer.Session.user;
