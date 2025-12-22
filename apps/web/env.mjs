import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

// Environment variables are loaded in next.config.mjs before this file

export const env = createEnv({
  server: {
    DATABASE_URL: z.string(),
    DIRECT_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url().optional(),
    // OAuth Providers
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    PUSHER_APP_ID: z.string().min(1),
    PUSHER_APP_SECRET: z.string().min(1),
    GOOGLE_API_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().min(1).startsWith('re_'),
    PUSHER_BEAMS_SECRET_KEY: z.string().min(1),
    SENTRY_AUTH_TOKEN: z.string().min(1),
    UPLOADTHING_TOKEN: z.string().min(1).optional(),
    DEBUG: z.enum(['true', 'false']).optional(),
    // Supabase JWT Configuration for Realtime
    SUPABASE_JWT_SECRET: z.string().min(1).optional(),
    SUPABASE_JWT_ALG: z
      .enum(['HS256', 'HS384', 'HS512', 'RS256', 'ES256'])
      .optional(),
    // Supabase Service Role Key (for local dev workaround - bypasses JWT verification)
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    // Grafana Cloud Loki Configuration (optional)
    LOKI_ENABLED: z.enum(['true', 'false']).optional(),
    LOKI_URL: z.string().url().optional(),
    LOKI_INSTANCE_ID: z.string().min(1).optional(),
    LOKI_TOKEN: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_BASE_URL: z.url().optional(),
    NEXT_PUBLIC_PUSHER_APP_KEY: z.string().min(1),
    NEXT_PUBLIC_PUSHER_APP_CLUSTER: z.string().min(1),
    NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID: z.string().min(1),
    NEXT_PUBLIC_SENTRY_DSN: z.string().min(1),
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_GOOGLE_API_KEY: z.string().min(1),
  },
  runtimeEnv: {
    NEXT_PUBLIC_BASE_URL:
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    // OAuth Providers
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    PUSHER_APP_ID: process.env.PUSHER_APP_ID,
    PUSHER_APP_SECRET: process.env.PUSHER_APP_SECRET,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    NEXT_PUBLIC_PUSHER_APP_KEY: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
    NEXT_PUBLIC_PUSHER_APP_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID:
      process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID,
    PUSHER_BEAMS_SECRET_KEY: process.env.PUSHER_BEAMS_SECRET_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    DEBUG: process.env.DEBUG,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_GOOGLE_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
    SUPABASE_JWT_ALG: process.env.SUPABASE_JWT_ALG,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Grafana Cloud Loki Configuration
    LOKI_ENABLED: process.env.LOKI_ENABLED,
    LOKI_URL: process.env.LOKI_URL,
    LOKI_INSTANCE_ID: process.env.LOKI_INSTANCE_ID,
    LOKI_TOKEN: process.env.LOKI_TOKEN,
  },
});
