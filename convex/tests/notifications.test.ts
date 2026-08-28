import { describe, expect, test } from 'vitest';
import { api } from './_generated/api';
import { createTestInstance, TestScenarios } from './test_helpers';

describe('Notifications Domain', () => {
  test('paginates without repeating notifications', async () => {
    const t = createTestInstance();
    const { personId, auth } = await TestScenarios.simpleUser(t);

    await t.run(async ctx => {
      for (let index = 0; index < 5; index += 1) {
        await ctx.db.insert('notifications', {
          personId,
          type: 'EVENT_EDITED',
          read: false,
        });
      }
    });

    const firstPage = await auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      { limit: 2 }
    );
    expect(firstPage.notifications).toHaveLength(2);
    expect(firstPage.nextCursor).not.toBeNull();

    const secondPage = await auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      { limit: 2, cursor: firstPage.nextCursor! }
    );
    expect(secondPage.notifications).toHaveLength(2);
    expect(secondPage.nextCursor).not.toBeNull();

    const finalPage = await auth.query(
      api.notifications.queries.fetchNotificationsForPerson,
      { limit: 2, cursor: secondPage.nextCursor! }
    );
    expect(finalPage.notifications).toHaveLength(1);
    expect(finalPage.nextCursor).toBeNull();

    const ids = [
      ...firstPage.notifications,
      ...secondPage.notifications,
      ...finalPage.notifications,
    ].map(notification => notification._id);

    expect(new Set(ids).size).toBe(5);
  });
});
