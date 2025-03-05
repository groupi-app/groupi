"use client";
import { useNotifications } from "@/data/notification-hooks";
import { NotificationWithPersonEventPost } from "@/types";
import { NumberBadge } from "./number-badge";

export function NotificationCount({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const { data: notificationData } = useNotifications(userId);
  const {
    notifications,
  }: { notifications: NotificationWithPersonEventPost[] } = notificationData;

  const notificationCount = notifications.filter((n) => !n.read).length;

  return notificationCount > 0 ? (
    <NumberBadge num={notificationCount}>{children}</NumberBadge>
  ) : (
    <>{children}</>
  );
}
