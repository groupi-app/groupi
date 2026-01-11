'use client';

import { create } from 'zustand';
import type Pusher from 'pusher-js';
import type { Channel } from 'pusher-js';
import { pusherClient } from '@/lib/pusher-client';
import { pusherLogger } from '@/lib/logger';
import { logPusherEvent } from '@/lib/pusher-telemetry';
import { useEffect } from 'react';
import type React from 'react';

interface PusherChannelsStore {
  client: Pusher | null;
  isConnected: boolean;
  connectionState: string;
  channels: Map<string, Channel>;
  subscribe: (channelName: string) => Channel | null;
  unsubscribe: (channelName: string) => void;
  bind: (
    channelName: string,
    eventName: string,
    handler: (data: unknown) => void
  ) => void;
  unbind: (
    channelName: string,
    eventName: string,
    handler: (data: unknown) => void
  ) => void;
  // Internal methods
  _setConnectionState: (state: string) => void;
  _setIsConnected: (connected: boolean) => void;
}

// Initialize singleton client
let pusherClientInstance: Pusher | null = null;
if (typeof window !== 'undefined') {
  pusherClientInstance = pusherClient;
}

export const usePusherChannelsStore = create<PusherChannelsStore>(
  (set, get) => ({
    client: pusherClientInstance,
    isConnected: false,
    connectionState: 'disconnected',
    channels: new Map(),

    _setConnectionState: state => set({ connectionState: state }),
    _setIsConnected: connected => set({ isConnected: connected }),

    subscribe: (channelName: string) => {
      const { client, channels } = get();
      if (!client) {
        pusherLogger.warn(
          { channelName },
          'Cannot subscribe: Pusher client not available'
        );
        return null;
      }

      if (channels.has(channelName)) {
        pusherLogger.debug(
          { channelName },
          'Channel already subscribed, returning existing channel'
        );
        return channels.get(channelName)!;
      }

      pusherLogger.info({ channelName }, 'Subscribing to channel');
      try {
        const ch = client.subscribe(channelName);

        // Listen for subscription success
        ch.bind('pusher:subscription_succeeded', () => {
          pusherLogger.info({ channelName }, 'Channel subscription succeeded');
          logPusherEvent({
            event: 'subscribe',
            channel: channelName,
            socketId: client.connection.socket_id,
          });
        });

        // Listen for subscription errors
        ch.bind('pusher:subscription_error', (error: unknown) => {
          pusherLogger.error(
            { channelName, error },
            'Channel subscription error'
          );
        });

        const newChannels = new Map(channels);
        newChannels.set(channelName, ch);
        set({ channels: newChannels });
        pusherLogger.debug(
          { channelName, totalChannels: newChannels.size },
          'Channel subscribed successfully'
        );
        return ch;
      } catch (error) {
        pusherLogger.error(
          { channelName, error },
          'Failed to subscribe to channel'
        );
        throw error;
      }
    },

    unsubscribe: (channelName: string) => {
      const { client, channels } = get();
      if (!client) {
        pusherLogger.warn(
          { channelName },
          'Cannot unsubscribe: Pusher client not available'
        );
        return;
      }

      if (!channels.has(channelName)) {
        pusherLogger.debug(
          { channelName },
          'Channel not subscribed, skipping unsubscribe'
        );
        return;
      }

      pusherLogger.info({ channelName }, 'Unsubscribing from channel');
      try {
        client.unsubscribe(channelName);
        const newChannels = new Map(channels);
        newChannels.delete(channelName);
        set({ channels: newChannels });
        pusherLogger.debug(
          { channelName, totalChannels: newChannels.size },
          'Channel unsubscribed successfully'
        );
        logPusherEvent({
          event: 'unsubscribe',
          channel: channelName,
          socketId: client.connection.socket_id,
        });
      } catch (error) {
        pusherLogger.error(
          { channelName, error },
          'Failed to unsubscribe from channel'
        );
        // Still remove from our tracking even if unsubscribe fails
        const newChannels = new Map(channels);
        newChannels.delete(channelName);
        set({ channels: newChannels });
      }
    },

    bind: (
      channelName: string,
      eventName: string,
      handler: (data: unknown) => void
    ) => {
      const { client, channels } = get();
      const ch =
        channels.get(channelName) ||
        (client ? client.subscribe(channelName) : null);
      if (!ch) {
        pusherLogger.warn(
          { channelName, eventName },
          'Cannot bind event: Channel not available'
        );
        return;
      }

      pusherLogger.debug({ channelName, eventName }, 'Binding event handler');
      try {
        ch.bind(eventName, handler);
        if (!channels.has(channelName)) {
          const newChannels = new Map(channels);
          newChannels.set(channelName, ch);
          set({ channels: newChannels });
        }
        pusherLogger.debug(
          { channelName, eventName },
          'Event handler bound successfully'
        );
      } catch (error) {
        pusherLogger.error(
          { channelName, eventName, error },
          'Failed to bind event handler'
        );
      }
    },

    unbind: (
      channelName: string,
      eventName: string,
      handler: (data: unknown) => void
    ) => {
      const { channels } = get();
      const ch = channels.get(channelName);
      if (!ch) {
        pusherLogger.debug(
          { channelName, eventName },
          'Cannot unbind event: Channel not found'
        );
        return;
      }
      pusherLogger.debug({ channelName, eventName }, 'Unbinding event handler');
      try {
        ch.unbind(eventName, handler);
        pusherLogger.debug(
          { channelName, eventName },
          'Event handler unbound successfully'
        );
      } catch (error) {
        pusherLogger.error(
          { channelName, eventName, error },
          'Failed to unbind event handler'
        );
      }
    },
  })
);

// Hook to initialize connection listeners
export function usePusherChannelsInit() {
  const { client, _setConnectionState, _setIsConnected } =
    usePusherChannelsStore();

  useEffect(() => {
    if (!client) {
      pusherLogger.warn(
        'Pusher client not available, skipping connection listeners'
      );
      return;
    }

    pusherLogger.info('Initializing Pusher connection listeners');

    // Disconnect on page unload to prevent zombie connections
    const handleBeforeUnload = () => {
      pusherLogger.debug('Page unloading, disconnecting Pusher');
      client.disconnect();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const handleConnected = () => {
      pusherLogger.info('Pusher connection established');
      _setIsConnected(true);
      _setConnectionState('connected');
      logPusherEvent({
        event: 'connected',
        socketId: client.connection.socket_id,
      });
    };

    const handleDisconnected = () => {
      pusherLogger.warn('Pusher connection disconnected');
      _setIsConnected(false);
      _setConnectionState('disconnected');
      logPusherEvent({
        event: 'disconnected',
        socketId: client.connection.socket_id,
      });
    };

    const handleStateChange = (states: {
      current: string;
      previous: string;
    }) => {
      pusherLogger.debug(
        {
          previous: states.previous,
          current: states.current,
        },
        'Pusher connection state changed'
      );
      _setConnectionState(states.current);
      logPusherEvent({
        event: 'state_change',
        state: states.current,
        previousState: states.previous,
        socketId: client.connection.socket_id,
      });
    };

    const handleError = (error: { error: { data: unknown; code: number } }) => {
      pusherLogger.error(
        {
          error: error.error.data,
          code: error.error.code,
        },
        'Pusher connection error'
      );
      logPusherEvent({
        event: 'error',
        error: String(error.error.data),
        socketId: client.connection.socket_id,
      });
    };

    const handleUnavailable = () => {
      pusherLogger.warn('Pusher connection unavailable');
    };

    const handleFailed = () => {
      pusherLogger.error('Pusher connection failed');
    };

    const handleReconnected = () => {
      pusherLogger.info('Pusher connection reconnected');
    };

    // Bind connection events
    client.connection.bind('connected', handleConnected);
    client.connection.bind('disconnected', handleDisconnected);
    client.connection.bind('state_change', handleStateChange);
    client.connection.bind('error', handleError);
    client.connection.bind('unavailable', handleUnavailable);
    client.connection.bind('failed', handleFailed);
    client.connection.bind('reconnected', handleReconnected);

    // Log initial connection state
    const initialState = client.connection.state;
    pusherLogger.debug(
      { state: initialState },
      'Initial Pusher connection state'
    );

    return () => {
      pusherLogger.debug('Cleaning up Pusher connection listeners');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      try {
        client.connection.unbind('connected', handleConnected);
        client.connection.unbind('disconnected', handleDisconnected);
        client.connection.unbind('state_change', handleStateChange);
        client.connection.unbind('error', handleError);
        client.connection.unbind('unavailable', handleUnavailable);
        client.connection.unbind('failed', handleFailed);
        client.connection.unbind('reconnected', handleReconnected);
      } catch (error) {
        pusherLogger.error(
          { error },
          'Error cleaning up Pusher connection listeners'
        );
      }
    };
  }, [client, _setConnectionState, _setIsConnected]);
}

// Hook for backward compatibility
export function usePusherChannels() {
  const store = usePusherChannelsStore();
  return {
    client: store.client,
    isConnected: store.isConnected,
    connectionState: store.connectionState,
    subscribe: store.subscribe,
    unsubscribe: store.unsubscribe,
    bind: store.bind,
    unbind: store.unbind,
  };
}

export function usePusherEvent(
  channelName: string,
  eventName: string,
  handler: (data: unknown) => void,
  deps: React.DependencyList = [],
  enabled: boolean = true
) {
  const { subscribe, bind, unbind } = usePusherChannels();

  useEffect(() => {
    // Skip subscription if disabled
    if (!enabled) {
      pusherLogger.debug(
        { channelName, eventName },
        'Pusher event listener disabled, skipping subscription'
      );
      return;
    }

    pusherLogger.debug(
      { channelName, eventName },
      'Setting up Pusher event listener'
    );
    const channel = subscribe(channelName);

    if (!channel) {
      pusherLogger.warn(
        { channelName, eventName },
        'Channel subscription failed, cannot bind event'
      );
      return;
    }

    // Wrap handler to add logging
    const wrappedHandler = (data: unknown) => {
      pusherLogger.debug(
        { channelName, eventName, data },
        'Pusher event handler called'
      );
      handler(data);
    };

    // Check if channel is already subscribed
    // If so, bind immediately. Otherwise, wait for subscription_succeeded.
    // Note: pusher:subscription_succeeded only fires ONCE on initial subscription,
    // not on subsequent subscribe() calls for the same channel.
    const isSubscribed = channel.subscribed;

    if (isSubscribed) {
      // Channel already subscribed, bind immediately
      pusherLogger.debug(
        { channelName, eventName },
        'Channel already subscribed, binding event handler immediately'
      );
      bind(channelName, eventName, wrappedHandler);
    } else {
      // Wait for subscription to succeed
      const bindAfterSubscription = () => {
        pusherLogger.debug(
          { channelName, eventName },
          'Subscription succeeded, binding event handler'
        );
        bind(channelName, eventName, wrappedHandler);
      };
      channel.bind('pusher:subscription_succeeded', bindAfterSubscription);

      // Store reference for cleanup
      (
        channel as Channel & { _bindAfterSubscription?: () => void }
      )._bindAfterSubscription = bindAfterSubscription;
    }

    return () => {
      pusherLogger.debug(
        { channelName, eventName },
        'Cleaning up Pusher event listener'
      );
      if (channel) {
        // Unbind subscription_succeeded handler if it was set
        const bindAfterSubscription = (
          channel as Channel & { _bindAfterSubscription?: () => void }
        )._bindAfterSubscription;
        if (bindAfterSubscription) {
          channel.unbind(
            'pusher:subscription_succeeded',
            bindAfterSubscription
          );
        }
      }
      unbind(channelName, eventName, wrappedHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, eventName, enabled, ...deps]);
}
