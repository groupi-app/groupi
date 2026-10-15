import { describe, expect, it } from 'vitest';
import { api, components } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

async function setup() {
  const t = createTestInstance();
  registerBetterAuth(t);
  const reporter = await createAuthAccount(t, 'reporter');
  const author = await createAuthAccount(t, 'author');
  const rawKey = 'grp_reports_parity_key';
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(rawKey)
  );
  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        userId: reporter.user._id,
        key: btoa(String.fromCharCode(...new Uint8Array(hash)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enabled: true,
      },
    },
  });
  async function targets(owner = author) {
    return t.run(async ctx => {
      const eventId = await ctx.db.insert('events', {
        title: 'Reported event',
        creatorId: owner.personId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        timezone: 'UTC',
        potentialDateTimes: [],
      });
      const postId = await ctx.db.insert('posts', {
        title: 'Post',
        content: 'Content',
        eventId,
        authorId: owner.personId,
      });
      const replyId = await ctx.db.insert('replies', {
        text: 'Reply',
        postId,
        authorId: owner.personId,
      });
      return {
        USER: owner.personId,
        EVENT: eventId,
        POST: postId,
        REPLY: replyId,
      };
    });
  }
  const request = (version: 'v1' | 'v2', body: unknown) =>
    t.fetch(`/api/${version}/reports`, {
      method: 'POST',
      headers: { 'x-api-key': rawKey, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  return { t, reporter, targets, request };
}

const targetTypes = ['USER', 'EVENT', 'POST', 'REPLY'] as const;
describe('Reports use shared target policy', () => {
  it.each(['v1', 'v2'] as const)(
    '%s rejects self reports for every target type',
    async version => {
      const { t, reporter, targets, request } = await setup();
      const own = await targets(reporter);
      for (const targetType of targetTypes) {
        const body = {
          targetType,
          targetId: own[targetType],
          reason: 'SPAM' as const,
        };
        await expect(
          reporter.auth.mutation(api.reports.mutations.createReport, body)
        ).rejects.toThrow();
        const response = await request(version, body);
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({
          error: { code: 'BAD_REQUEST' },
        });
      }
      expect(await t.run(ctx => ctx.db.query('reports').collect())).toEqual([]);
    }
  );
  it.each(['v1', 'v2'] as const)(
    '%s rejects deleted targets without storing a report',
    async version => {
      const { t, reporter, targets, request } = await setup();
      const missing = await targets();
      for (const targetType of targetTypes) {
        await t.run(ctx => ctx.db.delete(missing[targetType]));
        const body = {
          targetType,
          targetId: missing[targetType],
          reason: 'OTHER' as const,
        };
        await expect(
          reporter.auth.mutation(api.reports.mutations.createReport, body)
        ).rejects.toThrow();
        expect((await request(version, body)).status).toBe(400);
      }
      expect(await t.run(ctx => ctx.db.query('reports').collect())).toEqual([]);
    }
  );
  it.each(['native', 'v1', 'v2'] as const)(
    '%s derives report context, normalizes details, and prevents duplicates',
    async transport => {
      const { t, reporter, targets, request } = await setup();
      const content = await targets();
      for (const targetType of targetTypes) {
        const details =
          targetType === 'USER' ? '   ' : `  ${'x'.repeat(1500)}  `;
        const body = {
          targetType,
          targetId: content[targetType],
          reason: 'SPAM' as const,
          details,
        };
        let reportId: Id<'reports'>;
        if (transport === 'native') {
          reportId = await reporter.auth.mutation(
            api.reports.mutations.createReport,
            body
          );
        } else {
          const response = await request(transport, body);
          expect(response.status).toBe(201);
          const result = await response.json();
          if (transport === 'v1') {
            expect(result).toMatchObject({
              success: true,
              data: { reportId: expect.any(String) },
            });
            reportId = result.data.reportId;
          } else {
            expect(result).toEqual({ reportId: expect.any(String) });
            reportId = result.reportId;
          }
        }
        const stored = await t.run(ctx => ctx.db.get(reportId));
        expect(stored).toMatchObject({
          reporterId: reporter.personId,
          targetType,
          targetId: content[targetType],
          reason: 'SPAM',
          status: 'PENDING',
        });
        expect(stored?.details).toBe(
          targetType === 'USER' ? undefined : 'x'.repeat(1000)
        );
        expect(stored?.contextEventId).toBe(
          targetType === 'USER' ? undefined : content.EVENT
        );
        expect(stored?.contextPostId).toBe(
          targetType === 'POST' || targetType === 'REPLY'
            ? content.POST
            : undefined
        );
        if (transport === 'native') {
          await expect(
            reporter.auth.mutation(api.reports.mutations.createReport, body)
          ).rejects.toThrow('already reported');
        } else {
          const duplicate = await request(transport, body);
          expect(duplicate.status).toBe(400);
          expect(await duplicate.json()).toMatchObject({
            error: {
              code: 'BAD_REQUEST',
              message: expect.stringContaining('already reported'),
            },
          });
        }
      }
      expect(
        await t.run(ctx => ctx.db.query('reports').collect())
      ).toHaveLength(4);
    }
  );

  it.each(['v1', 'v2'] as const)(
    '%s rejects an ID from the wrong target table',
    async version => {
      const { t, reporter, request } = await setup();
      const body = {
        targetType: 'POST' as const,
        targetId: reporter.personId,
        reason: 'SPAM' as const,
      };
      expect((await request(version, body)).status).toBe(400);
      await expect(
        reporter.auth.mutation(api.reports.mutations.createReport, body)
      ).rejects.toThrow('Post not found');
      expect(await t.run(ctx => ctx.db.query('reports').collect())).toEqual([]);
    }
  );
});
