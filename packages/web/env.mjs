import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

// Environment variables are loaded in next.config.mjs before this file

export const env = createEnv({
  server: {
    // Core Application
    DEBUG: z.enum(['true', 'false']).optional(),

    // Better Auth
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url().optional(),

    // OAuth Providers
    DISCORD_CLIENT_ID: z.string().min(1).optional(),
    DISCORD_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_API_KEY: z.string().min(1).optional(),

    // Email Service
    RESEND_API_KEY: z.string().min(1).startsWith('re_').optional(),

    // File Upload
    UPLOADTHING_TOKEN: z.string().min(1).optional(),

    // Monitoring
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
    LOKI_ENABLED: z.enum(['true', 'false']).optional(),
    LOKI_URL: z.string().url().optional(),
    LOKI_INSTANCE_ID: z.string().min(1).optional(),
    LOKI_TOKEN: z.string().min(1).optional(),
    LOKI_SERVICE: z.string().min(1).optional(),
  },
  client: {
    // Core Application
    NEXT_PUBLIC_BASE_URL: z.string().url().optional(),

    // Convex Backend
    NEXT_PUBLIC_CONVEX_URL: z.string().url(),
    NEXT_PUBLIC_CONVEX_SITE_URL: z.string().url().optional(),

    // OAuth Providers (Client)
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_GOOGLE_API_KEY: z.string().min(1).optional(),

    // Monitoring (Client)
    NEXT_PUBLIC_SENTRY_DSN: z.string().min(1).optional(),

    // Development
    NEXT_PUBLIC_LOG_CACHE: z.enum(['true', 'false']).optional(),
  },
  runtimeEnv: {
    // Core Application
    DEBUG: process.env.DEBUG,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,

    // Convex Backend
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,

    // Better Auth
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,

    // OAuth Providers
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_GOOGLE_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,

    // Email Service
    RESEND_API_KEY: process.env.RESEND_API_KEY,

    // File Upload
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,

    // Development
    NEXT_PUBLIC_LOG_CACHE: process.env.NEXT_PUBLIC_LOG_CACHE,

    // Monitoring
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    LOKI_ENABLED: process.env.LOKI_ENABLED,
    LOKI_URL: process.env.LOKI_URL,
    LOKI_INSTANCE_ID: process.env.LOKI_INSTANCE_ID,
    LOKI_TOKEN: process.env.LOKI_TOKEN,
    LOKI_SERVICE: process.env.LOKI_SERVICE,
  },
});
