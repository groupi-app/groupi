import { Icons } from '@/components/icons';
import { PotentialDateTimeWithAvailabilities } from '@/types';
import { $Enums } from '@prisma/client';
import React from 'react';

// Import shared utilities and design tokens
export {
  cn,
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  animations,
  breakpoints,
} from '@groupi/ui';

export function formatDate(date: Date) {
  var seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  var interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + 'y ago';
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + 'mon ago';
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + 'd ago';
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + 'h ago';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + 'min ago';
  }
  if (seconds < 10) {
    return 'just now';
  }
  return Math.floor(seconds) + ' seconds ago';
}

export function timeUntil(date: Date) {
  var seconds = Math.floor((date.getTime() - Date.now()) / 1000);

  var interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + 'y';
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + 'mon';
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + 'd';
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + 'h';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + 'min';
  }
  if (seconds < 0) {
    return 'Expired';
  }
  return Math.floor(seconds) + 's';
}

// Helper for extracting initials from User.name field
export function getInitialsFromName(
  name: string | null | undefined,
  fallback?: string | undefined
): string {
  if (!name) {
    return fallback?.slice(0, 2).toUpperCase() || '??';
  }
  const parts = name.split(' ').filter(p => p);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function formatRoleName(role: $Enums.Role | undefined) {
  if (!role) {
    return 'Unknown';
  }
  switch (role) {
    case 'ATTENDEE':
      return 'Attendee';
    case 'MODERATOR':
      return 'Moderator';
    case 'ORGANIZER':
      return 'Organizer';
    default:
      return 'Unknown';
  }
}

export function formatRoleBadge(role: $Enums.Role | undefined) {
  if (!role) {
    return 'Unknown';
  }
  switch (role) {
    case 'ATTENDEE':
      return React.createElement(Icons.account, { className: 'size-4' });
    case 'MODERATOR':
      return React.createElement(Icons.shield, { className: 'size-4' });
    case 'ORGANIZER':
      return React.createElement(Icons.crown, { className: 'size-4' });
    default:
      return React.createElement('<span>Unknown</span>');
  }
}

export function merge<T>(
  a: T[],
  b: T[],
  predicate = (a: T, b: T) => a === b
): T[] {
  const c = [...a]; // copy to avoid side effects
  // add all items from B to copy C if they're not already present
  b.forEach((bItem: T) =>
    c.some(cItem => predicate(bItem, cItem)) ? null : c.push(bItem)
  );
  return c;
}

export function getRanks(pdts: PotentialDateTimeWithAvailabilities[]) {
  // Calculate scores for each potential date time
  const scoreMap = pdts.map(pdt => {
    const score = pdt.availabilities.reduce((acc, availability) => {
      return (
        acc +
        (availability.status === 'YES'
          ? 2
          : availability.status === 'MAYBE'
            ? 1
            : 0)
      );
    }, 0);
    return { pdt, score };
  });

  // Sort by score in descending order
  scoreMap.sort((a, b) => b.score - a.score);

  // Assign ranks with numbers being skipped after ties
  let rank = 1;
  let previousScore = scoreMap[0]?.score;
  return scoreMap.map((item, index) => {
    if (index > 0 && item.score < previousScore) {
      rank = index + 1;
      previousScore = item.score;
    }
    return {
      rank: rank,
      ...item.pdt,
    };
  });
}

type NotificationForSubject = {
  type: string;
  event?: { title?: string } | null;
  post?: { title?: string } | null;
  author?: { user: { name?: string | null; email?: string } } | null;
  rsvp?: string | null;
};

export function getNotificationSubject(
  notification: NotificationForSubject
): string {
  const { type, event, post, author, rsvp } = notification;

  // Helper to get author name
  const getAuthorName = () => {
    if (!author?.user) return 'Someone';
    return author.user.name || author.user.email?.split('@')[0] || 'Someone';
  };

  switch (type) {
    case 'EVENT_EDITED':
      return `Event Updated: ${event?.title || 'Event'}`;

    case 'DATE_CHOSEN':
      return `Date Set for ${event?.title || 'Event'}`;

    case 'DATE_CHANGED':
      return `Date Changed for ${event?.title || 'Event'}`;

    case 'DATE_RESET':
      return `New Date Poll for ${event?.title || 'Event'}`;

    case 'NEW_POST':
      return `New Post in ${event?.title || 'Event'}: ${post?.title || 'Post'}`;

    case 'NEW_REPLY':
      return `New Reply to ${post?.title || 'Post'}`;

    case 'USER_JOINED':
      return `${getAuthorName()} Joined ${event?.title || 'Event'}`;

    case 'USER_LEFT':
      return `${getAuthorName()} Left ${event?.title || 'Event'}`;

    case 'USER_PROMOTED':
      return `You're Now a Moderator of ${event?.title || 'Event'}`;

    case 'USER_DEMOTED':
      return `Moderator Status Removed for ${event?.title || 'Event'}`;

    case 'USER_RSVP': {
      const rsvpStatus = rsvp ? rsvp.toLowerCase() : 'responded';
      return `${getAuthorName()} RSVP'd ${rsvpStatus} to ${event?.title || 'Event'}`;
    }

    default:
      return `Notification from ${event?.title || 'Groupi'}`;
  }
}
