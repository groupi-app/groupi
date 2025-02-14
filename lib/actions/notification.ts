import { db } from "../db";
import { ActionResponse, NotificationWithPersonEventPost } from "@/types";
import { auth } from "@clerk/nextjs";
import { Notification, NotificationType } from "@prisma/client";

export const fetchNotificationsForPerson = async (
  id: string
): Promise<ActionResponse<NotificationWithPersonEventPost[]>> => {
  const { userId }: { userId: string | null } = auth();

  if (!userId) {
    return {
      error: "User not found",
    };
  }

  if (userId !== id) {
    return {
      error: "You are not authorized to view this user's notifications",
    };
  }

  const person = await db.person.findUnique({
    where: {
      id,
    },
    select: {
      notifications: {
        include: {
          person: true,
          event: true,
          post: true,
          author: true,
        },
      },
    },
  });

  if (!person) {
    return {
      error: "Person not found",
    };
  }

  return {
    success: person.notifications,
  };
};

export const markNotificationAsRead = async (
  id: string
): Promise<ActionResponse<NotificationWithPersonEventPost>> => {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) {
      return {
        error: "User not found",
      };
    }

    const notification = await db.notification.update({
      where: {
        id,
        personId: userId,
      },
      data: {
        read: true,
      },
      include: {
        person: true,
        event: true,
        post: true,
        author: true,
      },
    });

    if (!notification) {
      return {
        error: "Notification not found",
      };
    }

    return {
      success: notification,
    };
  } catch (e) {
    return {
      error: "Notification not found",
    };
  }
};

export const markAllNotificationsAsRead = async (): Promise<
  ActionResponse<number>
> => {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) {
      return {
        error: "User not found",
      };
    }

    const notifications = await db.notification.updateMany({
      where: {
        personId: userId,
      },
      data: {
        read: true,
      },
    });

    if (!notifications) {
      return {
        error: "Notifications not found",
      };
    }

    return {
      success: notifications.count,
    };
  } catch (e) {
    return {
      error: "Notification not found",
    };
  }
};

export const markNotificationAsUnread = async (
  id: string
): Promise<ActionResponse<NotificationWithPersonEventPost>> => {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) {
      return {
        error: "User not found",
      };
    }

    const notification = await db.notification.update({
      where: {
        id,
      },
      data: {
        read: false,
      },
      include: {
        person: true,
        event: true,
        post: true,
        author: true,
      },
    });

    if (!notification) {
      return {
        error: "Notification not found",
      };
    }

    return {
      success: notification,
    };
  } catch (e) {
    return {
      error: "Notification not found",
    };
  }
};

export const markTypesAsRead = async (
  types: NotificationType[]
): Promise<ActionResponse<number>> => {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) {
      return {
        error: "User not found",
      };
    }

    const notifications = await db.notification.updateMany({
      where: {
        personId: userId,
        type: {
          in: types,
        },
      },
      data: {
        read: true,
      },
    });

    if (!notifications) {
      return {
        error: "Notifications not found",
      };
    }

    return {
      success: notifications.count,
    };
  } catch (e) {
    return {
      error: "Notification not found",
    };
  }
};

export const deleteNotification = async (
  id: string
): Promise<ActionResponse<NotificationWithPersonEventPost>> => {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) {
      return {
        error: "User not found",
      };
    }

    const notification = await db.notification.delete({
      where: {
        id,
        personId: userId,
      },
      include: {
        person: true,
        event: true,
        post: true,
        author: true,
      },
    });

    if (!notification) {
      return {
        error: "Notification not found",
      };
    }

    return {
      success: notification,
    };
  } catch (e) {
    return {
      error: "Notification not found",
    };
  }
};

export const deleteAllNotifications = async (): Promise<
  ActionResponse<number>
> => {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) {
      return {
        error: "User not found",
      };
    }

    const notifications = await db.notification.deleteMany({
      where: {
        personId: userId,
      },
    });

    if (!notifications) {
      return {
        error: "Notifications not found",
      };
    }

    return {
      success: notifications.count,
    };
  } catch (e) {
    return {
      error: "Notification not found",
    };
  }
};

export const createNotifications = async (
  data: Omit<Notification, "id" | "personId">,
  personIds: string[]
): Promise<ActionResponse<number>> => {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) {
      return {
        error: "User not found",
      };
    }

    const notification = await db.notification.createMany({
      data: personIds.map((personId) => ({
        ...data,
        authorId: userId,
        personId,
      })),
    });

    return {
      success: notification.count,
    };
  } catch (e) {
    return {
      error: "Notification not found",
    };
  }
};
