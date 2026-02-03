/**
 * Tests for skeleton components
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  NotificationListSkeleton,
  NotificationSkeleton,
  NotificationWidgetSkeleton,
  NotificationDropdownSkeleton,
} from './notification-skeleton';
import { PostCardSkeleton, PostFeedSkeleton } from './post-card-skeleton';
import { EventHeaderSkeleton } from './event-header-skeleton';
import { EventListSkeleton, EventCardSkeleton } from './event-list-skeleton';
import { AttendeeListSkeleton } from './attendee-list-skeleton';
import { MemberListSkeleton } from './member-list-skeleton';
import { CalendarSkeleton } from './calendar-skeleton';
import { InviteDetailsSkeleton } from './invite-details-skeleton';
import { AccountSettingsSkeleton } from './account-settings-skeleton';
import { SettingsFormSkeleton } from './settings-form-skeleton';
import { AdminDashboardSkeleton } from './admin-dashboard-skeleton';
import { PostDetailSkeleton } from './post-detail-skeleton';
import {
  ReplyListSkeleton,
  ReplySkeleton,
  ReplyFormSkeleton,
} from './reply-skeleton';
import { NewEventFormSkeleton } from './new-event-form-skeleton';
import { AvailabilityFormSkeleton } from './availability-form-skeleton';
import {
  UserProfileSkeleton,
  UserListSkeleton,
  UserListItemSkeleton,
  UserCardSkeleton,
} from './user-profile-skeleton';

describe('Notification Skeletons', () => {
  it('should render NotificationSkeleton', () => {
    const { container } = render(<NotificationSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render NotificationListSkeleton with multiple items', () => {
    const { container } = render(<NotificationListSkeleton />);
    expect(
      container.querySelectorAll('.animate-pulse').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('should render NotificationWidgetSkeleton', () => {
    const { container } = render(<NotificationWidgetSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render NotificationDropdownSkeleton', () => {
    const { container } = render(<NotificationDropdownSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('Post Skeletons', () => {
  it('should render PostCardSkeleton', () => {
    const { container } = render(<PostCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelector('.rounded-card')).toBeInTheDocument();
  });

  it('should render PostDetailSkeleton', () => {
    const { container } = render(<PostDetailSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render PostFeedSkeleton', () => {
    const { container } = render(<PostFeedSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('Reply Skeletons', () => {
  it('should render ReplySkeleton', () => {
    const { container } = render(<ReplySkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render ReplyListSkeleton', () => {
    const { container } = render(<ReplyListSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render ReplyFormSkeleton', () => {
    const { container } = render(<ReplyFormSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('Event Skeletons', () => {
  it('should render EventHeaderSkeleton', () => {
    const { container } = render(<EventHeaderSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render EventCardSkeleton', () => {
    const { container } = render(<EventCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render EventListSkeleton', () => {
    const { container } = render(<EventListSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render NewEventFormSkeleton', () => {
    const { container } = render(<NewEventFormSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render AvailabilityFormSkeleton', () => {
    const { container } = render(<AvailabilityFormSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('User Skeletons', () => {
  it('should render UserProfileSkeleton', () => {
    const { container } = render(<UserProfileSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render UserListSkeleton', () => {
    const { container } = render(<UserListSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render UserListItemSkeleton', () => {
    const { container } = render(<UserListItemSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render UserCardSkeleton', () => {
    const { container } = render(<UserCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('Member Skeletons', () => {
  it('should render AttendeeListSkeleton', () => {
    const { container } = render(<AttendeeListSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render MemberListSkeleton', () => {
    const { container } = render(<MemberListSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('Settings Skeletons', () => {
  it('should render AccountSettingsSkeleton', () => {
    const { container } = render(<AccountSettingsSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render SettingsFormSkeleton', () => {
    const { container } = render(<SettingsFormSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render AdminDashboardSkeleton', () => {
    const { container } = render(<AdminDashboardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('Other Skeletons', () => {
  it('should render CalendarSkeleton', () => {
    const { container } = render(<CalendarSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render InviteDetailsSkeleton', () => {
    const { container } = render(<InviteDetailsSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
