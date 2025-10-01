// Query key definitions for React Query
// These are used to identify cached data for invalidation and updates

export interface QueryDefinition {
  queryKey: string;
}

export const getEventQuery: (eventId: string) => QueryDefinition = (
  eventId: string
) => {
  return {
    queryKey: `eventData__${eventId}`,
  };
};

export const getPostQuery: (postId: string) => QueryDefinition = (
  postId: string
) => {
  return {
    queryKey: `postData__${postId}`,
  };
};

export const getInviteQuery: (eventId: string) => QueryDefinition = (
  eventId: string
) => {
  return {
    queryKey: `inviteData__${eventId}`,
  };
};

export const getPersonQuery: (personId: string) => QueryDefinition = (
  personId: string
) => {
  return {
    queryKey: `personData__${personId}`,
  };
};

export const getPDTQuery: (eventId: string) => QueryDefinition = (
  eventId: string
) => {
  return {
    queryKey: `pdtData__${eventId}`,
  };
};

export const getNotificationQuery: (userId: string) => QueryDefinition = (
  userId: string
) => {
  return {
    queryKey: `notificationData__${userId}`,
  };
};

export const getSettingsQuery: (userId: string) => QueryDefinition = (
  userId: string
) => {
  return {
    queryKey: `settingsData__${userId}`,
  };
};
