'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client instance.
 * 
 * Simple singleton pattern - the client is created once and reused.
 * The 'use client' directive ensures this only runs in the browser.
 */
export const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'
);

/**
 * Create a new Supabase client instance.
 * Useful when you need a fresh instance (e.g., in hooks with different options).
 */
export const createClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'
  );
