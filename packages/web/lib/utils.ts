import { Icons } from '@/components/icons';
import { Doc } from '@/convex/_generated/dataModel';
import React from 'react';

// Import shared utilities and design tokens from the design subpackage
// This avoids pulling in hooks that depend on convex/react which causes SSR issues
export {
  cn,
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  animations,
  breakpoints,
} from '@groupi/shared/design';

export function formatDate(date: Date | string | number) {
  // Convert string/number to Date if needed (Convex stores timestamps as numbers)
  const dateObj = date instanceof Date ? date : new Date(date);
  const seconds = Math.floor((Date.now() - dateObj.getTime()) / 1000);

  let interval = seconds / 31536000;

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

/**
 * Format date for replies with specific rules:
 * - Today: just the time (e.g., "2:45PM")
 * - Yesterday: "yesterday at 2:45PM"
 * - Older: numerical date (e.g., "12/25/2024")
 */
export function formatReplyDate(date: Date | string | number) {
  // Convert string/number to Date if needed (Convex stores timestamps as numbers)
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();

  // Get start of today (midnight)
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  // Get start of yesterday
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  // Format time as "2:45PM"
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Check if it's today
  if (dateObj >= startOfToday) {
    return timeStr;
  }

  // Check if it's yesterday
  if (dateObj >= startOfYesterday && dateObj < startOfToday) {
    return `Yesterday at ${timeStr}`;
  }

  // Older than yesterday - use numerical date
  return dateObj.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format last seen timestamp for presence display
 * - Within 5 minutes: "Online now"
 * - Otherwise: "Last seen X ago"
 */
export function formatLastSeen(lastSeen: number | null | undefined): {
  text: string;
  isOnline: boolean;
} {
  if (!lastSeen) {
    return { text: 'Never seen', isOnline: false };
  }

  const now = Date.now();
  const diffMs = now - lastSeen;
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Consider "online" if last seen within 5 minutes
  if (diffMs < fiveMinutes) {
    return { text: 'Online now', isOnline: true };
  }

  // Otherwise show relative time
  const seconds = Math.floor(diffMs / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    const years = Math.floor(interval);
    return { text: `Last seen ${years}y ago`, isOnline: false };
  }

  interval = seconds / 2592000;
  if (interval > 1) {
    const months = Math.floor(interval);
    return { text: `Last seen ${months}mo ago`, isOnline: false };
  }

  interval = seconds / 86400;
  if (interval > 1) {
    const days = Math.floor(interval);
    return { text: `Last seen ${days}d ago`, isOnline: false };
  }

  interval = seconds / 3600;
  if (interval > 1) {
    const hours = Math.floor(interval);
    return { text: `Last seen ${hours}h ago`, isOnline: false };
  }

  interval = seconds / 60;
  if (interval > 1) {
    const minutes = Math.floor(interval);
    return { text: `Last seen ${minutes}m ago`, isOnline: false };
  }

  return { text: 'Last seen just now', isOnline: false };
}

export function timeUntil(date: Date | string) {
  // Convert string to Date if needed (server components serialize dates as strings)
  const dateObj = date instanceof Date ? date : new Date(date);
  const seconds = Math.floor((dateObj.getTime() - Date.now()) / 1000);

  let interval = seconds / 31536000;

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

// Re-export date utilities from shared package (use /utils subpath to avoid importing hooks)
export {
  formatDateTimeRange,
  formatDateTimeRangeShort,
  isSameDay,
  isEventPast,
} from '@groupi/shared/utils';

export function formatRoleName(role: Doc<'memberships'>['role']) {
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

export function formatRoleBadge(role: Doc<'memberships'>['role']) {
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

// Generic type for potential date times with availabilities that have a status
type WithStatus = { status: 'YES' | 'MAYBE' | 'NO' | 'PENDING' };

export function getRanks<
  T extends Doc<'potentialDateTimes'> & { availabilities: WithStatus[] },
>(pdts: T[]) {
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

    case 'USER_MENTIONED':
      return `${getAuthorName()} mentioned you in ${post?.title || 'Post'}`;

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
