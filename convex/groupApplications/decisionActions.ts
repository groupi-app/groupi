'use node';
import { internalAction } from '../_generated/server';
import { v } from 'convex/values';
import { internal } from '../_generated/api';
export const send = internalAction({
  args: { applicationId: v.id('groupApplications') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const batch = await ctx.runMutation(
      internal.groupApplications.decisionDelivery.claim,
      args
    );
    if (!batch) return null;
    const delivered: string[] = [];
    let failed = false;
    for (const message of batch.messages) {
      try {
        if (!process.env.RESEND_API_KEY) throw new Error('Sender unavailable');
        const { key, ...body } = message;
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': key,
          },
          body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error('Provider delivery failed');
        delivered.push(key);
      } catch {
        failed = true;
      }
    }
    await ctx.runMutation(internal.groupApplications.decisionDelivery.finish, {
      dispatchId: batch.dispatchId,
      attempt: batch.attempt,
      delivered,
      failed,
    });
    return null;
  },
});
