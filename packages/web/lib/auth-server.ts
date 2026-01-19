import { convexBetterAuthNextJs } from '@convex-dev/better-auth/nextjs';

// Derive site URL from cloud URL if not explicitly set
// .convex.cloud -> .convex.site
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
const convexSiteUrl =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
  convexUrl?.replace('.convex.cloud', '.convex.site');

export const {
  handler,
  preloadAuthQuery,
  isAuthenticated,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthNextJs({
  convexUrl,
  convexSiteUrl,
});
