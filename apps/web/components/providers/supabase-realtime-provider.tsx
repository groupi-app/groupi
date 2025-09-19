'use client';

import React, { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@groupi/hooks';
import {
  type InvalidationMessage,
  getInvalidationQueriesForMessage,
  queryKeyMatchesPattern,
  getUserChannel,
} from '@groupi/hooks';

interface RealtimeInvalidationProviderProps {
  children: React.ReactNode;
  userId?: string | null;
}

export function SupabaseRealtimeProvider({
  children,
  userId,
}: RealtimeInvalidationProviderProps) {
  const queryClient = useQueryClient();

  const handleInvalidationMessage = useCallback(
    (message: InvalidationMessage) => {
      const relevantDefinitions = getInvalidationQueriesForMessage(
        message.type
      );

      // Invalidate queries matching patterns
      relevantDefinitions.forEach(definition => {
        queryClient.invalidateQueries({
          predicate: query =>
            queryKeyMatchesPattern(query.queryKey, definition.queryKeyPattern),
        });
      });

      // Invalidate specific query keys if provided
      if (message.queryKeys && message.queryKeys.length > 0) {
        message.queryKeys.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
    [queryClient]
  );

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(getUserChannel(userId))
      .on('broadcast', { event: 'invalidate_queries' }, (payload: any) => {
        const message = payload?.payload as InvalidationMessage;
        handleInvalidationMessage(message);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, handleInvalidationMessage]);

  return <>{children}</>;
}
