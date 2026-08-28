import { describe, expect, it, vi } from 'vitest';

import { normalizeNotificationMethods } from '../use-settings';

vi.mock('../../context/global-user-context', () => ({
  useGlobalUser: () => ({ isAuthenticated: true }),
}));

type QueriedMethods = Parameters<typeof normalizeNotificationMethods>[0];

function asQueriedMethods(value: unknown): QueriedMethods {
  return value as QueriedMethods;
}

describe('normalizeNotificationMethods', () => {
  it('serializes webhook headers and preserves supported preferences', () => {
    const methods = asQueriedMethods([
      {
        id: 'method-1',
        type: 'WEBHOOK',
        enabled: true,
        name: 'Operations',
        value: 'https://example.com/hooks/groupi',
        webhookFormat: 'SLACK',
        webhookHeaders: { Authorization: 'Bearer token' },
        notifications: [
          { notificationType: 'EVENT_EDITED', enabled: true },
          { notificationType: 'ADDON_AUTOMATION', enabled: false },
        ],
      },
    ]);

    expect(normalizeNotificationMethods(methods)).toEqual([
      expect.objectContaining({
        id: 'method-1',
        webhookHeaders: '{"Authorization":"Bearer token"}',
        notifications: [
          { notificationType: 'EVENT_EDITED', enabled: true },
          { notificationType: 'ADDON_AUTOMATION', enabled: false },
        ],
      }),
    ]);
  });

  it('passes through serialized headers and drops unknown server values', () => {
    const methods = asQueriedMethods([
      {
        id: 'method-2',
        type: 'EMAIL',
        enabled: true,
        value: 'avery@example.com',
        webhookHeaders: '{"X-Groupi":"1"}',
        notifications: [
          { notificationType: 'EVENT_REMINDER', enabled: true },
          { notificationType: 'LEGACY_NOTIFICATION', enabled: true },
        ],
      },
    ]);

    expect(normalizeNotificationMethods(methods)[0]).toEqual(
      expect.objectContaining({
        webhookHeaders: '{"X-Groupi":"1"}',
        notifications: [{ notificationType: 'EVENT_REMINDER', enabled: true }],
      })
    );
  });

  it('omits headers that cannot be serialized', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const methods = asQueriedMethods([
      {
        id: 'method-3',
        type: 'PUSH',
        enabled: true,
        value: 'device',
        webhookHeaders: circular,
        notifications: [],
      },
    ]);

    expect(normalizeNotificationMethods(methods)[0]?.webhookHeaders).toBe(
      undefined
    );
  });
});
