import { useEffect, useMemo } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type {
  RealtimePostgresChangesPayload,
  RealtimePostgresChangesFilter,
} from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../clients/supabase-client';

export type ChangeEventType = '*' | 'INSERT' | 'UPDATE' | 'DELETE';

export interface ChangeConfig<TRow = Record<string, unknown>> {
  schema?: string;
  table: string;
  filter: string;
  event?: ChangeEventType | ChangeEventType[];
  handler: (args: {
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>;
    queryClient: QueryClient;
    event: ChangeEventType;
    newRow: TRow | null;
    oldRow: TRow | null;
  }) => void;
}

export type SupabaseRealtimeDefinition<
  TChanges extends ReadonlyArray<ChangeConfig<unknown>>,
> = {
  channel: string;
  changes: TChanges;
};

/**
 * Low-level subscribe function for environments outside React.
 * Returns an unsubscribe function.
 */
export function subscribeToSupabaseRealtime<
  TChanges extends ReadonlyArray<ChangeConfig<unknown>>,
>(
  definition: SupabaseRealtimeDefinition<TChanges>,
  queryClient: QueryClient
): () => void {
  const supabase = getSupabaseClient();
  const channelBuilder = supabase.channel(definition.channel);

  definition.changes.forEach(
    <TRow extends Record<string, unknown>>(change: ChangeConfig<TRow>) => {
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
              (payload: RealtimePostgresChangesPayload<TRow>) => {
                const newRow =
                  (payload as unknown as { new?: TRow }).new ?? null;
                const oldRow =
                  (payload as unknown as { old?: TRow }).old ?? null;
                change.handler({
                  payload,
                  queryClient,
                  event: payload.eventType as ChangeEventType,
                  newRow,
                  oldRow,
                });
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
              (payload: RealtimePostgresChangesPayload<TRow>) => {
                const newRow =
                  (payload as unknown as { new?: TRow }).new ?? null;
                const oldRow =
                  (payload as unknown as { old?: TRow }).old ?? null;
                change.handler({
                  payload,
                  queryClient,
                  event: 'INSERT',
                  newRow,
                  oldRow,
                });
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
              (payload: RealtimePostgresChangesPayload<TRow>) => {
                const newRow =
                  (payload as unknown as { new?: TRow }).new ?? null;
                const oldRow =
                  (payload as unknown as { old?: TRow }).old ?? null;
                change.handler({
                  payload,
                  queryClient,
                  event: 'UPDATE',
                  newRow,
                  oldRow,
                });
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
              (payload: RealtimePostgresChangesPayload<TRow>) => {
                const newRow =
                  (payload as unknown as { new?: TRow }).new ?? null;
                const oldRow =
                  (payload as unknown as { old?: TRow }).old ?? null;
                change.handler({
                  payload,
                  queryClient,
                  event: 'DELETE',
                  newRow,
                  oldRow,
                });
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
  TChanges extends ReadonlyArray<ChangeConfig<unknown>>,
>(definition: SupabaseRealtimeDefinition<TChanges>, deps: unknown[] = []) {
  const queryClient = useQueryClient();
  const depsKey = useMemo(() => JSON.stringify(deps ?? []), [deps]);

  useEffect(() => {
    if (!definition || !definition.channel || !definition.changes?.length)
      return;
    const unsubscribe = subscribeToSupabaseRealtime(definition, queryClient);
    return () => unsubscribe();
  }, [definition, queryClient, depsKey]);
}
