export interface QueryDefinition {
  queryKey: string;
  pusherChannel: string;
  pusherEvent: string;
}

export const getEventQuery: (eventId: string) => QueryDefinition = (
  eventId: string
) => {
  return {
    queryKey: `eventData__${eventId}`,
    pusherChannel: `event__${eventId}`,
    pusherEvent: "update_event_data",
  };
};

export const getPostQuery: (postId: string) => QueryDefinition = (
  postId: string
) => {
  return {
    queryKey: `postData__${postId}`,
    pusherChannel: `post__${postId}`,
    pusherEvent: "update_post_data",
  };
};

export const getInviteQuery: (eventId: string) => QueryDefinition = (
  eventId: string
) => {
  return {
    queryKey: `inviteData__${eventId}`,
    pusherChannel: `invite__${eventId}`,
    pusherEvent: "update_invite_data",
  };
};

export const getPersonQuery: (personId: string) => QueryDefinition = (
  userId: string
) => {
  return {
    queryKey: `personData__${userId}`,
    pusherChannel: `person__${userId}`,
    pusherEvent: "update_person_data",
  };
};
