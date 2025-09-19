export interface QueryDefinition {
    queryKey: string;
    pusherChannel: string;
    pusherEvent: string;
}
export declare const getEventQuery: (eventId: string) => QueryDefinition;
export declare const getPostQuery: (postId: string) => QueryDefinition;
export declare const getInviteQuery: (eventId: string) => QueryDefinition;
export declare const getPersonQuery: (personId: string) => QueryDefinition;
export declare const getPDTQuery: (eventId: string) => QueryDefinition;
export declare const getNotificationQuery: (userId: string) => QueryDefinition;
export declare const getSettingsQuery: (userId: string) => QueryDefinition;
