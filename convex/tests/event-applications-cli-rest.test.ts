import { expect, it } from 'vitest';
import { cliRestBridge } from './cli-rest-bridge.helpers';
import { api } from '../_generated/api';
it('runs real CLI application lifecycle through authenticated REST and preserves events scoped keys', async () => {
  const bridge = await cliRestBridge();
  try {
    const owner = await bridge.actor('apps-cli-owner'),
      author = await bridge.actor('apps-cli-author');
    const created = await (
      await owner.request('/events', 'POST', { title: 'Apply' })
    ).json();
    const id = bridge.wireId(created.eventId);
    for (const args of [
      [
        'events',
        'settings',
        'set',
        id,
        '--visibility',
        'PUBLIC',
        '--admission-policy',
        'APPLY',
      ],
      [
        'events',
        'applications',
        'configure',
        id,
        '--questions',
        JSON.stringify([
          { id: 'why', type: 'SHORT_ANSWER', label: 'Why?', required: true },
        ]),
      ],
    ]) {
      const result = await bridge.cli(owner.rawKey, args);
      expect(result.code, result.stderr).toBe(0);
    }
    const preview = await bridge.cli(author.rawKey, ['events', 'preview', id]);
    expect(preview.code, preview.stderr).toBe(0);
    expect(JSON.parse(preview.stdout).entryAction).toBe('APPLY');
    const submitted = await bridge.cli(author.rawKey, [
      'events',
      'applications',
      'submit',
      id,
      '--answers',
      '{"why":"Learn"}',
    ]);
    expect(submitted.code, submitted.stderr).toBe(0);
    const applicationId = JSON.parse(submitted.stdout).applicationId;
    const approve = await bridge.cli(owner.rawKey, [
      'events',
      'applications',
      'approve',
      applicationId,
    ]);
    expect(approve.code, approve.stderr).toBe(0);
    const own = await bridge.cli(author.rawKey, [
      'events',
      'applications',
      'history',
      id,
    ]);
    expect(JSON.parse(own.stdout).page[0].status).toBe('APPROVED');
    const protectedResult = await bridge.cli(author.rawKey, [
      'events',
      'applications',
      'list',
      id,
    ]);
    expect(protectedResult.code).not.toBe(0);
    expect(
      (
        await author.auth.query(api.events.queries.getEventHeader, {
          eventId: created.eventId,
        })
      ).userMembership.rsvpStatus
    ).toBe('PENDING');
  } finally {
    await bridge.close();
  }
}, 20000);
