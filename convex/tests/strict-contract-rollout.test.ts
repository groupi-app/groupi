import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import schema from '../schema';
import { template } from '../addons/contracts';
import { internal } from '../_generated/api';

// Historical schema sample: rollout functions must work before strict schema cutover.
const legacySchema = defineSchema({
  ...schema.tables,
  notificationMethods: defineTable({
    ...schema.tables.notificationMethods.validator.fields,
    webhookHeaders: v.optional(
      v.union(v.string(), v.record(v.string(), v.string()))
    ),
  }),
  addonTemplates: defineTable({
    ...schema.tables.addonTemplates.validator.fields,
    template: v.union(
      template,
      v.object({
        sections: v.array(
          v.object({
            id: v.string(),
            title: v.string(),
            fields: v.array(
              v.object({
                id: v.string(),
                type: v.literal('text'),
                required: v.boolean(),
                label: v.string(),
              })
            ),
          })
        ),
      })
    ),
  }),
});
const modules = import.meta.glob('../**/*.{ts,js}');

describe('Strict contract rollout', () => {
  it('audits legacy values without disclosing payloads, then normalizes deterministically and idempotently', async () => {
    const t = convexTest(legacySchema, modules);
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
  it('retains malformed header values for operator review instead of discarding them', async () => {
    const t = convexTest(legacySchema, modules);
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
