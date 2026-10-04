// @vitest-environment node
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { cliRestBridge } from './cli-rest-bridge.helpers';

it('public executable authors portable definitions through authenticated REST and preserves event snapshots', async () => {
  const b = await cliRestBridge();
  const dir = await mkdtemp(join(tmpdir(), 'groupi-authoring-test-'));
  try {
    const owner = await b.actor('definition-owner');
    const outsider = await b.actor('definition-outsider');
    const document = {
      schemaVersion: 1,
      name: 'Meals',
      description: 'Choose your meal',
      iconName: 'listChecks',
      template: {
        name: 'Meals',
        description: 'Choose your meal',
        iconName: 'listChecks',
        sections: [
          {
            id: 'meal',
            title: 'Meal',
            fields: [
              {
                id: 'choice',
                type: 'text',
                label: 'Choice',
                required: true,
                configurable: true,
                maxLength: 100,
              },
            ],
          },
        ],
      },
    };
    const file = join(dir, 'definition.json');
    await writeFile(file, JSON.stringify(document));
    const run = (args: string[], key = owner.rawKey) =>
      b.cli(key, ['addons', 'definitions', ...args]);
    const success = async (args: string[]) => {
      const result = await run(args);
      expect(result.code, result.stderr).toBe(0);
      return JSON.parse(result.stdout);
    };
    const saved = await success(['create', '--file', file]);
    expect(saved).toMatchObject({
      name: document.name,
      version: 1,
      isPublished: false,
    });
    expect(await success(['get', saved.id])).toEqual(saved);
    const exported = await run(['export', saved.id]);
    expect(exported.code, exported.stderr).toBe(0);
    expect(JSON.parse(exported.stdout)).toEqual(document);
    const exportedFile = join(dir, 'export.json');
    await writeFile(exportedFile, exported.stdout);
    const imported = await success(['import', '--file', exportedFile]);
    expect(imported.id).not.toBe(saved.id);
    expect(imported.template).toEqual(document.template);
    expect(
      (await success(['list', '--all', '--limit', '1'])).items
    ).toHaveLength(2);
    expect((await run(['get', saved.id], outsider.rawKey)).code).not.toBe(0);
    expect(
      (
        await run(
          [
            'edit',
            saved.id,
            '--file',
            file,
            '--expected-version',
            '1',
            '--yes',
          ],
          outsider.rawKey
        )
      ).code
    ).not.toBe(0);
    expect(
      (
        await run(
          ['publish', saved.id, '--expected-version', '1', '--yes'],
          outsider.rawKey
        )
      ).code
    ).not.toBe(0);
    expect(
      (
        await run(
          ['delete', saved.id, '--expected-version', '1', '--yes'],
          outsider.rawKey
        )
      ).code
    ).not.toBe(0);
    const bad = join(dir, 'bad.json');
    await writeFile(bad, '{bad');
    expect(
      (
        await run([
          'edit',
          saved.id,
          '--file',
          bad,
          '--expected-version',
          '1',
          '--yes',
        ])
      ).code
    ).not.toBe(0);
    await writeFile(
      bad,
      JSON.stringify({
        ...document,
        template: {
          ...document.template,
          sections: [
            {
              id: 's',
              title: 'Choose',
              fields: [
                {
                  id: 'choice',
                  label: 'Choice',
                  type: 'select',
                  required: true,
                },
              ],
            },
          ],
        },
      })
    );
    const invalidChoice = await run([
      'edit',
      saved.id,
      '--file',
      bad,
      '--expected-version',
      '1',
      '--yes',
    ]);
    expect(invalidChoice.code).not.toBe(0);
    expect(invalidChoice.stderr).toContain('template.sections.0.fields.0');
    expect(invalidChoice.stderr).toContain('options');
    await writeFile(
      bad,
      JSON.stringify({
        ...document,
        template: {
          ...document.template,
          onSubmitActions: [
            { type: 'send_webhook', webhookUrl: 'http://localhost' },
          ],
        },
      })
    );
    expect(
      (
        await run([
          'edit',
          saved.id,
          '--file',
          bad,
          '--expected-version',
          '1',
          '--yes',
        ])
      ).code
    ).not.toBe(0);
    expect(await success(['get', saved.id])).toEqual(saved);
    const published = await success([
      'publish',
      saved.id,
      '--expected-version',
      '1',
      '--yes',
    ]);
    expect(published).toMatchObject({ version: 2, isPublished: true });
    const eventResponse = await owner.request('/events', 'POST', {
      title: 'Definition event',
    });
    expect(eventResponse.status).toBe(201);
    const event = await eventResponse.json();
    const enabled = await b.cli(owner.rawKey, [
      'addons',
      'enable',
      b.wireId(event.eventId),
      'custom:' + saved.id,
      '--template-id',
      saved.id,
      '--yes',
    ]);
    expect(enabled.code, enabled.stderr).toBe(0);
    const response = await b.cli(owner.rawKey, [
      'addons',
      'respond',
      b.wireId(event.eventId),
      'custom:' + saved.id,
      '--data',
      '{"choice":"Rice"}',
    ]);
    expect(response.code, response.stderr).toBe(0);
    const participation = await b.t.run(ctx =>
      ctx.db.query('addonData').collect()
    );
    await writeFile(
      file,
      JSON.stringify({
        ...document,
        name: 'Updated',
        template: { ...document.template, name: 'Updated' },
      })
    );
    expect(
      await success([
        'edit',
        saved.id,
        '--file',
        file,
        '--expected-version',
        '2',
        '--yes',
      ])
    ).toMatchObject({ version: 3, isPublished: true, name: 'Updated' });
    expect(
      (
        await run([
          'edit',
          saved.id,
          '--file',
          file,
          '--expected-version',
          '2',
          '--yes',
        ])
      ).code
    ).not.toBe(0);
    await success(['unpublish', saved.id, '--expected-version', '3', '--yes']);
    expect(
      await success(['delete', saved.id, '--expected-version', '4', '--yes'])
    ).toEqual({ id: saved.id, deleted: true });
    const configured = await b.cli(owner.rawKey, [
      'addons',
      'get',
      b.wireId(event.eventId),
      'custom:' + saved.id,
    ]);
    expect(configured.code, configured.stderr).toBe(0);
    expect(JSON.parse(configured.stdout).config.template).toEqual(
      document.template
    );
    expect(await b.t.run(ctx => ctx.db.query('addonData').collect())).toEqual(
      participation
    );
  } finally {
    await b.close();
    await rm(dir, { recursive: true, force: true });
  }
}, 30000);
