/**
 * Shared environment configuration for services package
 * This provides a simple way to access environment variables across packages
 */

export const getEnvVar = (key: string): string | undefined => {
  return process.env[key];
};

export const requireEnvVar = (key: string): string => {
  const value = getEnvVar(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Database - lazy access
export const getDATABASE_URL = () => requireEnvVar('DATABASE_URL');
export const getDIRECT_URL = () => requireEnvVar('DIRECT_URL');

// Clerk - lazy access
export const getCLERK_SECRET_KEY = () => requireEnvVar('CLERK_SECRET_KEY');
export const getCLERK_WEBHOOK_SIGNING_SECRET = () =>
  requireEnvVar('CLERK_WEBHOOK_SIGNING_SECRET');

// Pusher - lazy access
export const getPUSHER_APP_ID = () => requireEnvVar('PUSHER_APP_ID');
export const getPUSHER_APP_SECRET = () => requireEnvVar('PUSHER_APP_SECRET');
export const getPUSHER_BEAMS_SECRET_KEY = () =>
  requireEnvVar('PUSHER_BEAMS_SECRET_KEY');

// Google - lazy access
export const getGOOGLE_API_KEY = () => requireEnvVar('GOOGLE_API_KEY');

// Resend - lazy access
export const getRESEND_API_KEY = () => requireEnvVar('RESEND_API_KEY');
export const getRESEND_FROM_EMAIL = () =>
  getEnvVar('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

// Public variables (for client-side use) - lazy access
export const getNEXT_PUBLIC_BASE_URL = () =>
  getEnvVar('NEXT_PUBLIC_BASE_URL') || 'http://localhost:3000';
export const getNEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = () =>
  requireEnvVar('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
export const getNEXT_PUBLIC_CLERK_SIGN_IN_URL = () =>
  requireEnvVar('NEXT_PUBLIC_CLERK_SIGN_IN_URL');
export const getNEXT_PUBLIC_CLERK_SIGN_UP_URL = () =>
  requireEnvVar('NEXT_PUBLIC_CLERK_SIGN_UP_URL');
export const getNEXT_PUBLIC_CLERK_SIGN_X_FORCE_REDIRECT_URL = () =>
  requireEnvVar('NEXT_PUBLIC_CLERK_SIGN_X_FORCE_REDIRECT_URL');
export const getNEXT_PUBLIC_PUSHER_APP_KEY = () =>
  requireEnvVar('NEXT_PUBLIC_PUSHER_APP_KEY');
export const getNEXT_PUBLIC_PUSHER_APP_CLUSTER = () =>
  requireEnvVar('NEXT_PUBLIC_PUSHER_APP_CLUSTER');
export const getNEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID = () =>
  requireEnvVar('NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID');

// Sentry - lazy access
export const getSENTRY_DSN = () =>
  getEnvVar('SENTRY_DSN') || getEnvVar('NEXT_PUBLIC_SENTRY_DSN');
export const getSENTRY_AUTH_TOKEN = () => getEnvVar('SENTRY_AUTH_TOKEN');

// Debug - lazy access
export const isDEBUG_ENABLED = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const debugEnv = getEnvVar('DEBUG');
  return debugEnv === 'true' && !isProduction;
};
