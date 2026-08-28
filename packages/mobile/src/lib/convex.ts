import { ConvexReactClient } from 'convex/react';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    'Missing EXPO_PUBLIC_CONVEX_URL environment variable. ' +
      'Set it in your .env file or Expo config.'
  );
}

export const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});
