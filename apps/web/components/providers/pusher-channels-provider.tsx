'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import type Pusher from 'pusher-js';
import type { Channel } from 'pusher-js';
import { pusherClient } from '@/lib/pusher-client';

interface PusherChannelsContextValue {
  client: Pusher | null;
  isConnected: boolean;
  connectionState: string;
  subscribe: (channelName: string) => Channel | null;
  unsubscribe: (channelName: string) => void;
  bind: (
    channelName: string,
    eventName: string,
    handler: (data: any) => void
  ) => void;
  unbind: (
    channelName: string,
    eventName: string,
    handler: (data: any) => void
  ) => void;
}

const PusherChannelsContext = createContext<PusherChannelsContextValue | null>(
  null
);

export function PusherChannelsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const clientRef = useRef<Pusher | null>(null);
  const channelsRef = useRef<Map<string, Channel>>(new Map());
  const connectionStateRef = useRef<string>('disconnected');
  const isConnectedRef = useRef<boolean>(false);

  // Initialize singleton client from app lib
  if (!clientRef.current) {
    clientRef.current = pusherClient;
  }

  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    const handleConnected = () => {
      isConnectedRef.current = true;
      connectionStateRef.current = 'connected';
    };
    const handleDisconnected = () => {
      isConnectedRef.current = false;
      connectionStateRef.current = 'disconnected';
    };
    const handleStateChange = (states: { current: string }) => {
      connectionStateRef.current = states.current;
    };

    client.connection.bind('connected', handleConnected);
    client.connection.bind('disconnected', handleDisconnected);
    client.connection.bind('state_change', handleStateChange);

    return () => {
      try {
        client.connection.unbind('connected', handleConnected);
        client.connection.unbind('disconnected', handleDisconnected);
        client.connection.unbind('state_change', handleStateChange);
      } catch {}
    };
  }, []);

  const value = useMemo<PusherChannelsContextValue>(() => {
    return {
      client: clientRef.current,
      isConnected: isConnectedRef.current,
      connectionState: connectionStateRef.current,
      subscribe: (channelName: string) => {
        const client = clientRef.current;
        if (!client) return null;
        if (channelsRef.current.has(channelName)) {
          return channelsRef.current.get(channelName)!;
        }
        const ch = client.subscribe(channelName);
        channelsRef.current.set(channelName, ch);
        return ch;
      },
      unsubscribe: (channelName: string) => {
        const client = clientRef.current;
        if (!client) return;
        try {
          client.unsubscribe(channelName);
        } finally {
          channelsRef.current.delete(channelName);
        }
      },
      bind: (
        channelName: string,
        eventName: string,
        handler: (data: any) => void
      ) => {
        const ch =
          channelsRef.current.get(channelName) ||
          (clientRef.current ? clientRef.current.subscribe(channelName) : null);
        if (!ch) return;
        ch.bind(eventName, handler);
        channelsRef.current.set(channelName, ch);
      },
      unbind: (
        channelName: string,
        eventName: string,
        handler: (data: any) => void
      ) => {
        const ch = channelsRef.current.get(channelName);
        if (!ch) return;
        ch.unbind(eventName, handler);
      },
    };
  }, []);

  return (
    <PusherChannelsContext.Provider value={value}>
      {children}
    </PusherChannelsContext.Provider>
  );
}

export function usePusherChannels() {
  const ctx = useContext(PusherChannelsContext);
  if (!ctx)
    throw new Error(
      'usePusherChannels must be used within PusherChannelsProvider'
    );
  return ctx;
}

export function usePusherEvent(
  channelName: string,
  eventName: string,
  handler: (data: any) => void,
  deps: React.DependencyList = []
) {
  const { subscribe, bind, unbind } = usePusherChannels();
  useEffect(() => {
    subscribe(channelName);
    bind(channelName, eventName, handler);
    return () => {
      unbind(channelName, eventName, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, eventName, ...deps]);
}
