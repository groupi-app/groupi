import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../schema';
import { internal } from '../_generated/api';

// Exercise the exact production schema unchanged, before strict cutover.
const modules = import.meta.glob('../**/*.{ts,js}');

describe('Strict contract rollout', () => {
  it('audits legacy values without disclosing payloads, then normalizes deterministically and idempotently', async () => {
    const t = convexTest(schema, modules);
    await t.run(async ctx => {
      const personId = await ctx.db.insert('persons', {
        userId: 'legacy',
        updatedAt: 1,
      });
      const settingsId = await ctx.db.insert('personSettings', {
        personId,
        updatedAt: 1,
      });
      await ctx.db.insert('notificationMethods', {
        settingsId,
        type: 'WEBHOOK',
        enabled: true,
        value: 'https://example.com',
        webhookHeaders: '{"Authorization":"private"}',
        updatedAt: 1,
      });
      await ctx.db.insert('addonTemplates', {
        ownerId: personId,
        name: 'Draft',
        description: 'Saved',
        iconName: 'List',
        template: { sections: [] },
        version: 4,
        isPublished: false,
        createdAt: 1,
        updatedAt: 1,
      });
    });
    const args = {
      table: 'notificationMethods' as const,
      cursor: null,
      limit: 100,
    };
    const audit = await t.query(internal.migration.strictContracts.audit, args);
    expect(audit.findings.map(item => item.reason)).toEqual(['legacy_headers']);
    expect(JSON.stringify(audit)).not.toContain('private');
    const first = await t.mutation(
      internal.migration.strictContracts.normalize,
      args
    );
    expect(first.normalized).toBe(1);
    expect(first.unresolvedIds).toEqual([]);
    expect(
      (await t.query(internal.migration.strictContracts.audit, args)).findings
    ).toEqual([]);
    expect(
      (await t.mutation(internal.migration.strictContracts.normalize, args))
        .normalized
    ).toBe(0);
    const templates = { ...args, table: 'addonTemplates' as const };
    expect(
      (
        await t.query(internal.migration.strictContracts.audit, templates)
      ).findings.map(item => item.reason)
    ).toEqual(['invalid_template']);
    expect(
      (
        await t.mutation(
          internal.migration.strictContracts.normalize,
          templates
        )
      ).normalized
    ).toBe(1);
    expect(
      (await t.query(internal.migration.strictContracts.audit, templates))
        .findings
    ).toEqual([]);
    expect(
      (
        await t.mutation(
          internal.migration.strictContracts.normalize,
          templates
        )
      ).normalized
    ).toBe(0);
  });
  it('pages without writes and preserves unsupported legacy payloads and metadata', async () => {
    const t = convexTest(schema, modules);
    const ids = await t.run(async ctx => {
      const personId = await ctx.db.insert('persons', {
        userId: 'audit-owner',
        updatedAt: 1,
      });
      const settingsId = await ctx.db.insert('personSettings', {
        personId,
        updatedAt: 1,
      });
      return Promise.all(
        ['{"Key":"value"}', '{"Key":3}', ['unsupported']].map(webhookHeaders =>
          ctx.db.insert('notificationMethods', {
            settingsId,
            type: 'WEBHOOK',
            enabled: true,
            value: 'https://example.com',
            webhookHeaders,
            updatedAt: 7,
          })
        )
      );
    });
    const before = await t.run(ctx =>
      Promise.all(ids.map(id => ctx.db.get(id)))
    );
    let cursor: string | null = null;
    const findings = [];
    do {
      const page = await t.query(internal.migration.strictContracts.audit, {
        table: 'notificationMethods',
        cursor,
        limit: 1,
      });
      expect(page.inspected).toBeLessThanOrEqual(1);
      findings.push(...page.findings);
      cursor = page.nextCursor;
    } while (cursor !== null);
    expect(findings.map(item => item.reason)).toEqual([
      'legacy_headers',
      'invalid_headers',
      'invalid_headers',
    ]);
    expect(
      await t.run(ctx => Promise.all(ids.map(id => ctx.db.get(id))))
    ).toEqual(before);
    const normalized = await t.mutation(
      internal.migration.strictContracts.normalize,
      { table: 'notificationMethods', cursor: null, limit: 100 }
    );
    expect(normalized.normalized).toBe(1);
    expect(normalized.unresolvedIds).toEqual(ids.slice(1));
    const after = await t.run(ctx =>
      Promise.all(ids.map(id => ctx.db.get(id)))
    );
    expect(after.slice(1)).toEqual(before.slice(1));
    expect(after[0]).toEqual({
      ...before[0],
      webhookHeaders: { Key: 'value' },
    });
  });
  it('retains malformed header values for operator review instead of discarding them', async () => {
    const t = convexTest(schema, modules);
    await t.run(async ctx => {
      const personId = await ctx.db.insert('persons', {
        userId: 'legacy',
        updatedAt: 1,
      });
      const settingsId = await ctx.db.insert('personSettings', {
        personId,
        updatedAt: 1,
      });
      await ctx.db.insert('notificationMethods', {
        settingsId,
        type: 'WEBHOOK',
        enabled: true,
        value: 'https://example.com',
        webhookHeaders: '{"Retry":3}',
        updatedAt: 1,
      });
    });
    const args = {
      table: 'notificationMethods' as const,
      cursor: null,
      limit: 100,
    };
    const result = await t.mutation(
      internal.migration.strictContracts.normalize,
      args
    );
    expect(result.normalized).toBe(0);
    expect(result.unresolvedIds).toHaveLength(1);
    expect(
      (
        await t.query(internal.migration.strictContracts.audit, args)
      ).findings.map(item => item.reason)
    ).toEqual(['invalid_headers']);
  });
});
