'use client';

import React, { useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface RealtimeInvalidationProviderProps {
  children: React.ReactNode;
  userId?: string | null;
}

export function SupabaseRealtimeProvider({
  children,
  userId,
}: RealtimeInvalidationProviderProps) {
  //

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase.channel(`user-${userId}`).subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return <>{children}</>;
}
