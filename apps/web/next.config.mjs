import { withSentryConfig } from '@sentry/nextjs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, realpathSync } from 'fs';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from monorepo root BEFORE env.mjs validation
// Next.js automatically loads .env.local from apps/web directory (symlinked to root)
// We also explicitly load from root to ensure variables are available during config evaluation
const rootEnvLocal = resolve(__dirname, '../../.env.local');
// Resolve symlinks to get the actual file path
const actualEnvLocalPath = existsSync(rootEnvLocal)
  ? realpathSync(rootEnvLocal)
  : rootEnvLocal;
config({ path: actualEnvLocalPath, override: false });
const rootEnv = resolve(__dirname, '../../.env');
if (existsSync(rootEnv)) {
  config({ path: rootEnv, override: false });
}

import './env.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@groupi/ui',
    '@groupi/hooks',
    '@groupi/schema',
    '@groupi/api',
    '@groupi/services',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
        child_process: false,
        diagnostics_channel: false,
        fs: false,
        net: false,
        tls: false,
        worker_threads: false,
      };
    }

    return config;
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      // Add other image domains as needed
    ],
  },
  cacheComponents: true,
  cacheLife: {
    // Default fallback for general content
    default: {
      stale: 300, // 5 minutes
      revalidate: 120, // 2 minutes
      expire: 3600, // 1 hour
    },
    // Event headers, details, and member lists
    event: {
      stale: 300, // 5 minutes
      revalidate: 120, // 2 minutes
      expire: 1800, // 30 minutes
    },
    // Posts, replies, and frequently updated content
    posts: {
      stale: 30, // 30 seconds
      revalidate: 15, // 15 seconds
      expire: 300, // 5 minutes
    },
    // User-specific private data (settings, preferences)
    user: {
      stale: 300, // 5 minutes
      revalidate: 120, // 2 minutes
      expire: 900, // 15 minutes
    },
  },
  serverExternalPackages: [
    'require-in-the-middle',
    'import-in-the-middle',
    'pino',
    'pino-abstract-transport',
    'thread-stream',
  ],
  experimental: {
    turbopackFileSystemCacheForDev: true,
    // Enable detailed prerender debugging
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Enable detailed error output during build
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'groupi',
  project: 'javascript-nextjs',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
