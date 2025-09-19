'use client';

import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

/**
 * Factory: create a Supabase client with given URL and anon key.
 * Keeps options UI-agnostic so it can be used on web and React Native.
 */
export function createSupabaseClient(
  url: string,
  anonKey: string,
  options?: SupabaseClientOptions<'public'>
): SupabaseClient {
  return createClient(url, anonKey, options);
}

/**
 * Web singleton: lazily create and reuse a browser Supabase client using env.
 */
export function getSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const url =
    (process.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
    'http://127.0.0.1:54321';
  const anon =
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) || 'public-anon-key';
  browserClient = createSupabaseClient(url, anon);
  return browserClient;
}
