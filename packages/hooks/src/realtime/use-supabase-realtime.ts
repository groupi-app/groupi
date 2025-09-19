import { useEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type {
  RealtimePostgresChangesPayload,
  RealtimePostgresChangesFilter,
} from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../clients/supabase-client';

export type ChangeEventType = '*' | 'INSERT' | 'UPDATE' | 'DELETE';

export interface ChangeConfig<
  RowType extends Record<string, unknown> = Record<string, unknown>,
> {
  schema?: string;
  table: string;
  filter: string;
  event?: ChangeEventType | ChangeEventType[];
  handler: (args: {
    payload: RealtimePostgresChangesPayload<RowType>;
    queryClient: QueryClient;
  }) => void;
}

export type SupabaseRealtimeDefinition<
  Cs extends ReadonlyArray<
    ChangeConfig<Record<string, unknown>>
  > = ReadonlyArray<ChangeConfig<Record<string, unknown>>>,
> = {
  channel: string;
  changes: Cs;
};

/**
 * Low-level subscribe function for environments outside React.
 * Returns an unsubscribe function.
 */
export function subscribeToSupabaseRealtime<
  Cs extends ReadonlyArray<ChangeConfig<Record<string, unknown>>>,
>(
  definition: SupabaseRealtimeDefinition<Cs>,
  queryClient: QueryClient
): () => void {
  const supabase = getSupabaseClient();
  const channelBuilder = supabase.channel(definition.channel);

  definition.changes.forEach(
    <R extends Record<string, unknown>>(change: ChangeConfig<R>) => {
      const eventsArray: ChangeEventType[] = Array.isArray(change.event)
        ? change.event
        : [change.event ?? '*'];
      eventsArray.forEach(evt => {
        switch (evt) {
          case '*': {
            const filter: RealtimePostgresChangesFilter<'*'> = {
              event: '*',
              schema: change.schema ?? 'public',
              table: change.table,
              filter: change.filter,
            };
            channelBuilder.on(
              'postgres_changes',
              filter,
              (payload: RealtimePostgresChangesPayload<R>) => {
                change.handler({ payload, queryClient });
              }
            );
            break;
          }
          case 'INSERT': {
            const filter: RealtimePostgresChangesFilter<'INSERT'> = {
              event: 'INSERT',
              schema: change.schema ?? 'public',
              table: change.table,
              filter: change.filter,
            };
            channelBuilder.on(
              'postgres_changes',
              filter,
              (payload: RealtimePostgresChangesPayload<R>) => {
                change.handler({ payload, queryClient });
              }
            );
            break;
          }
          case 'UPDATE': {
            const filter: RealtimePostgresChangesFilter<'UPDATE'> = {
              event: 'UPDATE',
              schema: change.schema ?? 'public',
              table: change.table,
              filter: change.filter,
            };
            channelBuilder.on(
              'postgres_changes',
              filter,
              (payload: RealtimePostgresChangesPayload<R>) => {
                change.handler({ payload, queryClient });
              }
            );
            break;
          }
          case 'DELETE': {
            const filter: RealtimePostgresChangesFilter<'DELETE'> = {
              event: 'DELETE',
              schema: change.schema ?? 'public',
              table: change.table,
              filter: change.filter,
            };
            channelBuilder.on(
              'postgres_changes',
              filter,
              (payload: RealtimePostgresChangesPayload<R>) => {
                change.handler({ payload, queryClient });
              }
            );
            break;
          }
          default:
            break;
        }
      });
    }
  );

  const channel = channelBuilder.subscribe();
  return () => {
    channel.unsubscribe();
  };
}

/**
 * React hook wrapper that manages subscription lifecycle and cleanup.
 */
export function useSupabaseRealtime<
  Cs extends ReadonlyArray<ChangeConfig<Record<string, unknown>>>,
>(definition: SupabaseRealtimeDefinition<Cs>, deps: unknown[] = []) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!definition || !definition.channel || !definition.changes?.length)
      return;
    const unsubscribe = subscribeToSupabaseRealtime(definition, queryClient);
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    definition.channel,
    JSON.stringify(definition.changes),
    queryClient,
    ...deps,
  ]);
}
