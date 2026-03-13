'use node';

import { internalAction } from '../../_generated/server';
import { v } from 'convex/values';

/**
 * Send an HTTP webhook as part of an automation action.
 * Runs as a Convex action (Node.js runtime) so it can make HTTP requests.
 */
export const sendWebhook = internalAction({
  args: {
    url: v.string(),
    payload: v.string(), // JSON-stringified body
    headers: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (_ctx, { url, payload, headers }) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: payload,
      });

      if (!response.ok) {
        console.error(
          `Automation webhook failed: ${response.status} ${response.statusText} for ${url}`
        );
      }

      return { status: response.status, ok: response.ok };
    } catch (error) {
      console.error(
        'Automation webhook error:',
        error instanceof Error ? error.message : error
      );
      return { status: 0, ok: false };
    }
  },
});
