import { ConvexReactClient } from 'convex/react';
import { api } from '@/convex/_generated/api';

// 🚀 Convex client with optimized configuration
export const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!,
  {
    // 🗄️ Enhanced caching configuration for performance
    unsavedChangesWarning: false, // Disabled for better UX with optimistic updates
    verbose: process.env.NODE_ENV === 'development',
  }
);

// 🎯 Export the generated API for type-safe function calls
export { api };

// 🎯 Type-safe configuration
export const convexConfig = {
  // Cache configuration
  cache: {
    maxIdleTime: 5 * 60 * 1000, // Keep data for 5 minutes after unsubscribe
    optimisticUpdateTimeout: 10000, // 10 seconds for optimistic update timeout
  },

  // Performance settings
  performance: {
    prefetchOnHover: true,
    prefetchDelay: 300, // ms
    batchQueries: true,
  },

  // Real-time settings
  realtime: {
    enableSubscriptions: true,
    reconnectAttempts: 5,
    reconnectDelay: 1000, // ms
  },
} as const;

// 🔧 Development helpers
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
