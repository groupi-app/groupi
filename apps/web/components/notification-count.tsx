'use client';
import React from 'react';
import { useNotifications } from '@groupi/hooks';
import { NotificationFeedDTO } from '@groupi/schema';
import { NumberBadge } from './number-badge';

export function NotificationCount({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const { data, isLoading } = useNotifications(userId);

  if (isLoading || !data) {
    return <>{children}</>;
  }

  const [error, notificationData] = data;

  if (error) {
    return <>{children}</>; // Silently fail for this count component
  }

  // If error is null, notificationData is guaranteed to exist

  const notifications: NotificationFeedDTO[] =
    // @ts-expect-error: Temporary fix - notification data structure needs to be updated
    notificationData?.notifications || [];

  const notificationCount = notifications.filter(n => !n.read).length;

  return notificationCount > 0 ? (
    <NumberBadge num={notificationCount}>{children}</NumberBadge>
  ) : (
    <>{children}</>
  );
}
