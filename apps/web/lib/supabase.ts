'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Get Supabase configuration.
 * Uses process.env directly - NEXT_PUBLIC_* vars are inlined at build time.
 */
function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key',
  };
}

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * Get or create the singleton Supabase client instance.
 * Safe for use in client components - will only initialize in the browser.
 */
function getSupabase() {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be accessed on the client side');
  }

  if (!supabaseInstance) {
    const config = getSupabaseConfig();
    supabaseInstance = createSupabaseClient(config.url, config.anonKey);
  }

  return supabaseInstance;
}

/**
 * Legacy export for backward compatibility.
 * This works because it's only ever accessed in client components after mount.
 */
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_target, prop) {
    const client = getSupabase();
    const value = client[prop as keyof typeof client];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

/**
 * Create a new Supabase client instance.
 * Useful when you need a fresh instance (e.g., in hooks with different options).
 */
export const createClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be accessed on the client side');
  }
  const config = getSupabaseConfig();
  return createSupabaseClient(config.url, config.anonKey);
};
