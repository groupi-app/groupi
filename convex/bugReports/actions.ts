'use node';
import { createHash, randomUUID } from 'node:crypto';
import { internal } from '../_generated/api';
import { validateImages } from './images';
import { sendFeedback, configuredDestination } from './sender';
import { internalAction } from '../_generated/server';
import { result, submission } from './contracts';
import { v, type Infer } from 'convex/values';
import { BUG_REPORT_LIMITS, validateBugReportText } from '@groupi/shared/utils';

export const submit = internalAction({
  args: { report: submission, networkKey: v.string() },
  returns: result,
  handler: async (
    ctx,
    { report: args, networkKey }
  ): Promise<Infer<typeof result>> => {
    const startedAt = Date.now();
    const fail = (code: string) => ({ status: 'failed' as const, code });
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        args.submissionId
      )
    )
      return fail('invalid-submission-id');
    if (args.replayId !== undefined && !args.includeReplay)
      return fail('replay-without-consent');
    if (args.includeReplay && !args.replayId) return fail('replay-unavailable');
    if (args.replayId && !/^[0-9a-f]{32}$/i.test(args.replayId))
      return fail('invalid-replay');
    if (
      args.context?.release &&
      !/^[a-zA-Z0-9._@+-]{1,100}$/.test(args.context.release)
    )
      return fail('invalid-context');
    const text = validateBugReportText(args);
    if (!text.valid) return { status: 'failed' as const, code: text.code };
    if (
      Buffer.byteLength(JSON.stringify({ report: args, networkKey }), 'utf8') >
      BUG_REPORT_LIMITS.requestBytes
    )
      return fail('request-too-large');
    if ((args.images?.length ?? 0) > BUG_REPORT_LIMITS.imageCount)
      return fail('image-count');
    let imageBytes = 0;
    for (const image of args.images ?? []) {
      if (image.base64.length > Math.ceil(BUG_REPORT_LIMITS.imageBytes / 3) * 4)
        return fail('images-too-large');
      if (
        !image.base64.length ||
        image.base64.length % 4 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(image.base64)
      )
        return fail('invalid-image');
      imageBytes +=
        (image.base64.length / 4) * 3 -
        (image.base64.endsWith('==') ? 2 : image.base64.endsWith('=') ? 1 : 0);
    }
    if (imageBytes > BUG_REPORT_LIMITS.imageBytes)
      return fail('images-too-large');
    if (!configuredDestination()) return fail('unavailable');
    const payloadDigest = createHash('sha256')
      .update(
        JSON.stringify({
          description: args.description,
          reproductionSteps: args.reproductionSteps,
          replyEmail: args.replyEmail,
          images: args.images,
          includeReplay: args.includeReplay,
          replayId: args.replayId,
          context: args.context,
        })
      )
      .digest('hex');
    const reserved = await ctx.runMutation(
      internal.bugReports.receipts.reserve,
      {
        submissionId: args.submissionId,
        payloadDigest,
        networkKey,
        eventId: randomUUID().replaceAll('-', ''),
      }
    );
    if (reserved.kind === 'result') return reserved.result;
    let images;
    try {
      images = await validateImages(
        (args.images ?? []).map(image => {
          const bytes = Buffer.from(image.base64, 'base64');
          if (bytes.toString('base64') !== image.base64)
            throw new Error('invalid image encoding');
          return {
            bytes: new Uint8Array(bytes).buffer,
            mimeType: image.mimeType,
          };
        })
      );
    } catch {
      const outcome = fail('invalid-image');
      await ctx.runMutation(internal.bugReports.receipts.finish, {
        submissionId: args.submissionId,
        eventId: reserved.eventId,
        outcome,
      });
      return outcome;
    }
    const sent = await sendFeedback(
      {
        message: text.message,
        email: args.replyEmail?.trim() || undefined,
        replayId: args.replayId,
        release: args.context?.release,
      },
      reserved.eventId,
      images
    );
    await ctx.runMutation(internal.bugReports.receipts.finish, {
      submissionId: args.submissionId,
      eventId: reserved.eventId,
      outcome: sent,
    });
    console.info('bug_report_delivery', {
      status: sent.status,
      code: 'code' in sent ? sent.code : 'accepted',
      durationMs: Date.now() - startedAt,
    });
    return sent;
  },
});
