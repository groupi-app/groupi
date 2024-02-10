export interface QueryDefinition {
  queryKey: string;
  pusherChannel: string;
  pusherEvent: string;
}

export const getEventQuery: (eventId: string) => QueryDefinition = (
  eventId: string
) => {
  return {
    queryKey: `eventData:${eventId}`,
    pusherChannel: `event:${eventId}`,
    pusherEvent: "update_event_data",
  };
};

export const getPostQuery: (postId: string) => QueryDefinition = (
  postId: string
) => {
  return {
    queryKey: `postData:${postId}`,
    pusherChannel: `post:${postId}`,
    pusherEvent: "update_post_data",
  };
};
