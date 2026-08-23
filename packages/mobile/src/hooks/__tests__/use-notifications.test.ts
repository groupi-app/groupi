import { describe, expect, test } from 'vitest';

import type { Id } from 'convex/_generated/dataModel';
import {
  getNotificationDestination,
  getNotificationMessage,
  type NotificationPresentationInput,
} from '@/lib/notification-presentation';

function createNotification(
  overrides: Partial<NotificationPresentationInput> = {}
): NotificationPresentationInput {
  return {
    type: 'EVENT_EDITED',
    event: null,
    post: null,
    author: null,
    ...overrides,
  };
}

describe('notification presentation', () => {
  test('describes the author, post, and event for a new post', () => {
    const notification = createNotification({
      type: 'NEW_POST',
      eventId: 'event-1' as Id<'events'>,
      postId: 'post-1' as Id<'posts'>,
      event: { id: 'event-1' as Id<'events'>, title: 'Beach day' },
      post: { id: 'post-1' as Id<'posts'>, title: 'What to bring' },
      author: {
        user: {
          name: 'Avery',
          email: 'avery@example.com',
          username: 'avery',
        },
      },
    });

    expect(getNotificationMessage(notification)).toBe(
      'Avery posted “What to bring” in Beach day'
    );
    expect(getNotificationDestination(notification)).toBe(
      '/event/event-1/post/post-1'
    );
  });

  test('routes friend and invite notifications to their mobile destinations', () => {
    expect(
      getNotificationDestination(
        createNotification({ type: 'FRIEND_REQUEST_RECEIVED' })
      )
    ).toBe('/friends');
    expect(
      getNotificationDestination(
        createNotification({ type: 'EVENT_INVITE_RECEIVED' })
      )
    ).toBe('/invites');
  });
});
