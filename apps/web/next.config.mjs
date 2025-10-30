import { withSentryConfig } from '@sentry/nextjs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from monorepo root BEFORE env.mjs validation
config({ path: resolve(__dirname, '../../.env.local') });
config({ path: resolve(__dirname, '../../.env') });

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

    // Suppress Supabase realtime-js WebSocket dynamic import warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@supabase\/realtime-js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

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
