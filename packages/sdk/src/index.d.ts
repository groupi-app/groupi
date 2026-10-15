// Generated public REST v2 types.
export type ErrorResponse = { error: { code: string; message: string } };
export type EventListResponse = Array<EventSummary>;
export type EventSummary = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  imageUrl: string | null;
  chosenDateTime: number | null;
  chosenEndDateTime: number | null;
  createdAt: number;
  updatedAt: number;
  memberCount: number;
  userRole: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE' | null;
  userRsvpStatus: 'YES' | 'MAYBE' | 'NO' | 'PENDING' | null;
};
export type EventPageResponse = {
  items: Array<EventSummary>;
  nextCursor: string | null;
};
export type EventCreateResponse = { eventId: string; membershipId: string };
export type CreateEventRequest = {
  title: string;
  description?: string;
  location?: string;
  potentialDateTimeOptions?: Array<{
    note?: string;
    start: string;
    end?: string;
  }>;
  timezone?: string;
  gdl?: string;
  chosenDateTime?: string;
  chosenEndDateTime?: string;
  reminderOffset?:
    | '30_MINUTES'
    | '1_HOUR'
    | '2_HOURS'
    | '4_HOURS'
    | '1_DAY'
    | '2_DAYS'
    | '3_DAYS'
    | '1_WEEK'
    | '2_WEEKS'
    | '4_WEEKS';
};
export type EventDetail = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  imageUrl: string | null;
  timezone: string;
  potentialDateTimeOptions: Array<{
    id: string;
    start: number;
    end: number | null;
    note: string | null;
  }>;
  chosenDateTime: number | null;
  chosenEndDateTime: number | null;
  reminderOffset:
    | '30_MINUTES'
    | '1_HOUR'
    | '2_HOURS'
    | '4_HOURS'
    | '1_DAY'
    | '2_DAYS'
    | '3_DAYS'
    | '1_WEEK'
    | '2_WEEKS'
    | '4_WEEKS'
    | null;
  createdAt: number;
  updatedAt: number;
  creator: { id: string; user: UserSummary } | null;
};
export type UserSummary = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string | null;
};
export type UpdateEventRequest = {
  reminderOffset?:
    | '30_MINUTES'
    | '1_HOUR'
    | '2_HOURS'
    | '4_HOURS'
    | '1_DAY'
    | '2_DAYS'
    | '3_DAYS'
    | '1_WEEK'
    | '2_WEEKS'
    | '4_WEEKS'
    | null;
  title?: string;
  description?: string;
  location?: string;
  potentialDateTimeOptions?: Array<{
    note?: string;
    start: string;
    end?: string;
  }>;
};
export type MemberListResponse = Array<{
  id: string;
  role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
  rsvpStatus: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
  joinedAt: number;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    username: string | null;
  } | null;
  personId: string;
  rsvpNote: string | null;
}>;
export type MemberDetail = {
  id: string;
  role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
  rsvpStatus: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
  joinedAt: number;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    username: string | null;
  } | null;
  personId: string;
};
export type UpdateMemberRoleRequest = {
  role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
};
export type MessageResponse = { message: string };
export type RsvpUpdateResponse = {
  membershipId: string;
  rsvpStatus: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
  rsvpNote: string | null;
};
export type UpdateRsvpRequest = {
  rsvpStatus: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
  rsvpNote?: string;
};
export type AvailabilityGridResponse = {
  eventId: string;
  potentialDates: Array<AvailabilityGridEntry>;
  userMembershipId: string;
};
export type AvailabilityGridEntry = {
  potentialDateTime: PotentialDateTime;
  availabilities: Array<UserAvailability>;
  summary: { yes: number; maybe: number; no: number; pending: number };
};
export type PotentialDateTime = {
  id: string;
  dateTime: number;
  endDateTime: number | null;
  note: string | null;
};
export type UserAvailability = {
  membershipId: string;
  user: UserSummary;
  status: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
  note: string | null;
};
export type SubmitAvailabilityResponse = { updated: number; created: number };
export type SubmitAvailabilityRequest = {
  responses: Array<{
    potentialDateTimeId: string;
    status: 'YES' | 'MAYBE' | 'NO';
    note?: string;
  }>;
};
export type PotentialDatesResponse = Array<PotentialDateTime>;
export type FriendListResponse = Array<FriendSummary>;
export type FriendSummary = {
  friendshipId: string;
  personId: string;
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  lastSeen: number | null;
};
export type FriendRequestListResponse = Array<FriendRequest>;
export type FriendRequest = {
  friendshipId: string;
  personId: string;
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  createdAt: number;
};
export type UserSearchResponse = Array<UserSearchResult>;
export type UserSearchResult = {
  personId: string;
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  friendshipStatus:
    | 'none'
    | 'pending_sent'
    | 'pending_received'
    | 'friends'
    | 'declined'
    | 'self';
  friendshipId: string | null;
};
export type FriendshipStatusResponse = {
  status:
    | 'none'
    | 'pending_sent'
    | 'pending_received'
    | 'friends'
    | 'declined'
    | 'self';
  friendshipId: string | null;
};
export type FriendRequestResponse = {
  friendshipId: string;
  status: 'PENDING' | 'ACCEPTED';
  message: string;
};
export type SendFriendRequest = { personId: string };
export type AddonListResponse = Array<AddonConfig>;
export type AddonConfig = {
  id: string;
  addonType: string;
  enabled: boolean;
  config:
    | { reminderOffset: string }
    | { guildId: string; guildName: string }
    | { items: Array<{ id: string; name: string; quantity: number }> }
    | {
        questions: Array<{
          id: string;
          label: string;
          type:
            | 'SHORT_ANSWER'
            | 'LONG_ANSWER'
            | 'MULTIPLE_CHOICE'
            | 'CHECKBOXES'
            | 'NUMBER'
            | 'DROPDOWN'
            | 'YES_NO';
          required: boolean;
          options?: Array<string>;
        }>;
      }
    | {
        templateId: string;
        template?: {
          name: string;
          description: string;
          iconName: string;
          settings?: {
            requiresCompletion?: boolean;
            supportsOptOut?: boolean;
            optOutLabel?: string;
            cardLinkLabel?: string;
            cardSubtitle?: string;
            cardOnly?: boolean;
          };
          sections: Array<{
            id: string;
            title: string;
            description?: string;
            layout?: 'form' | 'interactive';
            fields: Array<{
              id: string;
              type:
                | 'text'
                | 'number'
                | 'select'
                | 'multiselect'
                | 'yesno'
                | 'list_item'
                | 'vote'
                | 'toggle'
                | 'action_button'
                | 'static_text'
                | 'dynamic_summary'
                | 'divider'
                | 'info_callout';
              label?: string;
              required: boolean;
              configurable?: boolean;
              variant?: 'short' | 'long';
              placeholder?: string;
              maxLength?: number;
              min?: number;
              max?: number;
              options?: Array<string>;
              minSelections?: number;
              maxSelections?: number;
              items?: Array<{ id: string; name: string; quantity: number }>;
              allowMultiple?: boolean;
              showResults?: boolean;
              content?: string;
              textFormat?: 'p' | 'h1' | 'h2' | 'h3';
              summaryType?:
                | 'response_count'
                | 'vote_leader'
                | 'signup_progress'
                | 'custom_text';
              summaryLabel?: string;
              dividerLabel?: string;
              calloutVariant?: 'info' | 'warning' | 'success';
              calloutMessage?: string;
              buttonLabel?: string;
              buttonVariant?:
                | 'default'
                | 'secondary'
                | 'outline'
                | 'destructive';
              defaultEnabled?: boolean;
              actions?: Array<{
                type:
                  | 'notify_members'
                  | 'notify_organizers'
                  | 'notify_submitter'
                  | 'create_post'
                  | 'update_event_description'
                  | 'set_addon_data'
                  | 'send_webhook';
                webhookUrl?: string;
                webhookHeaders?: Record<string, string>;
                message?: string;
                title?: string;
                key?: string;
                data?:
                  | string
                  | Record<
                      string,
                      string | number | boolean | null | Array<string>
                    >;
                recipientToggleField?: string;
              }>;
              visibilityConditions?: Array<{
                field: string;
                operator:
                  | 'equals'
                  | 'not_equals'
                  | 'contains'
                  | 'not_contains'
                  | 'greater_than'
                  | 'less_than'
                  | 'greater_or_equal'
                  | 'less_or_equal'
                  | 'is_empty'
                  | 'is_not_empty'
                  | 'in_list'
                  | 'not_in_list';
                value?: string | number | boolean | null | Array<string>;
              }>;
            }>;
            configurable?: boolean;
            allowedFieldTypes?: Array<
              | 'text'
              | 'number'
              | 'select'
              | 'multiselect'
              | 'yesno'
              | 'list_item'
              | 'vote'
              | 'toggle'
              | 'action_button'
              | 'static_text'
              | 'dynamic_summary'
              | 'divider'
              | 'info_callout'
            >;
            visibilityConditions?: Array<{
              field: string;
              operator:
                | 'equals'
                | 'not_equals'
                | 'contains'
                | 'not_contains'
                | 'greater_than'
                | 'less_than'
                | 'greater_or_equal'
                | 'less_or_equal'
                | 'is_empty'
                | 'is_not_empty'
                | 'in_list'
                | 'not_in_list';
              value?: string | number | boolean | null | Array<string>;
            }>;
          }>;
          submitButtonLabel?: string;
          onSubmitActions?: Array<{
            type:
              | 'notify_members'
              | 'notify_organizers'
              | 'notify_submitter'
              | 'create_post'
              | 'update_event_description'
              | 'set_addon_data'
              | 'send_webhook';
            webhookUrl?: string;
            webhookHeaders?: Record<string, string>;
            message?: string;
            title?: string;
            key?: string;
            data?:
              | string
              | Record<
                  string,
                  string | number | boolean | null | Array<string>
                >;
            recipientToggleField?: string;
          }>;
          automations?: Array<{
            id: string;
            name: string;
            enabled: boolean;
            trigger: {
              type:
                | 'form_submitted'
                | 'list_item_claimed'
                | 'list_item_full'
                | 'vote_cast'
                | 'vote_threshold'
                | 'toggle_changed'
                | 'all_responses_in'
                | 'member_joined'
                | 'member_left'
                | 'date_chosen'
                | 'addon_enabled';
              fieldId?: string;
              threshold?: number;
            };
            conditions: Array<{
              field: string;
              operator:
                | 'equals'
                | 'not_equals'
                | 'contains'
                | 'not_contains'
                | 'greater_than'
                | 'less_than'
                | 'greater_or_equal'
                | 'less_or_equal'
                | 'is_empty'
                | 'is_not_empty'
                | 'in_list'
                | 'not_in_list';
              value?: string | number | boolean | null | Array<string>;
            }>;
            actions: Array<{
              type:
                | 'notify_members'
                | 'notify_organizers'
                | 'notify_submitter'
                | 'create_post'
                | 'update_event_description'
                | 'set_addon_data'
                | 'send_webhook';
              webhookUrl?: string;
              webhookHeaders?: Record<string, string>;
              message?: string;
              title?: string;
              key?: string;
              data?:
                | string
                | Record<
                    string,
                    string | number | boolean | null | Array<string>
                  >;
              recipientToggleField?: string;
            }>;
          }>;
        };
      };
  createdAt: number;
  updatedAt: number;
};
export type EnableAddonRequest = {
  config:
    | { reminderOffset: string }
    | { guildId: string; guildName: string }
    | { items: Array<{ id: string; name: string; quantity: number }> }
    | {
        questions: Array<{
          id: string;
          label: string;
          type:
            | 'SHORT_ANSWER'
            | 'LONG_ANSWER'
            | 'MULTIPLE_CHOICE'
            | 'CHECKBOXES'
            | 'NUMBER'
            | 'DROPDOWN'
            | 'YES_NO';
          required: boolean;
          options?: Array<string>;
        }>;
      }
    | {
        templateId: string;
        template?: {
          name: string;
          description: string;
          iconName: string;
          settings?: {
            requiresCompletion?: boolean;
            supportsOptOut?: boolean;
            optOutLabel?: string;
            cardLinkLabel?: string;
            cardSubtitle?: string;
            cardOnly?: boolean;
          };
          sections: Array<{
            id: string;
            title: string;
            description?: string;
            layout?: 'form' | 'interactive';
            fields: Array<{
              id: string;
              type:
                | 'text'
                | 'number'
                | 'select'
                | 'multiselect'
                | 'yesno'
                | 'list_item'
                | 'vote'
                | 'toggle'
                | 'action_button'
                | 'static_text'
                | 'dynamic_summary'
                | 'divider'
                | 'info_callout';
              label?: string;
              required: boolean;
              configurable?: boolean;
              variant?: 'short' | 'long';
              placeholder?: string;
              maxLength?: number;
              min?: number;
              max?: number;
              options?: Array<string>;
              minSelections?: number;
              maxSelections?: number;
              items?: Array<{ id: string; name: string; quantity: number }>;
              allowMultiple?: boolean;
              showResults?: boolean;
              content?: string;
              textFormat?: 'p' | 'h1' | 'h2' | 'h3';
              summaryType?:
                | 'response_count'
                | 'vote_leader'
                | 'signup_progress'
                | 'custom_text';
              summaryLabel?: string;
              dividerLabel?: string;
              calloutVariant?: 'info' | 'warning' | 'success';
              calloutMessage?: string;
              buttonLabel?: string;
              buttonVariant?:
                | 'default'
                | 'secondary'
                | 'outline'
                | 'destructive';
              defaultEnabled?: boolean;
              actions?: Array<{
                type:
                  | 'notify_members'
                  | 'notify_organizers'
                  | 'notify_submitter'
                  | 'create_post'
                  | 'update_event_description'
                  | 'set_addon_data'
                  | 'send_webhook';
                webhookUrl?: string;
                webhookHeaders?: Record<string, string>;
                message?: string;
                title?: string;
                key?: string;
                data?:
                  | string
                  | Record<
                      string,
                      string | number | boolean | null | Array<string>
                    >;
                recipientToggleField?: string;
              }>;
              visibilityConditions?: Array<{
                field: string;
                operator:
                  | 'equals'
                  | 'not_equals'
                  | 'contains'
                  | 'not_contains'
                  | 'greater_than'
                  | 'less_than'
                  | 'greater_or_equal'
                  | 'less_or_equal'
                  | 'is_empty'
                  | 'is_not_empty'
                  | 'in_list'
                  | 'not_in_list';
                value?: string | number | boolean | null | Array<string>;
              }>;
            }>;
            configurable?: boolean;
            allowedFieldTypes?: Array<
              | 'text'
              | 'number'
              | 'select'
              | 'multiselect'
              | 'yesno'
              | 'list_item'
              | 'vote'
              | 'toggle'
              | 'action_button'
              | 'static_text'
              | 'dynamic_summary'
              | 'divider'
              | 'info_callout'
            >;
            visibilityConditions?: Array<{
              field: string;
              operator:
                | 'equals'
                | 'not_equals'
                | 'contains'
                | 'not_contains'
                | 'greater_than'
                | 'less_than'
                | 'greater_or_equal'
                | 'less_or_equal'
                | 'is_empty'
                | 'is_not_empty'
                | 'in_list'
                | 'not_in_list';
              value?: string | number | boolean | null | Array<string>;
            }>;
          }>;
          submitButtonLabel?: string;
          onSubmitActions?: Array<{
            type:
              | 'notify_members'
              | 'notify_organizers'
              | 'notify_submitter'
              | 'create_post'
              | 'update_event_description'
              | 'set_addon_data'
              | 'send_webhook';
            webhookUrl?: string;
            webhookHeaders?: Record<string, string>;
            message?: string;
            title?: string;
            key?: string;
            data?:
              | string
              | Record<
                  string,
                  string | number | boolean | null | Array<string>
                >;
            recipientToggleField?: string;
          }>;
          automations?: Array<{
            id: string;
            name: string;
            enabled: boolean;
            trigger: {
              type:
                | 'form_submitted'
                | 'list_item_claimed'
                | 'list_item_full'
                | 'vote_cast'
                | 'vote_threshold'
                | 'toggle_changed'
                | 'all_responses_in'
                | 'member_joined'
                | 'member_left'
                | 'date_chosen'
                | 'addon_enabled';
              fieldId?: string;
              threshold?: number;
            };
            conditions: Array<{
              field: string;
              operator:
                | 'equals'
                | 'not_equals'
                | 'contains'
                | 'not_contains'
                | 'greater_than'
                | 'less_than'
                | 'greater_or_equal'
                | 'less_or_equal'
                | 'is_empty'
                | 'is_not_empty'
                | 'in_list'
                | 'not_in_list';
              value?: string | number | boolean | null | Array<string>;
            }>;
            actions: Array<{
              type:
                | 'notify_members'
                | 'notify_organizers'
                | 'notify_submitter'
                | 'create_post'
                | 'update_event_description'
                | 'set_addon_data'
                | 'send_webhook';
              webhookUrl?: string;
              webhookHeaders?: Record<string, string>;
              message?: string;
              title?: string;
              key?: string;
              data?:
                | string
                | Record<
                    string,
                    string | number | boolean | null | Array<string>
                  >;
              recipientToggleField?: string;
            }>;
          }>;
        };
      };
};
export type UpdateAddonConfigRequest = {
  config:
    | { reminderOffset: string }
    | { guildId: string; guildName: string }
    | { items: Array<{ id: string; name: string; quantity: number }> }
    | {
        questions: Array<{
          id: string;
          label: string;
          type:
            | 'SHORT_ANSWER'
            | 'LONG_ANSWER'
            | 'MULTIPLE_CHOICE'
            | 'CHECKBOXES'
            | 'NUMBER'
            | 'DROPDOWN'
            | 'YES_NO';
          required: boolean;
          options?: Array<string>;
        }>;
      }
    | {
        templateId: string;
        template?: {
          name: string;
          description: string;
          iconName: string;
          settings?: {
            requiresCompletion?: boolean;
            supportsOptOut?: boolean;
            optOutLabel?: string;
            cardLinkLabel?: string;
            cardSubtitle?: string;
            cardOnly?: boolean;
          };
          sections: Array<{
            id: string;
            title: string;
            description?: string;
            layout?: 'form' | 'interactive';
            fields: Array<{
              id: string;
              type:
                | 'text'
                | 'number'
                | 'select'
                | 'multiselect'
                | 'yesno'
                | 'list_item'
                | 'vote'
                | 'toggle'
                | 'action_button'
                | 'static_text'
                | 'dynamic_summary'
                | 'divider'
                | 'info_callout';
              label?: string;
              required: boolean;
              configurable?: boolean;
              variant?: 'short' | 'long';
              placeholder?: string;
              maxLength?: number;
              min?: number;
              max?: number;
              options?: Array<string>;
              minSelections?: number;
              maxSelections?: number;
              items?: Array<{ id: string; name: string; quantity: number }>;
              allowMultiple?: boolean;
              showResults?: boolean;
              content?: string;
              textFormat?: 'p' | 'h1' | 'h2' | 'h3';
              summaryType?:
                | 'response_count'
                | 'vote_leader'
                | 'signup_progress'
                | 'custom_text';
              summaryLabel?: string;
              dividerLabel?: string;
              calloutVariant?: 'info' | 'warning' | 'success';
              calloutMessage?: string;
              buttonLabel?: string;
              buttonVariant?:
                | 'default'
                | 'secondary'
                | 'outline'
                | 'destructive';
              defaultEnabled?: boolean;
              actions?: Array<{
                type:
                  | 'notify_members'
                  | 'notify_organizers'
                  | 'notify_submitter'
                  | 'create_post'
                  | 'update_event_description'
                  | 'set_addon_data'
                  | 'send_webhook';
                webhookUrl?: string;
                webhookHeaders?: Record<string, string>;
                message?: string;
                title?: string;
                key?: string;
                data?:
                  | string
                  | Record<
                      string,
                      string | number | boolean | null | Array<string>
                    >;
                recipientToggleField?: string;
              }>;
              visibilityConditions?: Array<{
                field: string;
                operator:
                  | 'equals'
                  | 'not_equals'
                  | 'contains'
                  | 'not_contains'
                  | 'greater_than'
                  | 'less_than'
                  | 'greater_or_equal'
                  | 'less_or_equal'
                  | 'is_empty'
                  | 'is_not_empty'
                  | 'in_list'
                  | 'not_in_list';
                value?: string | number | boolean | null | Array<string>;
              }>;
            }>;
            configurable?: boolean;
            allowedFieldTypes?: Array<
              | 'text'
              | 'number'
              | 'select'
              | 'multiselect'
              | 'yesno'
              | 'list_item'
              | 'vote'
              | 'toggle'
              | 'action_button'
              | 'static_text'
              | 'dynamic_summary'
              | 'divider'
              | 'info_callout'
            >;
            visibilityConditions?: Array<{
              field: string;
              operator:
                | 'equals'
                | 'not_equals'
                | 'contains'
                | 'not_contains'
                | 'greater_than'
                | 'less_than'
                | 'greater_or_equal'
                | 'less_or_equal'
                | 'is_empty'
                | 'is_not_empty'
                | 'in_list'
                | 'not_in_list';
              value?: string | number | boolean | null | Array<string>;
            }>;
          }>;
          submitButtonLabel?: string;
          onSubmitActions?: Array<{
            type:
              | 'notify_members'
              | 'notify_organizers'
              | 'notify_submitter'
              | 'create_post'
              | 'update_event_description'
              | 'set_addon_data'
              | 'send_webhook';
            webhookUrl?: string;
            webhookHeaders?: Record<string, string>;
            message?: string;
            title?: string;
            key?: string;
            data?:
              | string
              | Record<
                  string,
                  string | number | boolean | null | Array<string>
                >;
            recipientToggleField?: string;
          }>;
          automations?: Array<{
            id: string;
            name: string;
            enabled: boolean;
            trigger: {
              type:
                | 'form_submitted'
                | 'list_item_claimed'
                | 'list_item_full'
                | 'vote_cast'
                | 'vote_threshold'
                | 'toggle_changed'
                | 'all_responses_in'
                | 'member_joined'
                | 'member_left'
                | 'date_chosen'
                | 'addon_enabled';
              fieldId?: string;
              threshold?: number;
            };
            conditions: Array<{
              field: string;
              operator:
                | 'equals'
                | 'not_equals'
                | 'contains'
                | 'not_contains'
                | 'greater_than'
                | 'less_than'
                | 'greater_or_equal'
                | 'less_or_equal'
                | 'is_empty'
                | 'is_not_empty'
                | 'in_list'
                | 'not_in_list';
              value?: string | number | boolean | null | Array<string>;
            }>;
            actions: Array<{
              type:
                | 'notify_members'
                | 'notify_organizers'
                | 'notify_submitter'
                | 'create_post'
                | 'update_event_description'
                | 'set_addon_data'
                | 'send_webhook';
              webhookUrl?: string;
              webhookHeaders?: Record<string, string>;
              message?: string;
              title?: string;
              key?: string;
              data?:
                | string
                | Record<
                    string,
                    string | number | boolean | null | Array<string>
                  >;
              recipientToggleField?: string;
            }>;
          }>;
        };
      };
};
export type AddonDataListResponse = Array<AddonDataEntry>;
export type AddonDataEntry = {
  id: string;
  key: string;
  data:
    | string
    | Record<string, string | number | boolean | null | Array<string>>;
  createdBy: string | null;
  createdAt: number;
  updatedAt: number;
};
export type SetAddonDataRequest = {
  data: Record<string, string | number | boolean | null | Array<string>>;
};
export type NotificationListResponse = Array<Notification>;
export type Notification = {
  id: string;
  personId: string;
  type:
    | 'EVENT_EDITED'
    | 'NEW_POST'
    | 'NEW_REPLY'
    | 'DATE_CHOSEN'
    | 'DATE_CHANGED'
    | 'DATE_RESET'
    | 'EVENT_APPLICATION_RECEIVED'
    | 'EVENT_APPLICATION_APPROVED'
    | 'EVENT_APPLICATION_DECLINED'
    | 'USER_JOINED'
    | 'USER_LEFT'
    | 'USER_PROMOTED'
    | 'USER_DEMOTED'
    | 'USER_RSVP'
    | 'USER_MENTIONED'
    | 'EVENT_REMINDER'
    | 'FRIEND_REQUEST_RECEIVED'
    | 'FRIEND_REQUEST_ACCEPTED'
    | 'GROUP_INVITE_RECEIVED'
    | 'GROUP_INVITE_ACCEPTED'
    | 'GROUP_MEMBER_REMOVED'
    | 'GROUP_MEMBER_BANNED'
    | 'GROUP_APPLICATION_RECEIVED'
    | 'GROUP_APPLICATION_APPROVED'
    | 'GROUP_APPLICATION_DECLINED'
    | 'GROUP_ANNOUNCEMENT'
    | 'GROUP_ONBOARDING_REQUIRED'
    | 'EVENT_INVITE_RECEIVED'
    | 'EVENT_INVITE_ACCEPTED'
    | 'ADDON_CONFIG_RESET'
    | 'ADDON_AUTOMATION';
  read: boolean;
  createdAt: number;
  group?: { id: string; title: string } | null;
  groupApplication?: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'WITHDRAWN';
  } | null;
  groupAnnouncement?: { title: string; message: string } | null;
  groupInvite?: {
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  } | null;
  event: { id: string; title: string } | null;
  post: { id: string; title: string } | null;
  author: {
    id: string;
    userId: string;
    user: { name: string | null; email: string | null };
  } | null;
};
export type UnreadCountResponse = { count: number };
export type MutedListResponse = {
  events: Array<MutedEvent>;
  posts: Array<MutedPost>;
};
export type MutedEvent = {
  id: string;
  eventId: string;
  mutedAt: number;
  event: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
  } | null;
};
export type MutedPost = {
  id: string;
  postId: string;
  mutedAt: number;
  post: { id: string; title: string } | null;
};
export type Profile = {
  personId: string;
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string | null;
  bio: string | null;
  pronouns: string | null;
};
export type UpdateProfileRequest = {
  name?: string;
  username?: string;
  bio?: string;
  pronouns?: string;
};
export type PrivacySettings = {
  allowGroupInvitesFrom?: 'EVERYONE' | 'FRIENDS' | 'NO_ONE';
  allowFriendRequestsFrom: 'EVERYONE' | 'EVENT_MEMBERS' | 'NO_ONE' | null;
  allowEventInvitesFrom:
    | 'EVERYONE'
    | 'EVENT_MEMBERS'
    | 'FRIENDS'
    | 'NO_ONE'
    | null;
};
export type UpdatePrivacySettingsRequest = {
  allowGroupInvitesFrom?: 'EVERYONE' | 'FRIENDS' | 'NO_ONE';
  allowFriendRequestsFrom?: 'EVERYONE' | 'EVENT_MEMBERS' | 'NO_ONE';
  allowEventInvitesFrom?: 'EVERYONE' | 'EVENT_MEMBERS' | 'FRIENDS' | 'NO_ONE';
};
export type NotificationSettings = {
  methods: Array<NotificationMethod>;
  typeSettings: Array<NotificationTypeSetting>;
};
export type NotificationMethod = {
  id: string;
  type: 'EMAIL' | 'PUSH' | 'WEBHOOK';
  enabled: boolean;
  name: string | null;
  value: string;
  webhookFormat: 'DISCORD' | 'SLACK' | 'TEAMS' | 'GENERIC' | 'CUSTOM' | null;
};
export type NotificationTypeSetting = {
  notificationType: string;
  methodId: string;
  enabled: boolean;
};
export type UpdateNotificationSettingsRequest = {
  notificationMethods: Array<{
    id?: string;
    type: 'EMAIL' | 'PUSH' | 'WEBHOOK';
    enabled: boolean;
    name?: string;
    value: string;
    webhookFormat?: 'DISCORD' | 'SLACK' | 'TEAMS' | 'GENERIC' | 'CUSTOM';
    customTemplate?: string;
    webhookHeaders?: string;
    notifications: Array<{
      notificationType:
        | 'EVENT_EDITED'
        | 'NEW_POST'
        | 'NEW_REPLY'
        | 'DATE_CHOSEN'
        | 'DATE_CHANGED'
        | 'DATE_RESET'
        | 'USER_JOINED'
        | 'USER_LEFT'
        | 'USER_PROMOTED'
        | 'USER_DEMOTED'
        | 'USER_RSVP'
        | 'USER_MENTIONED'
        | 'EVENT_REMINDER'
        | 'FRIEND_REQUEST_RECEIVED'
        | 'FRIEND_REQUEST_ACCEPTED'
        | 'GROUP_INVITE_RECEIVED'
        | 'GROUP_INVITE_ACCEPTED'
        | 'GROUP_MEMBER_REMOVED'
        | 'GROUP_MEMBER_BANNED'
        | 'GROUP_APPLICATION_RECEIVED'
        | 'GROUP_APPLICATION_APPROVED'
        | 'GROUP_APPLICATION_DECLINED'
        | 'GROUP_ANNOUNCEMENT'
        | 'GROUP_ONBOARDING_REQUIRED'
        | 'EVENT_INVITE_RECEIVED'
        | 'EVENT_INVITE_ACCEPTED'
        | 'ADDON_CONFIG_RESET'
        | 'ADDON_AUTOMATION';
      enabled: boolean;
    }>;
  }>;
};
export type CustomThemeListResponse = Array<CustomTheme>;
export type CustomTheme = {
  id: string;
  name: string;
  description: string | null;
  baseThemeId: string;
  mode: 'light' | 'dark';
  tokenOverrides: TokenOverrides;
  createdAt: number;
  updatedAt: number;
};
export type TokenOverrides = {
  brand?: {
    primary?: string;
    primaryHover?: string;
    secondary?: string;
    secondaryHover?: string;
    accent?: string;
    accentHover?: string;
  };
  background?: {
    page?: string;
    surface?: string;
    elevated?: string;
    sunken?: string;
  };
  text?: {
    primary?: string;
    secondary?: string;
    heading?: string;
    muted?: string;
  };
  status?: {
    success?: string;
    warning?: string;
    error?: string;
    info?: string;
  };
  shadow?: { raised?: string; floating?: string };
};
export type ThemePreferencesResponse = {
  selectedThemeType: 'base' | 'custom';
  selectedThemeId: string;
  selectedCustomThemeId: string | null;
  useSystemPreference: boolean;
  systemLightThemeId: string;
  systemDarkThemeId: string;
} | null;
export type SetThemePreferenceRequest = {
  selectedThemeType: 'base' | 'custom';
  selectedThemeId: string;
  selectedCustomThemeId?: string | null;
  useSystemPreference: boolean;
  systemLightThemeId: string;
  systemDarkThemeId: string;
};
export type CreateCustomThemeRequest = {
  name: string;
  description?: string;
  baseThemeId: string;
  mode: 'light' | 'dark';
  tokenOverrides?: {
    brand?: {
      primary?: string;
      primaryHover?: string;
      secondary?: string;
      secondaryHover?: string;
      accent?: string;
      accentHover?: string;
    };
    background?: {
      page?: string;
      surface?: string;
      elevated?: string;
      sunken?: string;
    };
    text?: {
      primary?: string;
      secondary?: string;
      heading?: string;
      muted?: string;
    };
    status?: {
      success?: string;
      warning?: string;
      error?: string;
      info?: string;
    };
    shadow?: { raised?: string; floating?: string };
  };
};
export type UpdateCustomThemeRequest = {
  name?: string;
  description?: string | null;
  baseThemeId?: string;
  mode?: 'light' | 'dark';
  tokenOverrides?: TokenOverrides;
};
export type InviteSummary = {
  id: string;
  eventId: string;
  token: string;
  name: string | null;
  maxUses: number | null;
  usesTotal: number | null;
  usesRemaining: number | null;
  expiresAt: number | null;
  createdAt: number;
  kind: 'link' | 'email';
  email: string | null;
  recipientName: string | null;
  customMessage: string | null;
  emailStatus: 'pending' | 'queued' | null;
};
export type InvitePublic = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDescription: string | null;
  eventLocation: string | null;
  name: string | null;
  expired: boolean;
  maxUsesReached: boolean;
};
export type InviteListSendResult = {
  eventId: string;
  totalCount: number;
  sentCount: number;
  skippedCount: number;
  results: Array<
    | { personId: string; status: 'sent'; inviteId: string }
    | {
        personId: string;
        status: 'skipped';
        reason: 'ALREADY_MEMBER' | 'INVITATION_PENDING' | 'UNAVAILABLE';
      }
  >;
};
export type InviteListSend = {
  eventId: string;
  role?: 'ATTENDEE' | 'MODERATOR';
  message?: string;
};
export type InviteListDetail = {
  inviteListId: string;
  name: string;
  personCount: number;
  availablePersonCount: number;
  needsAttention: boolean;
  createdAt: number;
  updatedAt: number;
  people: Array<InviteListPerson>;
};
export type InviteListPerson = {
  personId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  available: boolean;
};
export type InviteListSummary = {
  inviteListId: string;
  name: string;
  personCount: number;
  availablePersonCount: number;
  needsAttention: boolean;
  createdAt: number;
  updatedAt: number;
};
export type UpdateInviteList = { name?: string; personIds?: Array<string> };
export type DeleteInviteListResult = { deleted: true; inviteListId: string };
export type InviteListPeople = { items: Array<SelectableInviteListPerson> };
export type SelectableInviteListPerson = {
  personId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  available: true;
};
export type InviteListCollection = { items: Array<InviteListSummary> };
export type CreateInviteList = { name: string; personIds: Array<string> };
export type ReportCreateResponse = { reportId: string };
export type CreateReportRequest = {
  targetType: 'USER' | 'EVENT' | 'POST' | 'REPLY';
  targetId: string;
  reason:
    | 'SPAM'
    | 'HARASSMENT'
    | 'HATE_SPEECH'
    | 'INAPPROPRIATE_CONTENT'
    | 'IMPERSONATION'
    | 'OTHER';
  details?: string;
};
export type AdminUserListResponse = Array<AdminUserSummary>;
export type AdminUserSummary = {
  userId: string;
  user: UserSummary;
  person: { id: string; bio: string | null; pronouns: string | null } | null;
  createdAt: number;
};
export type SetUserRoleRequest = { role: 'user' | 'admin' };
export type AdminEventListResponse = Array<AdminEventSummary>;
export type AdminEventSummary = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  creatorId: string;
  memberCount: number;
  chosenDateTime: number | null;
  createdAt: number;
  updatedAt: number;
};
export type AdminReportListResponse = Array<ReportSummary>;
export type ReportSummary = {
  id: string;
  reporterId: string;
  targetType: 'USER' | 'EVENT' | 'POST' | 'REPLY';
  targetId: string;
  reason:
    | 'SPAM'
    | 'HARASSMENT'
    | 'HATE_SPEECH'
    | 'INAPPROPRIATE_CONTENT'
    | 'IMPERSONATION'
    | 'OTHER';
  details: string | null;
  status: 'PENDING' | 'DISMISSED' | 'ACTION_TAKEN';
  createdAt: number;
};
export type DelegatedAction =
  | 'groups.context.read'
  | 'groups.events.read'
  | 'groups.applications.submit'
  | 'groups.applications.edit'
  | 'groups.applications.withdraw'
  | 'identity.display-name'
  | 'identity.email'
  | 'events.read'
  | 'events.update'
  | 'members.read'
  | 'discussion.read'
  | 'discussion.create'
  | 'discussion.update'
  | 'discussion.delete'
  | 'files.read'
  | 'files.upload'
  | 'profiles.read';
export interface DelegatedState {
  instance: string;
  issuer: string;
  audience: string;
  clientId: string;
  clientType: 'native' | 'confidentialWeb';
  background: boolean;
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
  grantedActions: DelegatedAction[];
}
export interface DelegatedConfig {
  instance: string;
  issuer: string;
  audience: string;
  clientId: string;
  clientType: 'native' | 'confidentialWeb';
  actions: DelegatedAction[];
  getClientAssertion?(input: {
    tokenEndpoint: string;
    clientId: string;
    signal?: AbortSignal;
  }): Promise<string>;
  storeTokens?(state: DelegatedState | null): Promise<void>;
}
export interface AuthorizationRequest {
  url: string;
  state: string;
  nonce: string;
  codeVerifier: string;
  redirectUri: string;
  background: boolean;
}
export const delegatedActions: readonly DelegatedAction[];
export class DelegatedSession {
  constructor(config: DelegatedConfig);
  static restore(
    config: DelegatedConfig,
    state: DelegatedState
  ): DelegatedSession;
  static authorizationRequest(
    config: DelegatedConfig,
    input: {
      redirectUri: string;
      background?: boolean;
      selectedGroupId?: string;
    }
  ): Promise<AuthorizationRequest>;
  static fromAuthorizationCode(
    config: DelegatedConfig,
    input: {
      code: string;
      codeVerifier: string;
      redirectUri: string;
      state: string;
      expectedState: string;
      background?: boolean;
    },
    options?: RequestOptions
  ): Promise<DelegatedSession>;
  refresh(options?: RequestOptions): Promise<void>;
  getToken(input: {
    instance: string;
    audience: string;
    signal?: AbortSignal;
  }): Promise<{
    accessToken: string;
    instance: string;
    audience: string;
    expiresAt: number;
  }>;
  credential(): Extract<Credential, { type: 'delegated' }>;
}
export interface RequestOptions {
  signal?: AbortSignal;
  idempotencyKey?: string;
  maxPages?: number;
}
export type Credential =
  | { type: 'apiKey' | 'boundedApiKey'; key: string }
  | {
      type: 'delegated';
      audience: string;
      getToken(input: {
        instance: string;
        audience: string;
        signal?: AbortSignal;
      }): Promise<{
        accessToken: string;
        instance: string;
        audience: string;
        expiresAt?: number;
      }>;
    };
export interface ClientOptions {
  instance: string;
  credential: Credential;
  retries?: number;
  timeoutMs?: number;
  maxResponseBytes?: number;
}
export class GroupiError extends Error {
  status: number;
  code: string;
  details: unknown;
  uncertain: boolean;
}
export class Groupi {
  constructor(options: ClientOptions);
  upload(
    data: Uint8Array,
    metadata: {
      filename: string;
      mimeType?: string;
      purpose?: 'attachment' | 'avatar' | 'cover';
      eventId?: string;
    },
    options?: RequestOptions
  ): Promise<{
    storageId: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;
  discardUpload(storageId: string, options?: RequestOptions): Promise<void>;
  health(options?: RequestOptions): Promise<{
    status: string;
    version: string;
    capabilities: Record<string, { version: number }>;
  }>;
  requireCapability(
    name: string,
    version?: number,
    options?: RequestOptions
  ): ReturnType<Groupi['health']>;
  iterateEvents(
    query?: { limit?: number },
    options?: RequestOptions
  ): AsyncIterable<EventSummary>;
  /** Enumerate all current owned Groups or Events, including unresolved offers */
  getAccountResponsibilities(
    input: {
      query: { kind: 'GROUP' | 'EVENT'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      kind: 'GROUP' | 'EVENT';
      id: string;
      title: string;
      status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
      transferId: string | null;
      recipientId: string | null;
      resolved: false;
    }>;
    nextCursor: string | null;
  }>;
  getAccountResponsibilitiesItems(
    input: {
      query: { kind: 'GROUP' | 'EVENT'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    kind: 'GROUP' | 'EVENT';
    id: string;
    title: string;
    status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
    transferId: string | null;
    recipientId: string | null;
    resolved: false;
  }>;
  /** Read live readiness; final deletion revalidates */
  readLiveReadinessFinalDeletionRevalidates(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<{
    hasOwnedGroups: boolean;
    hasOwnedEvents: boolean;
    canDelete: boolean;
  }>;
  /** Permanently delete the authenticated account after live responsibility resolution */
  postAccountDelete(
    input: { body: { confirmation: string } },
    options?: RequestOptions
  ): Promise<{ success: boolean }>;
  /** Explicitly delete an owned Event, including legacy membership inconsistencies */
  deleteAccountResponsibilitiesEvents(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /**  */
  postAuthCliExchange(
    input: {
      body: {
        code: string;
        verifier: string;
        state: string;
        callbackPort: number;
      };
    },
    options?: RequestOptions
  ): Promise<{
    apiKey: string;
    expiresAt: number;
    account: { id: string; name: string; email: string };
  }>;
  /**  */
  postAuthCliRevoke(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<{ revoked: true }>;
  /** Inspect consensual ownership transfer */
  inspectConsensualOwnershipTransfer(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<{
    eventId: string;
    organizerId: string;
    createdById: string;
    transferId: string | null;
    offeredById: string | null;
    recipientId: string | null;
    status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
    explanation: string;
  } | null>;
  /** Offer ownership to an eligible existing member */
  offerOwnershipToAnEligibleExistingMember(
    input: { path: { eventId: string }; body: { recipientId: string } },
    options?: RequestOptions
  ): Promise<{
    eventId: string;
    organizerId: string;
    createdById: string;
    transferId: string | null;
    offeredById: string | null;
    recipientId: string | null;
    status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
    explanation: string;
  } | null>;
  /** accept the named ownership offer */
  acceptTheNamedOwnershipOffer(
    input: { path: { eventId: string }; body: { transferId: string } },
    options?: RequestOptions
  ): Promise<{
    eventId: string;
    organizerId: string;
    createdById: string;
    transferId: string | null;
    offeredById: string | null;
    recipientId: string | null;
    status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
    explanation: string;
  } | null>;
  /** decline the named ownership offer */
  declineTheNamedOwnershipOffer(
    input: { path: { eventId: string }; body: { transferId: string } },
    options?: RequestOptions
  ): Promise<{
    eventId: string;
    organizerId: string;
    createdById: string;
    transferId: string | null;
    offeredById: string | null;
    recipientId: string | null;
    status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
    explanation: string;
  } | null>;
  /** cancel the named ownership offer */
  cancelTheNamedOwnershipOffer(
    input: { path: { eventId: string }; body: { transferId: string } },
    options?: RequestOptions
  ): Promise<{
    eventId: string;
    organizerId: string;
    createdById: string;
    transferId: string | null;
    offeredById: string | null;
    recipientId: string | null;
    status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
    explanation: string;
  } | null>;
  /** Read viewer-safe event logistics before joining */
  readViewerSafeEventLogisticsBeforeJoining(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<{
    event: {
      _id: string;
      _creationTime: number;
      title: string;
      description: string | null;
      location: string | null;
      creatorId: string;
      timezone: string;
      visibility: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
      admissionPolicy: 'INVITATION_ONLY' | 'DIRECT' | 'APPLY';
      chosenDateTime: number | null;
      chosenEndDateTime: number | null;
      imageUrl: string | null;
      imageFocalPoint?: { x: number; y: number };
      createdAt: number;
      updatedAt: number;
      potentialDateTimeOptions: Array<{
        id: string;
        start: number;
        end: number | null;
        note: string | null;
      }>;
    };
    organizer: {
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
    } | null;
    entryAction:
      | 'MEMBER'
      | 'JOIN'
      | 'APPLY'
      | 'INVITATION_ONLY'
      | 'SIGN_IN'
      | 'UNAVAILABLE';
  }>;
  /** Discover Friends and Group events */
  discoverFriendsAndGroupEvents(
    input?: {
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      id: string;
      title: string;
      admissionPolicy: 'INVITATION_ONLY' | 'DIRECT' | 'APPLY';
      entryAction: 'JOIN' | 'APPLY' | 'INVITATION_ONLY' | 'UNAVAILABLE';
      accessReasons: {
        friends: boolean;
        groups: Array<{ groupId: string; name: string }>;
      };
      description: string | null;
      location: string | null;
      chosenDateTime: number | null;
      imageUrl: string | null;
      organizer: {
        personId: string;
        name: string | null;
        username: string | null;
      } | null;
    }>;
    nextCursor: string | null;
  }>;
  discoverFriendsAndGroupEventsItems(
    input?: {
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    id: string;
    title: string;
    admissionPolicy: 'INVITATION_ONLY' | 'DIRECT' | 'APPLY';
    entryAction: 'JOIN' | 'APPLY' | 'INVITATION_ONLY' | 'UNAVAILABLE';
    accessReasons: {
      friends: boolean;
      groups: Array<{ groupId: string; name: string }>;
    };
    description: string | null;
    location: string | null;
    chosenDateTime: number | null;
    imageUrl: string | null;
    organizer: {
      personId: string;
      name: string | null;
      username: string | null;
    } | null;
  }>;
  /** Join a discoverable event */
  joinADiscoverableEvent(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<{
    membershipId: string;
    success: boolean;
    role: 'ATTENDEE';
    rsvpStatus: 'PENDING';
  }>;
  /** Read event visibility, admission and permissions */
  readEventVisibilityAdmissionAndPermissions(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<{
    eventId: string;
    visibility: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
    permissions: {
      createPosts: 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';
      inviteMembers: 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';
      viewAttendeeList: 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';
    };
    admissionPolicy: 'INVITATION_ONLY' | 'DIRECT' | 'APPLY';
  }>;
  /** Update event visibility, admission and permissions */
  updateEventVisibilityAdmissionAndPermissions(
    input: {
      path: { eventId: string };
      body: {
        visibility?: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
        admissionPolicy?: 'INVITATION_ONLY' | 'DIRECT' | 'APPLY';
        permissions?: {
          createPosts?: 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';
          inviteMembers?: 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';
          viewAttendeeList?: 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';
        };
      };
    },
    options?: RequestOptions
  ): Promise<{
    eventId: string;
    visibility: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
    permissions: {
      createPosts: 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';
      inviteMembers: 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';
      viewAttendeeList: 'EVERYONE' | 'MODERATOR' | 'ORGANIZER';
    };
    admissionPolicy: 'INVITATION_ONLY' | 'DIRECT' | 'APPLY';
  }>;
  /** Read Organizer lifecycle and revision */
  readEventLifecycle(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<{
    audienceConflicts: Array<{ groupId: string; name: string }>;
    revision: string;
    completed: boolean;
    completedAt: number | null;
    startsAt: number | null;
    endsAt: number | null;
  }>;
  /** Complete, reopen or reschedule as current Organizer */
  updateEventLifecycle(
    input: {
      path: { eventId: string };
      body: {
        expectedRevision: string;
        action: 'complete' | 'reopen' | 'reschedule';
        startsAt?: number | null;
        endsAt?: number | null;
      };
    },
    options?: RequestOptions
  ): Promise<{
    operationId: string;
    outcome: 'committed';
    result: { eventId: string; revision: string; completed: boolean };
    effects: { email: 'not-requested'; cleanup: 'not-requested' };
  }>;
  /**  */
  getEventsEventIdApplicationsForm(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<{
    settings: {
      questions: Array<{
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
      }>;
      reviewerPolicy: 'ORGANIZERS_AND_MODERATORS' | 'ORGANIZER_ONLY';
    } | null;
    pending: {
      _id: string;
      _creationTime: number;
      eventId: string;
      personId: string;
      questions: Array<{
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
      }>;
      answers: Record<string, string | number | boolean | Array<string>>;
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      submittedAt: number;
      updatedAt: number;
      decisions: Array<{
        status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
        actorId?: string;
        at: number;
        reason?: string;
      }>;
    } | null;
    canApply: boolean;
    canReview: boolean;
  }>;
  /**  */
  getEventsEventIdApplicationsHistory(
    input: {
      path: { eventId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    page: Array<{
      _id: string;
      _creationTime: number;
      eventId: string;
      personId: string;
      questions: Array<{
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
      }>;
      answers: Record<string, string | number | boolean | Array<string>>;
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      submittedAt: number;
      updatedAt: number;
      decisions: Array<{
        status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
        actorId?: string;
        at: number;
        reason?: string;
      }>;
    }>;
    isDone: boolean;
    continueCursor: string;
    splitCursor?: string | null;
    pageStatus?: 'SplitRecommended' | 'SplitRequired' | null;
  }>;
  getEventsEventIdApplicationsHistoryItems(
    input: {
      path: { eventId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    _id: string;
    _creationTime: number;
    eventId: string;
    personId: string;
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
    }>;
    answers: Record<string, string | number | boolean | Array<string>>;
    status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
    submittedAt: number;
    updatedAt: number;
    decisions: Array<{
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      actorId?: string;
      at: number;
      reason?: string;
    }>;
  }>;
  /**  */
  getEventsEventIdApplicationsList(
    input: {
      path: { eventId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    page: Array<{
      _id: string;
      _creationTime: number;
      eventId: string;
      personId: string;
      questions: Array<{
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
      }>;
      answers: Record<string, string | number | boolean | Array<string>>;
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      submittedAt: number;
      updatedAt: number;
      decisions: Array<{
        status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
        actorId?: string;
        at: number;
        reason?: string;
      }>;
      applicant: {
        personId: string;
        name: string | null;
        username: string | null;
        image: string | null;
      };
    }>;
    isDone: boolean;
    continueCursor: string;
    splitCursor?: string | null;
    pageStatus?: 'SplitRecommended' | 'SplitRequired' | null;
  }>;
  getEventsEventIdApplicationsListItems(
    input: {
      path: { eventId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    _id: string;
    _creationTime: number;
    eventId: string;
    personId: string;
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
    }>;
    answers: Record<string, string | number | boolean | Array<string>>;
    status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
    submittedAt: number;
    updatedAt: number;
    decisions: Array<{
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      actorId?: string;
      at: number;
      reason?: string;
    }>;
    applicant: {
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  }>;
  /**  */
  putEventsEventIdApplicationsSettings(
    input: {
      path: { eventId: string };
      body: {
        questions: Array<{
          id: string;
          label: string;
          required: boolean;
          type:
            | 'SHORT_ANSWER'
            | 'LONG_ANSWER'
            | 'MULTIPLE_CHOICE'
            | 'CHECKBOXES'
            | 'NUMBER'
            | 'DROPDOWN'
            | 'YES_NO';
          options?: Array<string>;
        }>;
        reviewerPolicy: 'ORGANIZERS_AND_MODERATORS' | 'ORGANIZER_ONLY';
      };
    },
    options?: RequestOptions
  ): Promise<{
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
    }>;
    reviewerPolicy: 'ORGANIZERS_AND_MODERATORS' | 'ORGANIZER_ONLY';
  }>;
  /**  */
  postEventsEventIdApplications(
    input: {
      path: { eventId: string };
      body: {
        answers: Record<string, string | number | boolean | Array<string>>;
      };
    },
    options?: RequestOptions
  ): Promise<{
    applicationId: string;
    status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
  }>;
  /**  */
  postEventApplicationsApplicationIdWithdraw(
    input: { path: { applicationId: string } },
    options?: RequestOptions
  ): Promise<{
    applicationId: string;
    status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
  }>;
  /**  */
  postEventApplicationsApplicationIdDecision(
    input: {
      path: { applicationId: string };
      body: { decision: 'APPROVED' | 'DECLINED'; reason?: string };
    },
    options?: RequestOptions
  ): Promise<{
    applicationId: string;
    status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
  }>;
  /** List events */
  listEvents(
    input?: {
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<EventListResponse | EventPageResponse>;
  listEventsItems(
    input?: {
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<EventSummary>;
  /** Create event */
  createEvent(
    input: { body: CreateEventRequest },
    options?: RequestOptions
  ): Promise<EventCreateResponse>;
  /** Get event */
  getEvent(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<EventDetail>;
  /** Update event */
  updateEvent(
    input: { path: { eventId: string }; body: UpdateEventRequest },
    options?: RequestOptions
  ): Promise<EventDetail | { eventId: string }>;
  /** Delete event */
  deleteEvent(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** Inspect current account avatar */
  inspectCurrentAccountAvatar(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<{
    storageId: string | null;
    imageUrl: string | null;
    focalPoint: { x: number; y: number } | null;
  }>;
  /** Replace current account avatar */
  replaceCurrentAccountAvatar(
    input: { body: { storageId: string } },
    options?: RequestOptions
  ): Promise<{
    storageId: string | null;
    imageUrl: string | null;
    focalPoint: { x: number; y: number } | null;
  }>;
  /** Remove current account avatar */
  removeCurrentAccountAvatar(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<{
    storageId: string | null;
    imageUrl: string | null;
    focalPoint: { x: number; y: number } | null;
  }>;
  /** Inspect event cover */
  inspectEventCover(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<{
    storageId: string | null;
    imageUrl: string | null;
    focalPoint: { x: number; y: number } | null;
  }>;
  /** Replace event cover */
  replaceEventCover(
    input: {
      path: { eventId: string };
      body: { storageId: string; focalPoint?: { x: number; y: number } | null };
    },
    options?: RequestOptions
  ): Promise<{
    storageId: string | null;
    imageUrl: string | null;
    focalPoint: { x: number; y: number } | null;
  }>;
  /** Remove event cover */
  removeEventCover(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<{
    storageId: string | null;
    imageUrl: string | null;
    focalPoint: { x: number; y: number } | null;
  }>;
  /**  */
  listPosts(
    input: {
      path: { parentId: string };
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<
    | Array<{
        id: string;
        createdAt: number;
        author: {
          id: string;
          kind?: 'user' | 'integration';
          user: {
            id: string;
            name: string | null;
            email: string | null;
            image: string | null;
            username: string | null;
          };
        } | null;
        attachments: Array<{
          id: string;
          storageId: string;
          filename: string;
          size: number;
          mimeType: string;
          url: string | null;
        }>;
        eventId: string;
        title: string;
        content: string;
        editedAt: number | null;
        replyCount: number;
      }>
    | {
        items: Array<{
          id: string;
          createdAt: number;
          author: {
            id: string;
            kind?: 'user' | 'integration';
            user: {
              id: string;
              name: string | null;
              email: string | null;
              image: string | null;
              username: string | null;
            };
          } | null;
          attachments: Array<{
            id: string;
            storageId: string;
            filename: string;
            size: number;
            mimeType: string;
            url: string | null;
          }>;
          eventId: string;
          title: string;
          content: string;
          editedAt: number | null;
          replyCount: number;
        }>;
        nextCursor: string | null;
      }
  >;
  listPostsItems(
    input: {
      path: { parentId: string };
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    id: string;
    createdAt: number;
    author: {
      id: string;
      kind?: 'user' | 'integration';
      user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        username: string | null;
      };
    } | null;
    attachments: Array<{
      id: string;
      storageId: string;
      filename: string;
      size: number;
      mimeType: string;
      url: string | null;
    }>;
    eventId: string;
    title: string;
    content: string;
    editedAt: number | null;
    replyCount: number;
  }>;
  /**  */
  getPost(
    input: { path: { id: string } },
    options?: RequestOptions
  ): Promise<{
    id: string;
    createdAt: number;
    author: {
      id: string;
      kind?: 'user' | 'integration';
      user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        username: string | null;
      };
    } | null;
    attachments: Array<{
      id: string;
      storageId: string;
      filename: string;
      size: number;
      mimeType: string;
      url: string | null;
    }>;
    eventId: string;
    title: string;
    content: string;
    editedAt: number | null;
    replyCount: number;
    replies: Array<{
      id: string;
      createdAt: number;
      author: {
        id: string;
        kind?: 'user' | 'integration';
        user: {
          id: string;
          name: string | null;
          email: string | null;
          image: string | null;
          username: string | null;
        };
      } | null;
      attachments: Array<{
        id: string;
        storageId: string;
        filename: string;
        size: number;
        mimeType: string;
        url: string | null;
      }>;
      postId: string;
      text: string;
      updatedAt: number | null;
    }>;
  }>;
  /**  */
  updatePost(
    input: {
      path: { id: string };
      body: {
        title?: string;
        content?: string;
        text?: string;
        attachments?: Array<{
          storageId: string;
          filename: string;
          size: number;
          mimeType: string;
          width?: number;
          height?: number;
          isSpoiler?: boolean;
          altText?: string;
        }>;
        attachmentsToAdd?: Array<{
          storageId: string;
          filename: string;
          size: number;
          mimeType: string;
          width?: number;
          height?: number;
          isSpoiler?: boolean;
          altText?: string;
        }>;
        attachmentIdsToDelete?: Array<string>;
      };
    },
    options?: RequestOptions
  ): Promise<
    | {
        id: string;
        createdAt: number;
        author: {
          id: string;
          kind?: 'user' | 'integration';
          user: {
            id: string;
            name: string | null;
            email: string | null;
            image: string | null;
            username: string | null;
          };
        } | null;
        attachments: Array<{
          id: string;
          storageId: string;
          filename: string;
          size: number;
          mimeType: string;
          url: string | null;
        }>;
        eventId: string;
        title: string;
        content: string;
        editedAt: number | null;
        replyCount: number;
        replies: Array<{
          id: string;
          createdAt: number;
          author: {
            id: string;
            kind?: 'user' | 'integration';
            user: {
              id: string;
              name: string | null;
              email: string | null;
              image: string | null;
              username: string | null;
            };
          } | null;
          attachments: Array<{
            id: string;
            storageId: string;
            filename: string;
            size: number;
            mimeType: string;
            url: string | null;
          }>;
          postId: string;
          text: string;
          updatedAt: number | null;
        }>;
      }
    | { postId: string }
  >;
  /**  */
  deletePost(
    input: { path: { id: string } },
    options?: RequestOptions
  ): Promise<null>;
  /**  */
  createPost(
    input: {
      path: { id: string };
      body: {
        title?: string;
        content?: string;
        text?: string;
        attachments?: Array<{
          storageId: string;
          filename: string;
          size: number;
          mimeType: string;
          width?: number;
          height?: number;
          isSpoiler?: boolean;
          altText?: string;
        }>;
        attachmentsToAdd?: Array<{
          storageId: string;
          filename: string;
          size: number;
          mimeType: string;
          width?: number;
          height?: number;
          isSpoiler?: boolean;
          altText?: string;
        }>;
        attachmentIdsToDelete?: Array<string>;
      };
    },
    options?: RequestOptions
  ): Promise<{ postId: string }>;
  /**  */
  listReplies(
    input: {
      path: { parentId: string };
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<
    | Array<{
        id: string;
        createdAt: number;
        author: {
          id: string;
          kind?: 'user' | 'integration';
          user: {
            id: string;
            name: string | null;
            email: string | null;
            image: string | null;
            username: string | null;
          };
        } | null;
        attachments: Array<{
          id: string;
          storageId: string;
          filename: string;
          size: number;
          mimeType: string;
          url: string | null;
        }>;
        postId: string;
        text: string;
        updatedAt: number | null;
      }>
    | {
        items: Array<{
          id: string;
          createdAt: number;
          author: {
            id: string;
            kind?: 'user' | 'integration';
            user: {
              id: string;
              name: string | null;
              email: string | null;
              image: string | null;
              username: string | null;
            };
          } | null;
          attachments: Array<{
            id: string;
            storageId: string;
            filename: string;
            size: number;
            mimeType: string;
            url: string | null;
          }>;
          postId: string;
          text: string;
          updatedAt: number | null;
        }>;
        nextCursor: string | null;
      }
  >;
  listRepliesItems(
    input: {
      path: { parentId: string };
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    id: string;
    createdAt: number;
    author: {
      id: string;
      kind?: 'user' | 'integration';
      user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        username: string | null;
      };
    } | null;
    attachments: Array<{
      id: string;
      storageId: string;
      filename: string;
      size: number;
      mimeType: string;
      url: string | null;
    }>;
    postId: string;
    text: string;
    updatedAt: number | null;
  }>;
  /**  */
  getReply(
    input: { path: { id: string } },
    options?: RequestOptions
  ): Promise<{
    id: string;
    createdAt: number;
    author: {
      id: string;
      kind?: 'user' | 'integration';
      user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        username: string | null;
      };
    } | null;
    attachments: Array<{
      id: string;
      storageId: string;
      filename: string;
      size: number;
      mimeType: string;
      url: string | null;
    }>;
    postId: string;
    text: string;
    updatedAt: number | null;
  }>;
  /**  */
  updateReply(
    input: {
      path: { id: string };
      body: {
        title?: string;
        content?: string;
        text?: string;
        attachments?: Array<{
          storageId: string;
          filename: string;
          size: number;
          mimeType: string;
          width?: number;
          height?: number;
          isSpoiler?: boolean;
          altText?: string;
        }>;
        attachmentsToAdd?: Array<{
          storageId: string;
          filename: string;
          size: number;
          mimeType: string;
          width?: number;
          height?: number;
          isSpoiler?: boolean;
          altText?: string;
        }>;
        attachmentIdsToDelete?: Array<string>;
      };
    },
    options?: RequestOptions
  ): Promise<
    | {
        id: string;
        createdAt: number;
        author: {
          id: string;
          kind?: 'user' | 'integration';
          user: {
            id: string;
            name: string | null;
            email: string | null;
            image: string | null;
            username: string | null;
          };
        } | null;
        attachments: Array<{
          id: string;
          storageId: string;
          filename: string;
          size: number;
          mimeType: string;
          url: string | null;
        }>;
        postId: string;
        text: string;
        updatedAt: number | null;
      }
    | { replyId: string }
  >;
  /**  */
  deleteReply(
    input: { path: { id: string } },
    options?: RequestOptions
  ): Promise<null>;
  /**  */
  createReply(
    input: {
      path: { id: string };
      body: {
        title?: string;
        content?: string;
        text?: string;
        attachments?: Array<{
          storageId: string;
          filename: string;
          size: number;
          mimeType: string;
          width?: number;
          height?: number;
          isSpoiler?: boolean;
          altText?: string;
        }>;
        attachmentsToAdd?: Array<{
          storageId: string;
          filename: string;
          size: number;
          mimeType: string;
          width?: number;
          height?: number;
          isSpoiler?: boolean;
          altText?: string;
        }>;
        attachmentIdsToDelete?: Array<string>;
      };
    },
    options?: RequestOptions
  ): Promise<{ replyId: string }>;
  /** List members */
  listMembers(
    input: {
      path: { eventId: string };
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<
    | MemberListResponse
    | { items: MemberListResponse; nextCursor: string | null }
  >;
  listMembersItems(
    input: {
      path: { eventId: string };
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    id: string;
    role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
    rsvpStatus: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
    joinedAt: number;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      username: string | null;
    } | null;
    personId: string;
    rsvpNote: string | null;
  }>;
  /** Update member role */
  updateMemberRole(
    input: {
      path: { eventId: string; memberId: string };
      body: UpdateMemberRoleRequest;
    },
    options?: RequestOptions
  ): Promise<MemberDetail>;
  /** Remove member */
  removeMember(
    input: { path: { eventId: string; memberId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** Leave event */
  leaveEvent(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<MessageResponse>;
  /** Update RSVP */
  updateRSVP(
    input: { path: { eventId: string }; body: UpdateRsvpRequest },
    options?: RequestOptions
  ): Promise<RsvpUpdateResponse>;
  /** Read your RSVP */
  readYourRSVP(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<RsvpUpdateResponse>;
  /** Read availability grid */
  readAvailabilityGrid(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<AvailabilityGridResponse>;
  /** Submit availability */
  submitAvailability(
    input: { path: { eventId: string }; body: SubmitAvailabilityRequest },
    options?: RequestOptions
  ): Promise<SubmitAvailabilityResponse>;
  /** Clear your availability */
  clearYourAvailability(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<{ deletedCount: number; membershipId: string }>;
  /** List potential dates */
  listPotentialDates(
    input: {
      path: { eventId: string };
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<
    | PotentialDatesResponse
    | { items: Array<PotentialDateTime>; nextCursor: string | null }
  >;
  listPotentialDatesItems(
    input: {
      path: { eventId: string };
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<PotentialDateTime>;
  /** Read your availability */
  readYourAvailability(
    input: {
      path: { eventId: string };
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      potentialDateTime: PotentialDateTime;
      status: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
      note: string | null;
      availabilityId: string | null;
    }>;
    nextCursor: string | null;
  }>;
  readYourAvailabilityItems(
    input: {
      path: { eventId: string };
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    potentialDateTime: PotentialDateTime;
    status: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
    note: string | null;
    availabilityId: string | null;
  }>;
  /** List availability responses */
  listAvailabilityResponses(
    input: {
      path: { eventId: string };
      query: {
        pagination?: 'cursor';
        limit?: number;
        cursor?: string;
        potentialDateTimeId: string;
      };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      membershipId: string;
      personId: string;
      user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        username: string | null;
      } | null;
      status: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
      note: string | null;
    }>;
    nextCursor: string | null;
  }>;
  listAvailabilityResponsesItems(
    input: {
      path: { eventId: string };
      query: {
        pagination?: 'cursor';
        limit?: number;
        cursor?: string;
        potentialDateTimeId: string;
      };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    membershipId: string;
    personId: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      username: string | null;
    } | null;
    status: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
    note: string | null;
  }>;
  /** Choose event date */
  chooseEventDate(
    input: {
      path: { eventId: string };
      body:
        | { selectionSource: 'POLL'; potentialDateTimeId: string }
        | {
            selectionSource: 'MANUAL';
            chosenDateTime: string;
            chosenEndDateTime?: string;
          };
    },
    options?: RequestOptions
  ): Promise<EventDetail>;
  /** Reset event date */
  resetEventDate(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<EventDetail>;
  /** List friends */
  listFriends(
    input?: {
      query?: { pagination?: 'cursor'; limit?: string; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<
    | FriendListResponse
    | { items: Array<FriendSummary>; nextCursor: string | null }
  >;
  listFriendsItems(
    input?: {
      query?: { pagination?: 'cursor'; limit?: string; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<FriendSummary>;
  /** List incoming requests */
  listIncomingRequests(
    input?: {
      query?: { pagination?: 'cursor'; limit?: string; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<
    | FriendRequestListResponse
    | { items: Array<FriendRequest>; nextCursor: string | null }
  >;
  listIncomingRequestsItems(
    input?: {
      query?: { pagination?: 'cursor'; limit?: string; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<FriendRequest>;
  /** List outgoing requests */
  listOutgoingRequests(
    input?: {
      query?: { pagination?: 'cursor'; limit?: string; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<
    | FriendRequestListResponse
    | { items: Array<FriendRequest>; nextCursor: string | null }
  >;
  listOutgoingRequestsItems(
    input?: {
      query?: { pagination?: 'cursor'; limit?: string; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<FriendRequest>;
  /** Search users */
  searchUsers(
    input: { query: { q: string } },
    options?: RequestOptions
  ): Promise<UserSearchResponse>;
  /** Get friendship status */
  getFriendshipStatus(
    input: { path: { targetPersonId: string } },
    options?: RequestOptions
  ): Promise<FriendshipStatusResponse>;
  /** Send friend request */
  sendFriendRequest(
    input: { body: SendFriendRequest },
    options?: RequestOptions
  ): Promise<FriendRequestResponse>;
  /** Accept friend request */
  acceptFriendRequest(
    input: { path: { friendshipId: string } },
    options?: RequestOptions
  ): Promise<MessageResponse>;
  /** Decline friend request */
  declineFriendRequest(
    input: { path: { friendshipId: string } },
    options?: RequestOptions
  ): Promise<MessageResponse>;
  /** Cancel friend request */
  cancelFriendRequest(
    input: { path: { friendshipId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** Remove friend */
  removeFriend(
    input: { path: { friendshipId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** Explicitly announce to permitted Group members */
  explicitlyAnnounceToPermittedGroupMembers(
    input: {
      path: { groupId: string };
      body: { title: string; message: string };
    },
    options?: RequestOptions
  ): Promise<{
    announcementId: string;
    state: 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
    notified: number;
    skipped: number;
  }>;
  /** Recover your explicit announcement request status */
  recoverYourExplicitAnnouncementRequestStatus(
    input: { path: { groupId: string }; query: { requestId: string } },
    options?: RequestOptions
  ): Promise<{
    announcementId: string;
    state: 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
    notified: number;
    skipped: number;
  } | null>;
  /** list persistent Group lists */
  listPersistentGroupLists(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    page: Array<{
      _id: string;
      _creationTime: number;
      groupId: string;
      kind: 'FORM' | 'POLL' | 'LIST';
      title: string;
      description: string;
      resultsVisibility: 'MANAGERS' | 'MEMBERS';
      creatorId?: string;
      createdAt: number;
      updatedAt: number;
    }>;
    isDone: boolean;
    continueCursor: string;
  }>;
  listPersistentGroupListsItems(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    _id: string;
    _creationTime: number;
    groupId: string;
    kind: 'FORM' | 'POLL' | 'LIST';
    title: string;
    description: string;
    resultsVisibility: 'MANAGERS' | 'MEMBERS';
    creatorId?: string;
    createdAt: number;
    updatedAt: number;
  }>;
  /** create persistent Group list */
  createPersistentGroupList(
    input: {
      path: { groupId: string };
      body: {
        title: string;
        description?: string;
        resultsVisibility: 'MANAGERS' | 'MEMBERS';
      };
    },
    options?: RequestOptions
  ): Promise<{ toolId: string }>;
  /** get persistent Group lists */
  getPersistentGroupLists(
    input: { path: { groupId: string; toolId: string } },
    options?: RequestOptions
  ): Promise<{
    _id: string;
    _creationTime: number;
    groupId: string;
    kind: 'FORM' | 'POLL' | 'LIST';
    title: string;
    description: string;
    resultsVisibility: 'MANAGERS' | 'MEMBERS';
    creatorId?: string;
    createdAt: number;
    updatedAt: number;
    version: number;
    canManage: boolean;
  }>;
  /** configure persistent Group list */
  configurePersistentGroupList(
    input: {
      path: { groupId: string; toolId: string };
      body: { title: string; description?: string; version: number };
    },
    options?: RequestOptions
  ): Promise<null>;
  /** remove persistent Group list */
  removePersistentGroupList(
    input: { path: { groupId: string; toolId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** settings persistent Group lists */
  settingsPersistentGroupLists(
    input: { path: { groupId: string; toolId: string } },
    options?: RequestOptions
  ): Promise<{
    _id: string;
    _creationTime: number;
    groupId: string;
    kind: 'FORM' | 'POLL' | 'LIST';
    title: string;
    description: string;
    resultsVisibility: 'MANAGERS' | 'MEMBERS';
    creatorId?: string;
    createdAt: number;
    updatedAt: number;
    version: number;
    canManage: boolean;
  }>;
  /** entries persistent Group lists */
  entriesPersistentGroupLists(
    input: {
      path: { groupId: string; toolId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    page: Array<{
      _id: string;
      _creationTime: number;
      toolId: string;
      groupId: string;
      personId?: string;
      actorId?: string;
      listTitle: string;
      text: string;
      completed: boolean;
      revision: number;
      canEdit: boolean;
      canRemove: boolean;
      createdAt: number;
      updatedAt: number;
    }>;
    isDone: boolean;
    continueCursor: string;
  }>;
  entriesPersistentGroupListsItems(
    input: {
      path: { groupId: string; toolId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    _id: string;
    _creationTime: number;
    toolId: string;
    groupId: string;
    personId?: string;
    actorId?: string;
    listTitle: string;
    text: string;
    completed: boolean;
    revision: number;
    canEdit: boolean;
    canRemove: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
  /** add persistent Group list */
  addPersistentGroupList(
    input: {
      path: { groupId: string; toolId: string };
      body: { version: number; text: string };
    },
    options?: RequestOptions
  ): Promise<{ entryId: string; state: 'PRESENT' | 'REMOVED' }>;
  /** own persistent Group lists */
  ownPersistentGroupLists(
    input: {
      path: { groupId: string; toolId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    page: Array<{
      _id: string;
      _creationTime: number;
      toolId: string;
      groupId: string;
      personId?: string;
      actorId?: string;
      listTitle: string;
      text: string;
      completed: boolean;
      revision: number;
      canEdit: boolean;
      canRemove: boolean;
      createdAt: number;
      updatedAt: number;
    }>;
    isDone: boolean;
    continueCursor: string;
  }>;
  ownPersistentGroupListsItems(
    input: {
      path: { groupId: string; toolId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    _id: string;
    _creationTime: number;
    toolId: string;
    groupId: string;
    personId?: string;
    actorId?: string;
    listTitle: string;
    text: string;
    completed: boolean;
    revision: number;
    canEdit: boolean;
    canRemove: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
  /** edit persistent Group list */
  editPersistentGroupList(
    input: {
      path: { groupId: string; toolId: string; entryId: string };
      body: {
        version: number;
        expectedRevision: number;
        text: string;
        completed: boolean;
      };
    },
    options?: RequestOptions
  ): Promise<{ revision: number }>;
  /** removeEntry persistent Group list */
  removeentryPersistentGroupList(
    input: {
      path: { groupId: string; toolId: string; entryId: string };
      body: { expectedRevision: number };
    },
    options?: RequestOptions
  ): Promise<null>;
  /** Read owner list availability and creation policy */
  readOwnerListAvailabilityAndCreationPolicy(
    input: { path: { groupId: string } },
    options?: RequestOptions
  ): Promise<{
    groupId: string;
    kind: 'LIST';
    enabled: boolean;
    creation: 'MANAGERS' | 'MEMBERS';
    canConfigure: boolean;
  }>;
  /** Owner configures list availability and creation */
  ownerConfiguresListAvailabilityAndCreation(
    input: {
      path: { groupId: string };
      body: { enabled: boolean; creation: 'MANAGERS' | 'MEMBERS' };
    },
    options?: RequestOptions
  ): Promise<{ success: boolean }>;
  /** Create an independent persistent ordinary form */
  createAnIndependentPersistentOrdinaryForm(
    input: {
      path: { groupId: string };
      body: {
        title: string;
        description?: string;
        questions: Array<{
          id: string;
          label: string;
          required: boolean;
          type:
            | 'SHORT_ANSWER'
            | 'LONG_ANSWER'
            | 'MULTIPLE_CHOICE'
            | 'CHECKBOXES'
            | 'NUMBER'
            | 'DROPDOWN'
            | 'YES_NO';
          options?: Array<string>;
        }>;
        resultsVisibility: 'MANAGERS' | 'MEMBERS';
      };
    },
    options?: RequestOptions
  ): Promise<{ toolId: string }>;
  /** List ordinary forms independently of the joining questionnaire */
  listOrdinaryFormsIndependentlyOfTheJoiningQuestionnaire(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    page: Array<{
      _id: string;
      _creationTime: number;
      groupId: string;
      kind: 'FORM' | 'POLL' | 'LIST';
      title: string;
      description: string;
      resultsVisibility: 'MANAGERS' | 'MEMBERS';
      creatorId?: string;
      createdAt: number;
      updatedAt: number;
    }>;
    isDone: boolean;
    continueCursor: string;
  }>;
  listOrdinaryFormsIndependentlyOfTheJoiningQuestionnaireItems(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    _id: string;
    _creationTime: number;
    groupId: string;
    kind: 'FORM' | 'POLL' | 'LIST';
    title: string;
    description: string;
    resultsVisibility: 'MANAGERS' | 'MEMBERS';
    creatorId?: string;
    createdAt: number;
    updatedAt: number;
  }>;
  /** Read preserved form configuration as a current eligible manager, including while disabled */
  getGroupsFormsSettings(
    input: { path: { groupId: string; toolId: string } },
    options?: RequestOptions
  ): Promise<{
    _id: string;
    _creationTime: number;
    groupId: string;
    kind: 'FORM' | 'POLL' | 'LIST';
    title: string;
    description: string;
    resultsVisibility: 'MANAGERS' | 'MEMBERS';
    creatorId?: string;
    createdAt: number;
    updatedAt: number;
    version: number;
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
    }>;
    canManage: true;
  }>;
  /** Read current form and your compatible answers */
  readCurrentFormAndYourCompatibleAnswers(
    input: {
      path: { groupId: string; toolId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    _id: string;
    _creationTime: number;
    groupId: string;
    kind: 'FORM' | 'POLL' | 'LIST';
    title: string;
    description: string;
    resultsVisibility: 'MANAGERS' | 'MEMBERS';
    creatorId?: string;
    createdAt: number;
    updatedAt: number;
    version: number;
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
    }>;
    answers: Record<string, string | number | boolean | Array<string>>;
    savedQuestions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
    }>;
    savedVersion: number | null;
    responseRevision: number;
    canManage: boolean;
    canReview: boolean;
    enabled: boolean;
  }>;
  /** Manage current form configuration without erasing saved definitions */
  patchGroupsForms(
    input: {
      path: { groupId: string; toolId: string };
      body: {
        title: string;
        description?: string;
        questions: Array<{
          id: string;
          label: string;
          required: boolean;
          type:
            | 'SHORT_ANSWER'
            | 'LONG_ANSWER'
            | 'MULTIPLE_CHOICE'
            | 'CHECKBOXES'
            | 'NUMBER'
            | 'DROPDOWN'
            | 'YES_NO';
          options?: Array<string>;
        }>;
        version: number;
      };
    },
    options?: RequestOptions
  ): Promise<null>;
  /** Explicitly delete form and all responses */
  explicitlyDeleteFormAndAllResponses(
    input: { path: { groupId: string; toolId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** Read only your retained response snapshots */
  readOnlyYourRetainedResponseSnapshots(
    input: {
      path: { groupId: string; toolId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    page: Array<{
      _id: string;
      _creationTime: number;
      toolId: string;
      groupId: string;
      personId?: string;
      revision: number;
      version: number;
      questions: Array<{
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
      }>;
      answers: Record<string, string | number | boolean | Array<string>>;
      createdAt: number;
      updatedAt: number;
    }>;
    isDone: boolean;
    continueCursor: string;
  }>;
  readOnlyYourRetainedResponseSnapshotsItems(
    input: {
      path: { groupId: string; toolId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    _id: string;
    _creationTime: number;
    toolId: string;
    groupId: string;
    personId?: string;
    revision: number;
    version: number;
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
    }>;
    answers: Record<string, string | number | boolean | Array<string>>;
    createdAt: number;
    updatedAt: number;
  }>;
  /** Read stated-visibility latest responses */
  readStatedVisibilityLatestResponses(
    input: {
      path: { groupId: string; toolId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    page: Array<{
      _id: string;
      _creationTime: number;
      toolId: string;
      groupId: string;
      personId?: string;
      revision: number;
      version: number;
      questions: Array<{
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
      }>;
      answers: Record<string, string | number | boolean | Array<string>>;
      createdAt: number;
      updatedAt: number;
    }>;
    isDone: boolean;
    continueCursor: string;
  }>;
  readStatedVisibilityLatestResponsesItems(
    input: {
      path: { groupId: string; toolId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    _id: string;
    _creationTime: number;
    toolId: string;
    groupId: string;
    personId?: string;
    revision: number;
    version: number;
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
    }>;
    answers: Record<string, string | number | boolean | Array<string>>;
    createdAt: number;
    updatedAt: number;
  }>;
  /** Submit or edit your validated response using current form and response revisions */
  putGroupsFormsResponse(
    input: {
      path: { groupId: string; toolId: string };
      body: {
        version: number;
        expectedRevision: number;
        answers: Record<string, string | number | boolean | Array<string>>;
      };
    },
    options?: RequestOptions
  ): Promise<{ revision: number }>;
  /** Remove your response and private retained history */
  removeYourResponseAndPrivateRetainedHistory(
    input: { path: { groupId: string; toolId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** Moderate a current ordinary response including anonymous shared content */
  deleteGroupsFormsResults(
    input: { path: { groupId: string; toolId: string; responseId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** Read form availability/creation policy */
  readFormAvailabilityCreationPolicy(
    input: { path: { groupId: string } },
    options?: RequestOptions
  ): Promise<{
    groupId: string;
    kind: 'FORM';
    enabled: boolean;
    creation: 'MANAGERS' | 'MEMBERS';
    canConfigure: boolean;
  }>;
  /** Owner controls form availability and creation */
  ownerControlsFormAvailabilityAndCreation(
    input: {
      path: { groupId: string };
      body: { enabled: boolean; creation: 'MANAGERS' | 'MEMBERS' };
    },
    options?: RequestOptions
  ): Promise<{ success: boolean }>;
  /** Create an independent persistent persistent poll */
  createAnIndependentPersistentPersistentPoll(
    input: {
      path: { groupId: string };
      body: {
        title: string;
        description?: string;
        mode: 'SINGLE' | 'MULTIPLE';
        options: Array<{ id: string; label: string }>;
        resultsVisibility: 'MANAGERS' | 'MEMBERS';
      };
    },
    options?: RequestOptions
  ): Promise<{ toolId: string }>;
  /** List persistent polls independently of the joining questionnaire */
  getGroupsPolls(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    page: Array<{
      _id: string;
      _creationTime: number;
      groupId: string;
      kind: 'FORM' | 'POLL' | 'LIST';
      title: string;
      description: string;
      resultsVisibility: 'MANAGERS' | 'MEMBERS';
      creatorId?: string;
      createdAt: number;
      updatedAt: number;
    }>;
    isDone: boolean;
    continueCursor: string;
  }>;
  getGroupsPollsItems(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    _id: string;
    _creationTime: number;
    groupId: string;
    kind: 'FORM' | 'POLL' | 'LIST';
    title: string;
    description: string;
    resultsVisibility: 'MANAGERS' | 'MEMBERS';
    creatorId?: string;
    createdAt: number;
    updatedAt: number;
  }>;
  /** Read preserved poll configuration as a current eligible manager, including while disabled */
  getGroupsPollsSettings(
    input: { path: { groupId: string; toolId: string } },
    options?: RequestOptions
  ): Promise<{
    _id: string;
    _creationTime: number;
    groupId: string;
    kind: 'FORM' | 'POLL' | 'LIST';
    title: string;
    description: string;
    resultsVisibility: 'MANAGERS' | 'MEMBERS';
    creatorId?: string;
    createdAt: number;
    updatedAt: number;
    version: number;
    semanticVersion: number;
    mode: 'SINGLE' | 'MULTIPLE';
    options: Array<{ id: string; label: string }>;
    canManage: true;
  }>;
  /** Read current poll and your compatible selections */
  readCurrentPollAndYourCompatibleSelections(
    input: {
      path: { groupId: string; toolId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    _id: string;
    _creationTime: number;
    groupId: string;
    kind: 'FORM' | 'POLL' | 'LIST';
    title: string;
    description: string;
    resultsVisibility: 'MANAGERS' | 'MEMBERS';
    creatorId?: string;
    createdAt: number;
    updatedAt: number;
    version: number;
    semanticVersion: number;
    mode: 'SINGLE' | 'MULTIPLE';
    options: Array<{ id: string; label: string }>;
    selections: Array<string>;
    savedOptions: Array<{ id: string; label: string }>;
    savedVersion: number | null;
    voteRevision: number;
    canManage: boolean;
    canReview: boolean;
    enabled: boolean;
  }>;
  /** Manage current poll configuration without erasing saved definitions */
  patchGroupsPolls(
    input: {
      path: { groupId: string; toolId: string };
      body: {
        title: string;
        description?: string;
        mode: 'SINGLE' | 'MULTIPLE';
        options: Array<{ id: string; label: string }>;
        version: number;
      };
    },
    options?: RequestOptions
  ): Promise<null>;
  /** Delete a poll and all votes as a current eligible manager */
  deleteAPollAndAllVotesAsACurrentEligibleManager(
    input: { path: { groupId: string; toolId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** Read only your retained vote snapshots */
  readOnlyYourRetainedVoteSnapshots(
    input: {
      path: { groupId: string; toolId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    page: Array<{
      _id: string;
      _creationTime: number;
      toolId: string;
      groupId: string;
      personId?: string;
      revision: number;
      version: number;
      semanticVersion: number;
      mode: 'SINGLE' | 'MULTIPLE';
      options: Array<{ id: string; label: string }>;
      selections: Array<string>;
      removed: boolean;
      createdAt: number;
      updatedAt: number;
    }>;
    isDone: boolean;
    continueCursor: string;
    voteRevision: number;
  }>;
  readOnlyYourRetainedVoteSnapshotsItems(
    input: {
      path: { groupId: string; toolId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    _id: string;
    _creationTime: number;
    toolId: string;
    groupId: string;
    personId?: string;
    revision: number;
    version: number;
    semanticVersion: number;
    mode: 'SINGLE' | 'MULTIPLE';
    options: Array<{ id: string; label: string }>;
    selections: Array<string>;
    removed: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
  /** Read stated-visibility latest votes */
  readStatedVisibilityLatestVotes(
    input: {
      path: { groupId: string; toolId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    page: Array<{
      _id: string;
      _creationTime: number;
      toolId: string;
      groupId: string;
      personId?: string;
      revision: number;
      version: number;
      semanticVersion: number;
      mode: 'SINGLE' | 'MULTIPLE';
      options: Array<{ id: string; label: string }>;
      selections: Array<string>;
      removed: boolean;
      createdAt: number;
      updatedAt: number;
      isCurrent: boolean;
    }>;
    isDone: boolean;
    continueCursor: string;
  }>;
  readStatedVisibilityLatestVotesItems(
    input: {
      path: { groupId: string; toolId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    _id: string;
    _creationTime: number;
    toolId: string;
    groupId: string;
    personId?: string;
    revision: number;
    version: number;
    semanticVersion: number;
    mode: 'SINGLE' | 'MULTIPLE';
    options: Array<{ id: string; label: string }>;
    selections: Array<string>;
    removed: boolean;
    createdAt: number;
    updatedAt: number;
    isCurrent: boolean;
  }>;
  /** Submit or edit your validated vote using current poll and vote revisions */
  putGroupsPollsVote(
    input: {
      path: { groupId: string; toolId: string };
      body: {
        version: number;
        expectedRevision: number;
        selections: Array<string>;
      };
    },
    options?: RequestOptions
  ): Promise<{ revision: number }>;
  /** Remove your vote and private history using optimistic revision */
  removeYourVoteAndPrivateHistoryUsingOptimisticRevision(
    input: {
      path: { groupId: string; toolId: string };
      body: { expectedRevision: number };
    },
    options?: RequestOptions
  ): Promise<null>;
  /** Moderate a current ordinary vote including anonymous shared content */
  deleteGroupsPollsResults(
    input: {
      path: { groupId: string; toolId: string; voteId: string };
      body: { expectedRevision: number };
    },
    options?: RequestOptions
  ): Promise<null>;
  /** Read poll availability/creation policy */
  readPollAvailabilityCreationPolicy(
    input: { path: { groupId: string } },
    options?: RequestOptions
  ): Promise<{
    groupId: string;
    kind: 'POLL';
    enabled: boolean;
    creation: 'MANAGERS' | 'MEMBERS';
    canConfigure: boolean;
  }>;
  /** Owner controls poll availability and creation */
  ownerControlsPollAvailabilityAndCreation(
    input: {
      path: { groupId: string };
      body: { enabled: boolean; creation: 'MANAGERS' | 'MEMBERS' };
    },
    options?: RequestOptions
  ): Promise<{ success: boolean }>;
  /** Commit coordinated community exclusion as staff */
  expelCommunityMember(
    input: {
      path: { groupId: string };
      body: { personId: string; policy: 'coordinated' };
    },
    options?: RequestOptions
  ): Promise<{
    operationId: string;
    outcome: 'committed';
    exclusion: 'active';
    generation: number;
    cleanup: 'pending' | 'blocked' | 'complete';
    conflicts: Array<{ eventId: string; code: string }>;
  }>;
  /** Reconcile coordinated exclusion progress as current staff */
  readCommunityExpulsion(
    input: { path: { groupId: string; personId: string } },
    options?: RequestOptions
  ): Promise<{
    operationId: string;
    outcome: 'committed';
    exclusion: 'active';
    generation: number;
    cleanup: 'pending' | 'blocked' | 'complete';
    conflicts: Array<{ eventId: string; code: string }>;
  } | null>;
  /** List your Groups */
  listYourGroups(
    input?: { query?: { limit?: number; cursor?: string } },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      joiningQuestionnaire: {
        enabled: boolean;
        requiredCompletion: boolean;
        requiresCompletion: boolean;
        canAccessMemberContent: boolean;
        completed: boolean;
        shouldPrompt: boolean;
        version: number;
      };
      _id: string;
      _creationTime: number;
      ownerId: string;
      name: string;
      description?: string;
      image?: string;
      createdAt: number;
      updatedAt: number;
      role: 'OWNER' | 'MODERATOR' | 'MEMBER';
      viewerRole: 'OWNER' | 'MODERATOR' | 'MEMBER';
      canManageIdentity: boolean;
      memberCount: number;
      eventSharingPolicy: 'MANAGERS' | 'MEMBERS';
      canShareEvents: boolean;
      invitationsEnabled: boolean;
      applicationsEnabled: boolean;
      applicationQuestions: Array<{
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
      }>;
      canManageInvitations: boolean;
      canManageMembers: boolean;
      canManageRoles: boolean;
      canLeave: boolean;
    }>;
    nextCursor: string | null;
  }>;
  listYourGroupsItems(
    input?: { query?: { limit?: number; cursor?: string } },
    options?: RequestOptions
  ): AsyncIterable<{
    joiningQuestionnaire: {
      enabled: boolean;
      requiredCompletion: boolean;
      requiresCompletion: boolean;
      canAccessMemberContent: boolean;
      completed: boolean;
      shouldPrompt: boolean;
      version: number;
    };
    _id: string;
    _creationTime: number;
    ownerId: string;
    name: string;
    description?: string;
    image?: string;
    createdAt: number;
    updatedAt: number;
    role: 'OWNER' | 'MODERATOR' | 'MEMBER';
    viewerRole: 'OWNER' | 'MODERATOR' | 'MEMBER';
    canManageIdentity: boolean;
    memberCount: number;
    eventSharingPolicy: 'MANAGERS' | 'MEMBERS';
    canShareEvents: boolean;
    invitationsEnabled: boolean;
    applicationsEnabled: boolean;
    applicationQuestions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
    }>;
    canManageInvitations: boolean;
    canManageMembers: boolean;
    canManageRoles: boolean;
    canLeave: boolean;
  }>;
  /** Create an owner-only Group */
  createAnOwnerOnlyGroup(
    input: { body: { name: string; description?: string; image?: string } },
    options?: RequestOptions
  ): Promise<{ groupId: string }>;
  /** Read an admitted Group */
  readAnAdmittedGroup(
    input: { path: { groupId: string } },
    options?: RequestOptions
  ): Promise<{
    joiningQuestionnaire: {
      enabled: boolean;
      requiredCompletion: boolean;
      requiresCompletion: boolean;
      canAccessMemberContent: boolean;
      completed: boolean;
      shouldPrompt: boolean;
      version: number;
    };
    _id: string;
    _creationTime: number;
    ownerId: string;
    name: string;
    description?: string;
    image?: string;
    createdAt: number;
    updatedAt: number;
    role: 'OWNER' | 'MODERATOR' | 'MEMBER';
    viewerRole: 'OWNER' | 'MODERATOR' | 'MEMBER';
    canManageIdentity: boolean;
    memberCount: number;
    eventSharingPolicy: 'MANAGERS' | 'MEMBERS';
    canShareEvents: boolean;
    invitationsEnabled: boolean;
    applicationsEnabled: boolean;
    applicationQuestions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
    }>;
    canManageInvitations: boolean;
    canManageMembers: boolean;
    canManageRoles: boolean;
    canLeave: boolean;
  }>;
  /** Update Group identity as owner */
  updateGroupIdentityAsOwner(
    input: {
      path: { groupId: string };
      body: {
        name?: string;
        description?: string | null;
        image?: string | null;
      };
    },
    options?: RequestOptions
  ): Promise<null>;
  /** Explicitly delete a Group as owner */
  explicitlyDeleteAGroupAsOwner(
    input: { path: { groupId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** Read own community context */
  readOwnCommunityContext(
    input: { path: { groupId: string }; query?: { cursor?: string } },
    options?: RequestOptions
  ): Promise<{
    contractVersion: 'red-room.v1';
    group: { id: string; name: string };
    form: {
      enabled: boolean;
      revision: string;
      questions: Array<{
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
      }>;
    };
    membership: { role: 'OWNER' | 'MODERATOR' | 'MEMBER' } | null;
    eligibility: {
      canApply: boolean;
      canAccessMemberContent: boolean;
      banned: boolean;
      excluded: boolean;
    };
    applications: Array<{
      id: string;
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      revision: number;
      questions: Array<{
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
      }>;
      answers: Record<string, string | number | boolean | Array<string>>;
      submittedAt: number;
      decisions: Array<{
        status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
        at: number;
      }>;
    }>;
    nextCursor: string | null;
    grantedActions: Array<string>;
    allowedActions: Array<string>;
    announcementPreference: { supported: false; subscribed: null };
  }>;
  /** Read the single current selected Group Event */
  readCurrentCommunityEvent(
    input: { path: { groupId: string } },
    options?: RequestOptions
  ): Promise<
    | { kind: 'none' }
    | { kind: 'conflict'; code: 'STAFF_CONFIGURATION_CONFLICT' }
    | {
        kind: 'event';
        supportedRsvpChoices: Array<'PENDING' | 'YES' | 'NO' | 'MAYBE'>;
        allowedRsvpTransitions: Array<'PENDING' | 'YES' | 'NO' | 'MAYBE'>;
        event: {
          id: string;
          title: string;
          location: string | null;
          description: string | null;
          timezone: string;
          startsAt: number | null;
          endsAt: number | null;
          ongoing: boolean;
          roster: Array<{ displayName: string }> | null;
        };
        participation: {
          membershipId: string;
          revision: number;
          rsvp: 'PENDING' | 'YES' | 'NO' | 'MAYBE';
        } | null;
        allowedActions: Array<string>;
      }
  >;
  /** submitCommunityApplication */
  submitCommunityApplication(
    input: {
      path: { groupId: string };
      body: {
        formRevision: string;
        answers: Record<string, string | number | boolean | Array<string>>;
      };
    },
    options?: RequestOptions
  ): Promise<{
    operationId: string;
    outcome: 'committed';
    result: {
      applicationId: string;
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      revision: number;
    };
    effects: { email: 'not-requested'; cleanup: 'not-requested' };
  }>;
  /** editCommunityApplication */
  editCommunityApplication(
    input: {
      path: { groupId: string; applicationId: string };
      body: {
        expectedRevision: number;
        answers: Record<string, string | number | boolean | Array<string>>;
      };
    },
    options?: RequestOptions
  ): Promise<{
    operationId: string;
    outcome: 'committed';
    result: {
      applicationId: string;
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      revision: number;
    };
    effects: { email: 'not-requested'; cleanup: 'not-requested' };
  }>;
  /** withdrawCommunityApplication */
  withdrawCommunityApplication(
    input: {
      path: { groupId: string; applicationId: string };
      body: { expectedRevision: number };
    },
    options?: RequestOptions
  ): Promise<{
    operationId: string;
    outcome: 'committed';
    result: {
      applicationId: string;
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      revision: number;
    };
    effects: { email: 'not-requested'; cleanup: 'not-requested' };
  }>;
  /** Read your private joining questionnaire and current access status */
  getGroupsJoiningQuestionnaire(
    input: { path: { groupId: string } },
    options?: RequestOptions
  ): Promise<{
    groupId: string;
    enabled: boolean;
    requiredCompletion: boolean;
    requiresCompletion: boolean;
    canAccessMemberContent: boolean;
    version: number;
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
      version: number;
    }>;
    answers: Record<string, string | number | boolean | Array<string>>;
    savedQuestions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
      version: number;
    }>;
    completed: boolean;
    shouldPrompt: boolean;
    canEdit: boolean;
    canConfigure: boolean;
    canReview: boolean;
  }>;
  /** Configure the joining questionnaire and completion policy as Group owner */
  putGroupsJoiningQuestionnaire(
    input: {
      path: { groupId: string };
      body: {
        enabled: boolean;
        requiredCompletion?: boolean;
        questions: Array<{
          id: string;
          label: string;
          required: boolean;
          type:
            | 'SHORT_ANSWER'
            | 'LONG_ANSWER'
            | 'MULTIPLE_CHOICE'
            | 'CHECKBOXES'
            | 'NUMBER'
            | 'DROPDOWN'
            | 'YES_NO';
          options?: Array<string>;
        }>;
      };
    },
    options?: RequestOptions
  ): Promise<{
    groupId: string;
    enabled: boolean;
    requiredCompletion: boolean;
    requiresCompletion: boolean;
    canAccessMemberContent: boolean;
    version: number;
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
      version: number;
    }>;
    answers: Record<string, string | number | boolean | Array<string>>;
    savedQuestions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
      version: number;
    }>;
    completed: boolean;
    shouldPrompt: boolean;
    canEdit: boolean;
    canConfigure: boolean;
    canReview: boolean;
  }>;
  /** Submit or edit private answers as an admitted member */
  submitOrEditPrivateAnswersAsAnAdmittedMember(
    input: {
      path: { groupId: string };
      body: {
        version: number;
        answers: Record<string, string | number | boolean | Array<string>>;
      };
    },
    options?: RequestOptions
  ): Promise<{
    groupId: string;
    enabled: boolean;
    requiredCompletion: boolean;
    requiresCompletion: boolean;
    canAccessMemberContent: boolean;
    version: number;
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
      version: number;
    }>;
    answers: Record<string, string | number | boolean | Array<string>>;
    savedQuestions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
      version: number;
    }>;
    completed: boolean;
    shouldPrompt: boolean;
    canEdit: boolean;
    canConfigure: boolean;
    canReview: boolean;
  }>;
  /** Review private answers as current owner or moderator */
  reviewPrivateAnswersAsCurrentOwnerOrModerator(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      groupId: string;
      enabled: boolean;
      requiredCompletion: boolean;
      requiresCompletion: boolean;
      canAccessMemberContent: boolean;
      version: number;
      questions: Array<{
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
        version: number;
      }>;
      answers: Record<string, string | number | boolean | Array<string>>;
      savedQuestions: Array<{
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
        version: number;
      }>;
      completed: boolean;
      shouldPrompt: boolean;
      canEdit: boolean;
      canConfigure: boolean;
      canReview: boolean;
      author: {
        personId: string;
        name: string | null;
        username: string | null;
        image: string | null;
      };
    }>;
    nextCursor: string | null;
  }>;
  reviewPrivateAnswersAsCurrentOwnerOrModeratorItems(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    groupId: string;
    enabled: boolean;
    requiredCompletion: boolean;
    requiresCompletion: boolean;
    canAccessMemberContent: boolean;
    version: number;
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
      version: number;
    }>;
    answers: Record<string, string | number | boolean | Array<string>>;
    savedQuestions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
      version: number;
    }>;
    completed: boolean;
    shouldPrompt: boolean;
    canEdit: boolean;
    canConfigure: boolean;
    canReview: boolean;
    author: {
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  }>;
  /** Read own retained answer history or review an author as current manager */
  getGroupsJoiningQuestionnaireHistory(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string; authorId?: string };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      _id: string;
      _creationTime: number;
      groupId: string;
      personId: string;
      question: {
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
        version: number;
      };
      answer?: string | number | boolean | Array<string>;
      answeredAt: number;
    }>;
    nextCursor: string | null;
  }>;
  getGroupsJoiningQuestionnaireHistoryItems(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string; authorId?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    _id: string;
    _creationTime: number;
    groupId: string;
    personId: string;
    question: {
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
      version: number;
    };
    answer?: string | number | boolean | Array<string>;
    answeredAt: number;
  }>;
  /** List your private Group invitations */
  listYourPrivateGroupInvitations(
    input?: {
      query?: {
        limit?: number;
        cursor?: string;
        status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
      };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      inviteId: string;
      status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
      createdAt: number;
      respondedAt: number | null;
      group: {
        groupId: string;
        name: string;
        description: string | null;
        image: string | null;
      };
      inviter: {
        personId: string;
        name: string | null;
        username: string | null;
        image: string | null;
      };
      invitee: {
        personId: string;
        name: string | null;
        username: string | null;
        image: string | null;
      };
      available: boolean;
      canBan: boolean;
    }>;
    nextCursor: string | null;
  }>;
  listYourPrivateGroupInvitationsItems(
    input?: {
      query?: {
        limit?: number;
        cursor?: string;
        status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
      };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    inviteId: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
    createdAt: number;
    respondedAt: number | null;
    group: {
      groupId: string;
      name: string;
      description: string | null;
      image: string | null;
    };
    inviter: {
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
    invitee: {
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
    available: boolean;
    canBan: boolean;
  }>;
  /** List Group invitations as manager */
  listGroupInvitationsAsManager(
    input: {
      path: { groupId: string };
      query?: {
        limit?: number;
        cursor?: string;
        status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
      };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      inviteId: string;
      status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
      createdAt: number;
      respondedAt: number | null;
      group: {
        groupId: string;
        name: string;
        description: string | null;
        image: string | null;
      };
      inviter: {
        personId: string;
        name: string | null;
        username: string | null;
        image: string | null;
      };
      invitee: {
        personId: string;
        name: string | null;
        username: string | null;
        image: string | null;
      };
      available: boolean;
      canBan: boolean;
    }>;
    nextCursor: string | null;
  }>;
  listGroupInvitationsAsManagerItems(
    input: {
      path: { groupId: string };
      query?: {
        limit?: number;
        cursor?: string;
        status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
      };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    inviteId: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
    createdAt: number;
    respondedAt: number | null;
    group: {
      groupId: string;
      name: string;
      description: string | null;
      image: string | null;
    };
    inviter: {
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
    invitee: {
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
    available: boolean;
    canBan: boolean;
  }>;
  /** Invite an existing user as Group owner */
  inviteAnExistingUserAsGroupOwner(
    input: { path: { groupId: string }; body: { inviteePersonId: string } },
    options?: RequestOptions
  ): Promise<{ inviteId: string; status: 'PENDING' }>;
  /** Read admitted Group roster */
  readAdmittedGroupRoster(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
      role: 'OWNER' | 'MODERATOR' | 'MEMBER';
      joinedAt: number;
      canRemove: boolean;
      canBan: boolean;
      canChangeRole: boolean;
    }>;
    nextCursor: string | null;
  }>;
  readAdmittedGroupRosterItems(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    personId: string;
    name: string | null;
    username: string | null;
    image: string | null;
    role: 'OWNER' | 'MODERATOR' | 'MEMBER';
    joinedAt: number;
    canRemove: boolean;
    canBan: boolean;
    canChangeRole: boolean;
  }>;
  /** Configure Group invitations as owner */
  configureGroupInvitationsAsOwner(
    input: { path: { groupId: string }; body: { invitationsEnabled: boolean } },
    options?: RequestOptions
  ): Promise<null>;
  /** Accept your Group invitation */
  acceptYourGroupInvitation(
    input: { path: { inviteId: string } },
    options?: RequestOptions
  ): Promise<{
    groupId: string;
    membershipId: string;
    status: 'ACCEPTED';
    joiningQuestionnaire: {
      enabled: boolean;
      requiredCompletion: boolean;
      requiresCompletion: boolean;
      canAccessMemberContent: boolean;
      version: number;
      completed: boolean;
      shouldPrompt: boolean;
    };
  }>;
  /** Decline your Group invitation */
  declineYourGroupInvitation(
    input: { path: { inviteId: string } },
    options?: RequestOptions
  ): Promise<{ status: 'DECLINED' | 'CANCELLED' }>;
  /** Cancel a pending invitation as Group manager */
  cancelAPendingInvitationAsGroupManager(
    input: { path: { inviteId: string } },
    options?: RequestOptions
  ): Promise<{ status: 'DECLINED' | 'CANCELLED' }>;
  /** List active Group bans as manager */
  listActiveGroupBansAsManager(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
      bannedAt: number;
    }>;
    nextCursor: string | null;
  }>;
  listActiveGroupBansAsManagerItems(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    personId: string;
    name: string | null;
    username: string | null;
    image: string | null;
    bannedAt: number;
  }>;
  /** Appoint or demote a Group moderator as owner */
  appointOrDemoteAGroupModeratorAsOwner(
    input: {
      path: { groupId: string; personId: string };
      body: { role: 'MODERATOR' | 'MEMBER' };
    },
    options?: RequestOptions
  ): Promise<{ role: 'MODERATOR' | 'MEMBER' }>;
  /** Remove an ordinary member without banning */
  removeAnOrdinaryMemberWithoutBanning(
    input: { path: { groupId: string; personId: string } },
    options?: RequestOptions
  ): Promise<{ removed: boolean }>;
  /** Ban an ordinary member or nonmember */
  banAnOrdinaryMemberOrNonmember(
    input: { path: { groupId: string; personId: string } },
    options?: RequestOptions
  ): Promise<{ banned: boolean }>;
  /** Lift a Group ban without admitting membership */
  liftAGroupBanWithoutAdmittingMembership(
    input: { path: { groupId: string; personId: string } },
    options?: RequestOptions
  ): Promise<{ banned: boolean }>;
  /** Leave your own Group membership */
  leaveYourOwnGroupMembership(
    input: { path: { groupId: string } },
    options?: RequestOptions
  ): Promise<{ left: boolean }>;
  /** Read private participant ownership offer status */
  readPrivateParticipantOwnershipOfferStatus(
    input: { path: { groupId: string } },
    options?: RequestOptions
  ): Promise<{
    groupId: string;
    ownerId: string;
    transferId: string | null;
    offeredById: string | null;
    recipientId: string | null;
    recipient: {
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
    } | null;
    status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
    explanation: string;
    canOffer: boolean;
    canAccept: boolean;
    canDecline: boolean;
    canCancel: boolean;
  } | null>;
  /** Offer Group responsibility to an admitted member */
  offerGroupResponsibilityToAnAdmittedMember(
    input: { path: { groupId: string }; body: { recipientId: string } },
    options?: RequestOptions
  ): Promise<{
    groupId: string;
    ownerId: string;
    transferId: string | null;
    offeredById: string | null;
    recipientId: string | null;
    recipient: {
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
    } | null;
    status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
    explanation: string;
    canOffer: boolean;
    canAccept: boolean;
    canDecline: boolean;
    canCancel: boolean;
  } | null>;
  /** accept the observed ownership offer */
  acceptTheObservedOwnershipOffer(
    input: { path: { groupId: string }; body: { transferId: string } },
    options?: RequestOptions
  ): Promise<{
    groupId: string;
    ownerId: string;
    transferId: string | null;
    offeredById: string | null;
    recipientId: string | null;
    recipient: {
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
    } | null;
    status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
    explanation: string;
    canOffer: boolean;
    canAccept: boolean;
    canDecline: boolean;
    canCancel: boolean;
  } | null>;
  /** decline the observed ownership offer */
  declineTheObservedOwnershipOffer(
    input: { path: { groupId: string }; body: { transferId: string } },
    options?: RequestOptions
  ): Promise<{
    groupId: string;
    ownerId: string;
    transferId: string | null;
    offeredById: string | null;
    recipientId: string | null;
    recipient: {
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
    } | null;
    status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
    explanation: string;
    canOffer: boolean;
    canAccept: boolean;
    canDecline: boolean;
    canCancel: boolean;
  } | null>;
  /** cancel the observed ownership offer */
  cancelTheObservedOwnershipOffer(
    input: { path: { groupId: string }; body: { transferId: string } },
    options?: RequestOptions
  ): Promise<{
    groupId: string;
    ownerId: string;
    transferId: string | null;
    offeredById: string | null;
    recipientId: string | null;
    recipient: {
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
    } | null;
    status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
    explanation: string;
    canOffer: boolean;
    canAccept: boolean;
    canDecline: boolean;
    canCancel: boolean;
  } | null>;
  /** Read admission questions and your private pending application */
  readAdmissionQuestionsAndYourPrivatePendingApplication(
    input: { path: { groupId: string } },
    options?: RequestOptions
  ): Promise<{
    applicationsEnabled: boolean;
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
    }>;
    pending: {
      _id: string;
      _creationTime: number;
      groupId: string;
      personId: string;
      questions: Array<{
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
      }>;
      answers: Record<string, string | number | boolean | Array<string>>;
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      submittedAt: number;
      updatedAt: number;
      decisions: Array<{
        status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
        actorId?: string;
        at: number;
        reason?: string;
      }>;
    } | null;
    canApply: boolean;
    canReview: boolean;
  }>;
  /** Configure Group applications as owner */
  configureGroupApplicationsAsOwner(
    input: {
      path: { groupId: string };
      body: {
        applicationsEnabled: boolean;
        questions: Array<{
          id: string;
          label: string;
          required: boolean;
          type:
            | 'SHORT_ANSWER'
            | 'LONG_ANSWER'
            | 'MULTIPLE_CHOICE'
            | 'CHECKBOXES'
            | 'NUMBER'
            | 'DROPDOWN'
            | 'YES_NO';
          options?: Array<string>;
        }>;
      };
    },
    options?: RequestOptions
  ): Promise<{ success: true }>;
  /** Read your retained private Group application history */
  readYourRetainedPrivateGroupApplicationHistory(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      _id: string;
      _creationTime: number;
      groupId: string;
      personId: string;
      questions: Array<{
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
      }>;
      answers: Record<string, string | number | boolean | Array<string>>;
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      submittedAt: number;
      updatedAt: number;
      decisions: Array<{
        status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
        actorId?: string;
        at: number;
        reason?: string;
      }>;
    }>;
    nextCursor: string | null;
  }>;
  readYourRetainedPrivateGroupApplicationHistoryItems(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    _id: string;
    _creationTime: number;
    groupId: string;
    personId: string;
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
    }>;
    answers: Record<string, string | number | boolean | Array<string>>;
    status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
    submittedAt: number;
    updatedAt: number;
    decisions: Array<{
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      actorId?: string;
      at: number;
      reason?: string;
    }>;
  }>;
  /** Review private Group application queue as manager */
  reviewPrivateGroupApplicationQueueAsManager(
    input: {
      path: { groupId: string };
      query?: {
        limit?: number;
        cursor?: string;
        status?: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      _id: string;
      _creationTime: number;
      groupId: string;
      personId: string;
      questions: Array<{
        id: string;
        label: string;
        required: boolean;
        type:
          | 'SHORT_ANSWER'
          | 'LONG_ANSWER'
          | 'MULTIPLE_CHOICE'
          | 'CHECKBOXES'
          | 'NUMBER'
          | 'DROPDOWN'
          | 'YES_NO';
        options?: Array<string>;
      }>;
      answers: Record<string, string | number | boolean | Array<string>>;
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      submittedAt: number;
      updatedAt: number;
      decisions: Array<{
        status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
        actorId?: string;
        at: number;
        reason?: string;
      }>;
      applicant: {
        personId: string;
        name: string | null;
        username: string | null;
        image: string | null;
      };
    }>;
    nextCursor: string | null;
  }>;
  reviewPrivateGroupApplicationQueueAsManagerItems(
    input: {
      path: { groupId: string };
      query?: {
        limit?: number;
        cursor?: string;
        status?: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    _id: string;
    _creationTime: number;
    groupId: string;
    personId: string;
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
    }>;
    answers: Record<string, string | number | boolean | Array<string>>;
    status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
    submittedAt: number;
    updatedAt: number;
    decisions: Array<{
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      actorId?: string;
      at: number;
      reason?: string;
    }>;
    applicant: {
      personId: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  }>;
  /** Submit or edit your pending admission application */
  submitOrEditYourPendingAdmissionApplication(
    input: {
      path: { groupId: string };
      body: {
        answers: Record<string, string | number | boolean | Array<string>>;
      };
    },
    options?: RequestOptions
  ): Promise<{
    applicationId: string;
    status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
    joiningQuestionnaire?: {
      requiredCompletion: boolean;
      requiresCompletion: boolean;
      canAccessMemberContent: boolean;
      enabled: boolean;
      completed: boolean;
      shouldPrompt: boolean;
      version: number;
    };
  }>;
  /** Read a private application as its author or current manager */
  readAPrivateApplicationAsItsAuthorOrCurrentManager(
    input: { path: { groupId: string; applicationId: string } },
    options?: RequestOptions
  ): Promise<{
    _id: string;
    _creationTime: number;
    groupId: string;
    personId: string;
    questions: Array<{
      id: string;
      label: string;
      required: boolean;
      type:
        | 'SHORT_ANSWER'
        | 'LONG_ANSWER'
        | 'MULTIPLE_CHOICE'
        | 'CHECKBOXES'
        | 'NUMBER'
        | 'DROPDOWN'
        | 'YES_NO';
      options?: Array<string>;
    }>;
    answers: Record<string, string | number | boolean | Array<string>>;
    status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
    submittedAt: number;
    updatedAt: number;
    decisions: Array<{
      status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
      actorId?: string;
      at: number;
      reason?: string;
    }>;
  }>;
  /** Edit your pending answers against saved question definitions */
  editYourPendingAnswersAgainstSavedQuestionDefinitions(
    input: {
      path: { groupId: string; applicationId: string };
      body: {
        answers: Record<string, string | number | boolean | Array<string>>;
        expectedRevision?: number;
      };
    },
    options?: RequestOptions
  ): Promise<{
    applicationId: string;
    status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
    joiningQuestionnaire?: {
      requiredCompletion: boolean;
      requiresCompletion: boolean;
      canAccessMemberContent: boolean;
      enabled: boolean;
      completed: boolean;
      shouldPrompt: boolean;
      version: number;
    };
  }>;
  /** Withdraw your pending application without deleting history */
  withdrawYourPendingApplicationWithoutDeletingHistory(
    input: { path: { groupId: string; applicationId: string } },
    options?: RequestOptions
  ): Promise<{
    applicationId: string;
    status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
    joiningQuestionnaire?: {
      requiredCompletion: boolean;
      requiresCompletion: boolean;
      canAccessMemberContent: boolean;
      enabled: boolean;
      completed: boolean;
      shouldPrompt: boolean;
      version: number;
    };
  }>;
  /** Approve or decline an application as current Group manager */
  approveOrDeclineAnApplicationAsCurrentGroupManager(
    input: {
      path: { groupId: string; applicationId: string };
      body: {
        decision: 'APPROVED' | 'DECLINED';
        expectedRevision?: number;
        operationId?: string;
      };
    },
    options?: RequestOptions
  ): Promise<{
    applicationId: string;
    status: 'PENDING' | 'WITHDRAWN' | 'APPROVED' | 'DECLINED';
    joiningQuestionnaire?: {
      requiredCompletion: boolean;
      requiresCompletion: boolean;
      canAccessMemberContent: boolean;
      enabled: boolean;
      completed: boolean;
      shouldPrompt: boolean;
      version: number;
    };
  }>;
  /** Read only viewer-visible Group associations and Organizer Friends setting */
  getEventsAudiences(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<{
    eventId: string;
    friendsShared: boolean | null;
    canManageEvent: boolean;
    groups: Array<{ groupId: string; name: string; canWithdraw: boolean }>;
  }>;
  /** Set independent Friends audience as current Organizer */
  setIndependentFriendsAudienceAsCurrentOrganizer(
    input: { path: { eventId: string }; body: { enabled: boolean } },
    options?: RequestOptions
  ): Promise<{ eventId: string; friendsShared: boolean }>;
  /** Configure whole-Group Event sharing as owner */
  configureWholeGroupEventSharingAsOwner(
    input: {
      path: { groupId: string };
      body: { policy: 'MANAGERS' | 'MEMBERS' };
    },
    options?: RequestOptions
  ): Promise<{ success: true }>;
  /** Share with a whole Group with both permissions */
  shareWithAWholeGroupWithBothPermissions(
    input: { path: { groupId: string; eventId: string } },
    options?: RequestOptions
  ): Promise<{ eventId: string; groupId: string; shared: boolean }>;
  /** Withdraw one Group grant without affecting other audiences */
  withdrawOneGroupGrantWithoutAffectingOtherAudiences(
    input: { path: { groupId: string; eventId: string } },
    options?: RequestOptions
  ): Promise<{ eventId: string; groupId: string; shared: boolean }>;
  /** Withdraw this Group grant as current Group manager; conveys no Event authority */
  deleteGroupsEvents(
    input: { path: { groupId: string; eventId: string } },
    options?: RequestOptions
  ): Promise<{ eventId: string; groupId: string; shared: boolean }>;
  /** Read safe upcoming/undated Group Event previews in bounded association-order pages */
  getGroupsEvents(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      event: {
        _id: string;
        _creationTime: number;
        title: string;
        description: string | null;
        location: string | null;
        creatorId: string;
        timezone: string;
        visibility: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
        admissionPolicy: 'INVITATION_ONLY' | 'DIRECT' | 'APPLY';
        chosenDateTime: number | null;
        chosenEndDateTime: number | null;
        imageUrl: string | null;
        imageFocalPoint?: { x: number; y: number };
        createdAt: number;
        updatedAt: number;
        potentialDateTimeOptions: Array<{
          id: string;
          start: number;
          end: number | null;
          note: string | null;
        }>;
      };
      canWithdraw: boolean;
    }>;
    nextCursor: string | null;
  }>;
  getGroupsEventsItems(
    input: {
      path: { groupId: string };
      query?: { limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    event: {
      _id: string;
      _creationTime: number;
      title: string;
      description: string | null;
      location: string | null;
      creatorId: string;
      timezone: string;
      visibility: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
      admissionPolicy: 'INVITATION_ONLY' | 'DIRECT' | 'APPLY';
      chosenDateTime: number | null;
      chosenEndDateTime: number | null;
      imageUrl: string | null;
      imageFocalPoint?: { x: number; y: number };
      createdAt: number;
      updatedAt: number;
      potentialDateTimeOptions: Array<{
        id: string;
        start: number;
        end: number | null;
        note: string | null;
      }>;
    };
    canWithdraw: boolean;
  }>;
  /** List blocked users (bounded cursor pages) */
  listBlockedUsersBoundedCursorPages(
    input?: {
      query?: { pagination?: 'cursor'; limit?: string; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      personId: string;
      userId: string;
      name: string | null;
      username: string | null;
      image: string | null;
      blockedAt: number;
    }>;
    nextCursor: string | null;
  }>;
  listBlockedUsersBoundedCursorPagesItems(
    input?: {
      query?: { pagination?: 'cursor'; limit?: string; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    personId: string;
    userId: string;
    name: string | null;
    username: string | null;
    image: string | null;
    blockedAt: number;
  }>;
  /** Inspect block relationship */
  inspectBlockRelationship(
    input: { path: { personId: string } },
    options?: RequestOptions
  ): Promise<{ blockedByMe: boolean; blockedByThem: boolean }>;
  /** Block user and remove friendships/requests */
  blockUserAndRemoveFriendshipsRequests(
    input: { path: { personId: string } },
    options?: RequestOptions
  ): Promise<MessageResponse>;
  /** Unblock user */
  unblockUser(
    input: { path: { personId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** List your existing published custom templates */
  listYourExistingPublishedCustomTemplates(
    input?: {
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<
    | Array<{
        id: string;
        addonType: string;
        name: string;
        description: string;
        version: number;
        template: {
          name: string;
          description: string;
          iconName: string;
          settings?: {
            requiresCompletion?: boolean;
            supportsOptOut?: boolean;
            optOutLabel?: string;
            cardLinkLabel?: string;
            cardSubtitle?: string;
            cardOnly?: boolean;
          };
          sections: Array<{
            id: string;
            title: string;
            description?: string;
            layout?: 'form' | 'interactive';
            fields: Array<{
              id: string;
              type:
                | 'text'
                | 'number'
                | 'select'
                | 'multiselect'
                | 'yesno'
                | 'list_item'
                | 'vote'
                | 'toggle'
                | 'action_button'
                | 'static_text'
                | 'dynamic_summary'
                | 'divider'
                | 'info_callout';
              label?: string;
              required: boolean;
              configurable?: boolean;
              variant?: 'short' | 'long';
              placeholder?: string;
              maxLength?: number;
              min?: number;
              max?: number;
              options?: Array<string>;
              minSelections?: number;
              maxSelections?: number;
              items?: Array<{ id: string; name: string; quantity: number }>;
              allowMultiple?: boolean;
              showResults?: boolean;
              content?: string;
              textFormat?: 'p' | 'h1' | 'h2' | 'h3';
              summaryType?:
                | 'response_count'
                | 'vote_leader'
                | 'signup_progress'
                | 'custom_text';
              summaryLabel?: string;
              dividerLabel?: string;
              calloutVariant?: 'info' | 'warning' | 'success';
              calloutMessage?: string;
              buttonLabel?: string;
              buttonVariant?:
                | 'default'
                | 'secondary'
                | 'outline'
                | 'destructive';
              defaultEnabled?: boolean;
              actions?: Array<{
                type:
                  | 'notify_members'
                  | 'notify_organizers'
                  | 'notify_submitter'
                  | 'create_post'
                  | 'update_event_description'
                  | 'set_addon_data'
                  | 'send_webhook';
                webhookUrl?: string;
                webhookHeaders?: Record<string, string>;
                message?: string;
                title?: string;
                key?: string;
                data?:
                  | string
                  | Record<
                      string,
                      string | number | boolean | null | Array<string>
                    >;
                recipientToggleField?: string;
              }>;
              visibilityConditions?: Array<{
                field: string;
                operator:
                  | 'equals'
                  | 'not_equals'
                  | 'contains'
                  | 'not_contains'
                  | 'greater_than'
                  | 'less_than'
                  | 'greater_or_equal'
                  | 'less_or_equal'
                  | 'is_empty'
                  | 'is_not_empty'
                  | 'in_list'
                  | 'not_in_list';
                value?: string | number | boolean | null | Array<string>;
              }>;
            }>;
            configurable?: boolean;
            allowedFieldTypes?: Array<
              | 'text'
              | 'number'
              | 'select'
              | 'multiselect'
              | 'yesno'
              | 'list_item'
              | 'vote'
              | 'toggle'
              | 'action_button'
              | 'static_text'
              | 'dynamic_summary'
              | 'divider'
              | 'info_callout'
            >;
            visibilityConditions?: Array<{
              field: string;
              operator:
                | 'equals'
                | 'not_equals'
                | 'contains'
                | 'not_contains'
                | 'greater_than'
                | 'less_than'
                | 'greater_or_equal'
                | 'less_or_equal'
                | 'is_empty'
                | 'is_not_empty'
                | 'in_list'
                | 'not_in_list';
              value?: string | number | boolean | null | Array<string>;
            }>;
          }>;
          submitButtonLabel?: string;
          onSubmitActions?: Array<{
            type:
              | 'notify_members'
              | 'notify_organizers'
              | 'notify_submitter'
              | 'create_post'
              | 'update_event_description'
              | 'set_addon_data'
              | 'send_webhook';
            webhookUrl?: string;
            webhookHeaders?: Record<string, string>;
            message?: string;
            title?: string;
            key?: string;
            data?:
              | string
              | Record<
                  string,
                  string | number | boolean | null | Array<string>
                >;
            recipientToggleField?: string;
          }>;
          automations?: Array<{
            id: string;
            name: string;
            enabled: boolean;
            trigger: {
              type:
                | 'form_submitted'
                | 'list_item_claimed'
                | 'list_item_full'
                | 'vote_cast'
                | 'vote_threshold'
                | 'toggle_changed'
                | 'all_responses_in'
                | 'member_joined'
                | 'member_left'
                | 'date_chosen'
                | 'addon_enabled';
              fieldId?: string;
              threshold?: number;
            };
            conditions: Array<{
              field: string;
              operator:
                | 'equals'
                | 'not_equals'
                | 'contains'
                | 'not_contains'
                | 'greater_than'
                | 'less_than'
                | 'greater_or_equal'
                | 'less_or_equal'
                | 'is_empty'
                | 'is_not_empty'
                | 'in_list'
                | 'not_in_list';
              value?: string | number | boolean | null | Array<string>;
            }>;
            actions: Array<{
              type:
                | 'notify_members'
                | 'notify_organizers'
                | 'notify_submitter'
                | 'create_post'
                | 'update_event_description'
                | 'set_addon_data'
                | 'send_webhook';
              webhookUrl?: string;
              webhookHeaders?: Record<string, string>;
              message?: string;
              title?: string;
              key?: string;
              data?:
                | string
                | Record<
                    string,
                    string | number | boolean | null | Array<string>
                  >;
              recipientToggleField?: string;
            }>;
          }>;
        };
      }>
    | {
        items: Array<{
          id: string;
          addonType: string;
          name: string;
          description: string;
          version: number;
          template: {
            name: string;
            description: string;
            iconName: string;
            settings?: {
              requiresCompletion?: boolean;
              supportsOptOut?: boolean;
              optOutLabel?: string;
              cardLinkLabel?: string;
              cardSubtitle?: string;
              cardOnly?: boolean;
            };
            sections: Array<{
              id: string;
              title: string;
              description?: string;
              layout?: 'form' | 'interactive';
              fields: Array<{
                id: string;
                type:
                  | 'text'
                  | 'number'
                  | 'select'
                  | 'multiselect'
                  | 'yesno'
                  | 'list_item'
                  | 'vote'
                  | 'toggle'
                  | 'action_button'
                  | 'static_text'
                  | 'dynamic_summary'
                  | 'divider'
                  | 'info_callout';
                label?: string;
                required: boolean;
                configurable?: boolean;
                variant?: 'short' | 'long';
                placeholder?: string;
                maxLength?: number;
                min?: number;
                max?: number;
                options?: Array<string>;
                minSelections?: number;
                maxSelections?: number;
                items?: Array<{ id: string; name: string; quantity: number }>;
                allowMultiple?: boolean;
                showResults?: boolean;
                content?: string;
                textFormat?: 'p' | 'h1' | 'h2' | 'h3';
                summaryType?:
                  | 'response_count'
                  | 'vote_leader'
                  | 'signup_progress'
                  | 'custom_text';
                summaryLabel?: string;
                dividerLabel?: string;
                calloutVariant?: 'info' | 'warning' | 'success';
                calloutMessage?: string;
                buttonLabel?: string;
                buttonVariant?:
                  | 'default'
                  | 'secondary'
                  | 'outline'
                  | 'destructive';
                defaultEnabled?: boolean;
                actions?: Array<{
                  type:
                    | 'notify_members'
                    | 'notify_organizers'
                    | 'notify_submitter'
                    | 'create_post'
                    | 'update_event_description'
                    | 'set_addon_data'
                    | 'send_webhook';
                  webhookUrl?: string;
                  webhookHeaders?: Record<string, string>;
                  message?: string;
                  title?: string;
                  key?: string;
                  data?:
                    | string
                    | Record<
                        string,
                        string | number | boolean | null | Array<string>
                      >;
                  recipientToggleField?: string;
                }>;
                visibilityConditions?: Array<{
                  field: string;
                  operator:
                    | 'equals'
                    | 'not_equals'
                    | 'contains'
                    | 'not_contains'
                    | 'greater_than'
                    | 'less_than'
                    | 'greater_or_equal'
                    | 'less_or_equal'
                    | 'is_empty'
                    | 'is_not_empty'
                    | 'in_list'
                    | 'not_in_list';
                  value?: string | number | boolean | null | Array<string>;
                }>;
              }>;
              configurable?: boolean;
              allowedFieldTypes?: Array<
                | 'text'
                | 'number'
                | 'select'
                | 'multiselect'
                | 'yesno'
                | 'list_item'
                | 'vote'
                | 'toggle'
                | 'action_button'
                | 'static_text'
                | 'dynamic_summary'
                | 'divider'
                | 'info_callout'
              >;
              visibilityConditions?: Array<{
                field: string;
                operator:
                  | 'equals'
                  | 'not_equals'
                  | 'contains'
                  | 'not_contains'
                  | 'greater_than'
                  | 'less_than'
                  | 'greater_or_equal'
                  | 'less_or_equal'
                  | 'is_empty'
                  | 'is_not_empty'
                  | 'in_list'
                  | 'not_in_list';
                value?: string | number | boolean | null | Array<string>;
              }>;
            }>;
            submitButtonLabel?: string;
            onSubmitActions?: Array<{
              type:
                | 'notify_members'
                | 'notify_organizers'
                | 'notify_submitter'
                | 'create_post'
                | 'update_event_description'
                | 'set_addon_data'
                | 'send_webhook';
              webhookUrl?: string;
              webhookHeaders?: Record<string, string>;
              message?: string;
              title?: string;
              key?: string;
              data?:
                | string
                | Record<
                    string,
                    string | number | boolean | null | Array<string>
                  >;
              recipientToggleField?: string;
            }>;
            automations?: Array<{
              id: string;
              name: string;
              enabled: boolean;
              trigger: {
                type:
                  | 'form_submitted'
                  | 'list_item_claimed'
                  | 'list_item_full'
                  | 'vote_cast'
                  | 'vote_threshold'
                  | 'toggle_changed'
                  | 'all_responses_in'
                  | 'member_joined'
                  | 'member_left'
                  | 'date_chosen'
                  | 'addon_enabled';
                fieldId?: string;
                threshold?: number;
              };
              conditions: Array<{
                field: string;
                operator:
                  | 'equals'
                  | 'not_equals'
                  | 'contains'
                  | 'not_contains'
                  | 'greater_than'
                  | 'less_than'
                  | 'greater_or_equal'
                  | 'less_or_equal'
                  | 'is_empty'
                  | 'is_not_empty'
                  | 'in_list'
                  | 'not_in_list';
                value?: string | number | boolean | null | Array<string>;
              }>;
              actions: Array<{
                type:
                  | 'notify_members'
                  | 'notify_organizers'
                  | 'notify_submitter'
                  | 'create_post'
                  | 'update_event_description'
                  | 'set_addon_data'
                  | 'send_webhook';
                webhookUrl?: string;
                webhookHeaders?: Record<string, string>;
                message?: string;
                title?: string;
                key?: string;
                data?:
                  | string
                  | Record<
                      string,
                      string | number | boolean | null | Array<string>
                    >;
                recipientToggleField?: string;
              }>;
            }>;
          };
        }>;
        nextCursor: string | null;
      }
  >;
  listYourExistingPublishedCustomTemplatesItems(
    input?: {
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    id: string;
    addonType: string;
    name: string;
    description: string;
    version: number;
    template: {
      name: string;
      description: string;
      iconName: string;
      settings?: {
        requiresCompletion?: boolean;
        supportsOptOut?: boolean;
        optOutLabel?: string;
        cardLinkLabel?: string;
        cardSubtitle?: string;
        cardOnly?: boolean;
      };
      sections: Array<{
        id: string;
        title: string;
        description?: string;
        layout?: 'form' | 'interactive';
        fields: Array<{
          id: string;
          type:
            | 'text'
            | 'number'
            | 'select'
            | 'multiselect'
            | 'yesno'
            | 'list_item'
            | 'vote'
            | 'toggle'
            | 'action_button'
            | 'static_text'
            | 'dynamic_summary'
            | 'divider'
            | 'info_callout';
          label?: string;
          required: boolean;
          configurable?: boolean;
          variant?: 'short' | 'long';
          placeholder?: string;
          maxLength?: number;
          min?: number;
          max?: number;
          options?: Array<string>;
          minSelections?: number;
          maxSelections?: number;
          items?: Array<{ id: string; name: string; quantity: number }>;
          allowMultiple?: boolean;
          showResults?: boolean;
          content?: string;
          textFormat?: 'p' | 'h1' | 'h2' | 'h3';
          summaryType?:
            | 'response_count'
            | 'vote_leader'
            | 'signup_progress'
            | 'custom_text';
          summaryLabel?: string;
          dividerLabel?: string;
          calloutVariant?: 'info' | 'warning' | 'success';
          calloutMessage?: string;
          buttonLabel?: string;
          buttonVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
          defaultEnabled?: boolean;
          actions?: Array<{
            type:
              | 'notify_members'
              | 'notify_organizers'
              | 'notify_submitter'
              | 'create_post'
              | 'update_event_description'
              | 'set_addon_data'
              | 'send_webhook';
            webhookUrl?: string;
            webhookHeaders?: Record<string, string>;
            message?: string;
            title?: string;
            key?: string;
            data?:
              | string
              | Record<
                  string,
                  string | number | boolean | null | Array<string>
                >;
            recipientToggleField?: string;
          }>;
          visibilityConditions?: Array<{
            field: string;
            operator:
              | 'equals'
              | 'not_equals'
              | 'contains'
              | 'not_contains'
              | 'greater_than'
              | 'less_than'
              | 'greater_or_equal'
              | 'less_or_equal'
              | 'is_empty'
              | 'is_not_empty'
              | 'in_list'
              | 'not_in_list';
            value?: string | number | boolean | null | Array<string>;
          }>;
        }>;
        configurable?: boolean;
        allowedFieldTypes?: Array<
          | 'text'
          | 'number'
          | 'select'
          | 'multiselect'
          | 'yesno'
          | 'list_item'
          | 'vote'
          | 'toggle'
          | 'action_button'
          | 'static_text'
          | 'dynamic_summary'
          | 'divider'
          | 'info_callout'
        >;
        visibilityConditions?: Array<{
          field: string;
          operator:
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'is_empty'
            | 'is_not_empty'
            | 'in_list'
            | 'not_in_list';
          value?: string | number | boolean | null | Array<string>;
        }>;
      }>;
      submitButtonLabel?: string;
      onSubmitActions?: Array<{
        type:
          | 'notify_members'
          | 'notify_organizers'
          | 'notify_submitter'
          | 'create_post'
          | 'update_event_description'
          | 'set_addon_data'
          | 'send_webhook';
        webhookUrl?: string;
        webhookHeaders?: Record<string, string>;
        message?: string;
        title?: string;
        key?: string;
        data?:
          | string
          | Record<string, string | number | boolean | null | Array<string>>;
        recipientToggleField?: string;
      }>;
      automations?: Array<{
        id: string;
        name: string;
        enabled: boolean;
        trigger: {
          type:
            | 'form_submitted'
            | 'list_item_claimed'
            | 'list_item_full'
            | 'vote_cast'
            | 'vote_threshold'
            | 'toggle_changed'
            | 'all_responses_in'
            | 'member_joined'
            | 'member_left'
            | 'date_chosen'
            | 'addon_enabled';
          fieldId?: string;
          threshold?: number;
        };
        conditions: Array<{
          field: string;
          operator:
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'is_empty'
            | 'is_not_empty'
            | 'in_list'
            | 'not_in_list';
          value?: string | number | boolean | null | Array<string>;
        }>;
        actions: Array<{
          type:
            | 'notify_members'
            | 'notify_organizers'
            | 'notify_submitter'
            | 'create_post'
            | 'update_event_description'
            | 'set_addon_data'
            | 'send_webhook';
          webhookUrl?: string;
          webhookHeaders?: Record<string, string>;
          message?: string;
          title?: string;
          key?: string;
          data?:
            | string
            | Record<string, string | number | boolean | null | Array<string>>;
          recipientToggleField?: string;
        }>;
      }>;
    };
  }>;
  /** Perform an app-supported participant action as the current identity */
  postEventsAddonsParticipation(
    input: {
      path: { eventId: string; addonType: string };
      body: {
        action:
          | 'respond'
          | 'claim'
          | 'vote'
          | 'toggle'
          | 'execute'
          | 'opt-in'
          | 'opt-out'
          | 'clear-response'
          | 'clear-claims';
        data?: Record<
          string,
          string | number | boolean | null | Array<string>
        > | null;
        fieldId?: string;
      };
    },
    options?: RequestOptions
  ): Promise<
    | { success: boolean }
    | { isOptedOut: boolean }
    | { id: string; created: boolean }
  >;
  /** List add-ons */
  listAddOns(
    input: {
      path: { eventId: string };
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<
    AddonListResponse | { items: Array<AddonConfig>; nextCursor: string | null }
  >;
  listAddOnsItems(
    input: {
      path: { eventId: string };
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<AddonConfig>;
  /** Enable add-on */
  enableAddOn(
    input: {
      path: { eventId: string; addonType: string };
      body: EnableAddonRequest;
    },
    options?: RequestOptions
  ): Promise<MessageResponse>;
  /** Disable add-on */
  disableAddOn(
    input: { path: { eventId: string; addonType: string } },
    options?: RequestOptions
  ): Promise<MessageResponse>;
  /** Update add-on config */
  updateAddOnConfig(
    input: {
      path: { eventId: string; addonType: string };
      body: UpdateAddonConfigRequest;
    },
    options?: RequestOptions
  ): Promise<AddonConfig>;
  /** List add-on data */
  listAddOnData(
    input: {
      path: { eventId: string; addonType: string };
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): Promise<
    | AddonDataListResponse
    | {
        items: AddonDataListResponse;
        nextCursor: string | null;
        isOptedOut: boolean;
      }
  >;
  listAddOnDataItems(
    input: {
      path: { eventId: string; addonType: string };
      query?: { pagination?: 'cursor'; limit?: number; cursor?: string };
    },
    options?: RequestOptions
  ): AsyncIterable<AddonDataEntry>;
  /** Set add-on data */
  setAddOnData(
    input: {
      path: { eventId: string; addonType: string; key: string };
      body: SetAddonDataRequest;
    },
    options?: RequestOptions
  ): Promise<AddonDataEntry>;
  /** Delete add-on data */
  deleteAddOnData(
    input: { path: { eventId: string; addonType: string; key: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** List owned draft and published definitions */
  listOwnedDraftAndPublishedDefinitions(
    input?: { query?: { limit?: number; cursor?: string } },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      id: string;
      name: string;
      description: string;
      iconName: string;
      template: {
        name: string;
        description: string;
        iconName: string;
        settings?: {
          requiresCompletion?: boolean;
          supportsOptOut?: boolean;
          optOutLabel?: string;
          cardLinkLabel?: string;
          cardSubtitle?: string;
          cardOnly?: boolean;
        };
        sections: Array<{
          id: string;
          title: string;
          description?: string;
          layout?: 'form' | 'interactive';
          fields: Array<{
            id: string;
            type:
              | 'text'
              | 'number'
              | 'select'
              | 'multiselect'
              | 'yesno'
              | 'list_item'
              | 'vote'
              | 'toggle'
              | 'action_button'
              | 'static_text'
              | 'dynamic_summary'
              | 'divider'
              | 'info_callout';
            label?: string;
            required: boolean;
            configurable?: boolean;
            variant?: 'short' | 'long';
            placeholder?: string;
            maxLength?: number;
            min?: number;
            max?: number;
            options?: Array<string>;
            minSelections?: number;
            maxSelections?: number;
            items?: Array<{ id: string; name: string; quantity: number }>;
            allowMultiple?: boolean;
            showResults?: boolean;
            content?: string;
            textFormat?: 'p' | 'h1' | 'h2' | 'h3';
            summaryType?:
              | 'response_count'
              | 'vote_leader'
              | 'signup_progress'
              | 'custom_text';
            summaryLabel?: string;
            dividerLabel?: string;
            calloutVariant?: 'info' | 'warning' | 'success';
            calloutMessage?: string;
            buttonLabel?: string;
            buttonVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
            defaultEnabled?: boolean;
            actions?: Array<{
              type:
                | 'notify_members'
                | 'notify_organizers'
                | 'notify_submitter'
                | 'create_post'
                | 'update_event_description'
                | 'set_addon_data'
                | 'send_webhook';
              webhookUrl?: string;
              webhookHeaders?: Record<string, string>;
              message?: string;
              title?: string;
              key?: string;
              data?:
                | string
                | Record<
                    string,
                    string | number | boolean | null | Array<string>
                  >;
              recipientToggleField?: string;
            }>;
            visibilityConditions?: Array<{
              field: string;
              operator:
                | 'equals'
                | 'not_equals'
                | 'contains'
                | 'not_contains'
                | 'greater_than'
                | 'less_than'
                | 'greater_or_equal'
                | 'less_or_equal'
                | 'is_empty'
                | 'is_not_empty'
                | 'in_list'
                | 'not_in_list';
              value?: string | number | boolean | null | Array<string>;
            }>;
          }>;
          configurable?: boolean;
          allowedFieldTypes?: Array<
            | 'text'
            | 'number'
            | 'select'
            | 'multiselect'
            | 'yesno'
            | 'list_item'
            | 'vote'
            | 'toggle'
            | 'action_button'
            | 'static_text'
            | 'dynamic_summary'
            | 'divider'
            | 'info_callout'
          >;
          visibilityConditions?: Array<{
            field: string;
            operator:
              | 'equals'
              | 'not_equals'
              | 'contains'
              | 'not_contains'
              | 'greater_than'
              | 'less_than'
              | 'greater_or_equal'
              | 'less_or_equal'
              | 'is_empty'
              | 'is_not_empty'
              | 'in_list'
              | 'not_in_list';
            value?: string | number | boolean | null | Array<string>;
          }>;
        }>;
        submitButtonLabel?: string;
        onSubmitActions?: Array<{
          type:
            | 'notify_members'
            | 'notify_organizers'
            | 'notify_submitter'
            | 'create_post'
            | 'update_event_description'
            | 'set_addon_data'
            | 'send_webhook';
          webhookUrl?: string;
          webhookHeaders?: Record<string, string>;
          message?: string;
          title?: string;
          key?: string;
          data?:
            | string
            | Record<string, string | number | boolean | null | Array<string>>;
          recipientToggleField?: string;
        }>;
        automations?: Array<{
          id: string;
          name: string;
          enabled: boolean;
          trigger: {
            type:
              | 'form_submitted'
              | 'list_item_claimed'
              | 'list_item_full'
              | 'vote_cast'
              | 'vote_threshold'
              | 'toggle_changed'
              | 'all_responses_in'
              | 'member_joined'
              | 'member_left'
              | 'date_chosen'
              | 'addon_enabled';
            fieldId?: string;
            threshold?: number;
          };
          conditions: Array<{
            field: string;
            operator:
              | 'equals'
              | 'not_equals'
              | 'contains'
              | 'not_contains'
              | 'greater_than'
              | 'less_than'
              | 'greater_or_equal'
              | 'less_or_equal'
              | 'is_empty'
              | 'is_not_empty'
              | 'in_list'
              | 'not_in_list';
            value?: string | number | boolean | null | Array<string>;
          }>;
          actions: Array<{
            type:
              | 'notify_members'
              | 'notify_organizers'
              | 'notify_submitter'
              | 'create_post'
              | 'update_event_description'
              | 'set_addon_data'
              | 'send_webhook';
            webhookUrl?: string;
            webhookHeaders?: Record<string, string>;
            message?: string;
            title?: string;
            key?: string;
            data?:
              | string
              | Record<
                  string,
                  string | number | boolean | null | Array<string>
                >;
            recipientToggleField?: string;
          }>;
        }>;
      };
      version: number;
      isPublished: boolean;
      createdAt: number;
      updatedAt: number;
    }>;
    nextCursor: string | null;
  }>;
  listOwnedDraftAndPublishedDefinitionsItems(
    input?: { query?: { limit?: number; cursor?: string } },
    options?: RequestOptions
  ): AsyncIterable<{
    id: string;
    name: string;
    description: string;
    iconName: string;
    template: {
      name: string;
      description: string;
      iconName: string;
      settings?: {
        requiresCompletion?: boolean;
        supportsOptOut?: boolean;
        optOutLabel?: string;
        cardLinkLabel?: string;
        cardSubtitle?: string;
        cardOnly?: boolean;
      };
      sections: Array<{
        id: string;
        title: string;
        description?: string;
        layout?: 'form' | 'interactive';
        fields: Array<{
          id: string;
          type:
            | 'text'
            | 'number'
            | 'select'
            | 'multiselect'
            | 'yesno'
            | 'list_item'
            | 'vote'
            | 'toggle'
            | 'action_button'
            | 'static_text'
            | 'dynamic_summary'
            | 'divider'
            | 'info_callout';
          label?: string;
          required: boolean;
          configurable?: boolean;
          variant?: 'short' | 'long';
          placeholder?: string;
          maxLength?: number;
          min?: number;
          max?: number;
          options?: Array<string>;
          minSelections?: number;
          maxSelections?: number;
          items?: Array<{ id: string; name: string; quantity: number }>;
          allowMultiple?: boolean;
          showResults?: boolean;
          content?: string;
          textFormat?: 'p' | 'h1' | 'h2' | 'h3';
          summaryType?:
            | 'response_count'
            | 'vote_leader'
            | 'signup_progress'
            | 'custom_text';
          summaryLabel?: string;
          dividerLabel?: string;
          calloutVariant?: 'info' | 'warning' | 'success';
          calloutMessage?: string;
          buttonLabel?: string;
          buttonVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
          defaultEnabled?: boolean;
          actions?: Array<{
            type:
              | 'notify_members'
              | 'notify_organizers'
              | 'notify_submitter'
              | 'create_post'
              | 'update_event_description'
              | 'set_addon_data'
              | 'send_webhook';
            webhookUrl?: string;
            webhookHeaders?: Record<string, string>;
            message?: string;
            title?: string;
            key?: string;
            data?:
              | string
              | Record<
                  string,
                  string | number | boolean | null | Array<string>
                >;
            recipientToggleField?: string;
          }>;
          visibilityConditions?: Array<{
            field: string;
            operator:
              | 'equals'
              | 'not_equals'
              | 'contains'
              | 'not_contains'
              | 'greater_than'
              | 'less_than'
              | 'greater_or_equal'
              | 'less_or_equal'
              | 'is_empty'
              | 'is_not_empty'
              | 'in_list'
              | 'not_in_list';
            value?: string | number | boolean | null | Array<string>;
          }>;
        }>;
        configurable?: boolean;
        allowedFieldTypes?: Array<
          | 'text'
          | 'number'
          | 'select'
          | 'multiselect'
          | 'yesno'
          | 'list_item'
          | 'vote'
          | 'toggle'
          | 'action_button'
          | 'static_text'
          | 'dynamic_summary'
          | 'divider'
          | 'info_callout'
        >;
        visibilityConditions?: Array<{
          field: string;
          operator:
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'is_empty'
            | 'is_not_empty'
            | 'in_list'
            | 'not_in_list';
          value?: string | number | boolean | null | Array<string>;
        }>;
      }>;
      submitButtonLabel?: string;
      onSubmitActions?: Array<{
        type:
          | 'notify_members'
          | 'notify_organizers'
          | 'notify_submitter'
          | 'create_post'
          | 'update_event_description'
          | 'set_addon_data'
          | 'send_webhook';
        webhookUrl?: string;
        webhookHeaders?: Record<string, string>;
        message?: string;
        title?: string;
        key?: string;
        data?:
          | string
          | Record<string, string | number | boolean | null | Array<string>>;
        recipientToggleField?: string;
      }>;
      automations?: Array<{
        id: string;
        name: string;
        enabled: boolean;
        trigger: {
          type:
            | 'form_submitted'
            | 'list_item_claimed'
            | 'list_item_full'
            | 'vote_cast'
            | 'vote_threshold'
            | 'toggle_changed'
            | 'all_responses_in'
            | 'member_joined'
            | 'member_left'
            | 'date_chosen'
            | 'addon_enabled';
          fieldId?: string;
          threshold?: number;
        };
        conditions: Array<{
          field: string;
          operator:
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'is_empty'
            | 'is_not_empty'
            | 'in_list'
            | 'not_in_list';
          value?: string | number | boolean | null | Array<string>;
        }>;
        actions: Array<{
          type:
            | 'notify_members'
            | 'notify_organizers'
            | 'notify_submitter'
            | 'create_post'
            | 'update_event_description'
            | 'set_addon_data'
            | 'send_webhook';
          webhookUrl?: string;
          webhookHeaders?: Record<string, string>;
          message?: string;
          title?: string;
          key?: string;
          data?:
            | string
            | Record<string, string | number | boolean | null | Array<string>>;
          recipientToggleField?: string;
        }>;
      }>;
    };
    version: number;
    isPublished: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
  /** Create a complete definition as a draft */
  createACompleteDefinitionAsADraft(
    input: {
      body: {
        schemaVersion: 1;
        name: string;
        description: string;
        iconName: string;
        template: {
          name: string;
          description: string;
          iconName: string;
          settings?: {
            requiresCompletion?: boolean;
            supportsOptOut?: boolean;
            optOutLabel?: string;
            cardLinkLabel?: string;
            cardSubtitle?: string;
            cardOnly?: boolean;
          };
          sections: Array<{
            id: string;
            title: string;
            description?: string;
            layout?: 'form' | 'interactive';
            fields: Array<{
              id: string;
              type:
                | 'text'
                | 'number'
                | 'select'
                | 'multiselect'
                | 'yesno'
                | 'list_item'
                | 'vote'
                | 'toggle'
                | 'action_button'
                | 'static_text'
                | 'dynamic_summary'
                | 'divider'
                | 'info_callout';
              label?: string;
              required: boolean;
              configurable?: boolean;
              variant?: 'short' | 'long';
              placeholder?: string;
              maxLength?: number;
              min?: number;
              max?: number;
              options?: Array<string>;
              minSelections?: number;
              maxSelections?: number;
              items?: Array<{ id: string; name: string; quantity: number }>;
              allowMultiple?: boolean;
              showResults?: boolean;
              content?: string;
              textFormat?: 'p' | 'h1' | 'h2' | 'h3';
              summaryType?:
                | 'response_count'
                | 'vote_leader'
                | 'signup_progress'
                | 'custom_text';
              summaryLabel?: string;
              dividerLabel?: string;
              calloutVariant?: 'info' | 'warning' | 'success';
              calloutMessage?: string;
              buttonLabel?: string;
              buttonVariant?:
                | 'default'
                | 'secondary'
                | 'outline'
                | 'destructive';
              defaultEnabled?: boolean;
              actions?: Array<{
                type:
                  | 'notify_members'
                  | 'notify_organizers'
                  | 'notify_submitter'
                  | 'create_post'
                  | 'update_event_description'
                  | 'set_addon_data'
                  | 'send_webhook';
                webhookUrl?: string;
                webhookHeaders?: Record<string, string>;
                message?: string;
                title?: string;
                key?: string;
                data?:
                  | string
                  | Record<
                      string,
                      string | number | boolean | null | Array<string>
                    >;
                recipientToggleField?: string;
              }>;
              visibilityConditions?: Array<{
                field: string;
                operator:
                  | 'equals'
                  | 'not_equals'
                  | 'contains'
                  | 'not_contains'
                  | 'greater_than'
                  | 'less_than'
                  | 'greater_or_equal'
                  | 'less_or_equal'
                  | 'is_empty'
                  | 'is_not_empty'
                  | 'in_list'
                  | 'not_in_list';
                value?: string | number | boolean | null | Array<string>;
              }>;
            }>;
            configurable?: boolean;
            allowedFieldTypes?: Array<
              | 'text'
              | 'number'
              | 'select'
              | 'multiselect'
              | 'yesno'
              | 'list_item'
              | 'vote'
              | 'toggle'
              | 'action_button'
              | 'static_text'
              | 'dynamic_summary'
              | 'divider'
              | 'info_callout'
            >;
            visibilityConditions?: Array<{
              field: string;
              operator:
                | 'equals'
                | 'not_equals'
                | 'contains'
                | 'not_contains'
                | 'greater_than'
                | 'less_than'
                | 'greater_or_equal'
                | 'less_or_equal'
                | 'is_empty'
                | 'is_not_empty'
                | 'in_list'
                | 'not_in_list';
              value?: string | number | boolean | null | Array<string>;
            }>;
          }>;
          submitButtonLabel?: string;
          onSubmitActions?: Array<{
            type:
              | 'notify_members'
              | 'notify_organizers'
              | 'notify_submitter'
              | 'create_post'
              | 'update_event_description'
              | 'set_addon_data'
              | 'send_webhook';
            webhookUrl?: string;
            webhookHeaders?: Record<string, string>;
            message?: string;
            title?: string;
            key?: string;
            data?:
              | string
              | Record<
                  string,
                  string | number | boolean | null | Array<string>
                >;
            recipientToggleField?: string;
          }>;
          automations?: Array<{
            id: string;
            name: string;
            enabled: boolean;
            trigger: {
              type:
                | 'form_submitted'
                | 'list_item_claimed'
                | 'list_item_full'
                | 'vote_cast'
                | 'vote_threshold'
                | 'toggle_changed'
                | 'all_responses_in'
                | 'member_joined'
                | 'member_left'
                | 'date_chosen'
                | 'addon_enabled';
              fieldId?: string;
              threshold?: number;
            };
            conditions: Array<{
              field: string;
              operator:
                | 'equals'
                | 'not_equals'
                | 'contains'
                | 'not_contains'
                | 'greater_than'
                | 'less_than'
                | 'greater_or_equal'
                | 'less_or_equal'
                | 'is_empty'
                | 'is_not_empty'
                | 'in_list'
                | 'not_in_list';
              value?: string | number | boolean | null | Array<string>;
            }>;
            actions: Array<{
              type:
                | 'notify_members'
                | 'notify_organizers'
                | 'notify_submitter'
                | 'create_post'
                | 'update_event_description'
                | 'set_addon_data'
                | 'send_webhook';
              webhookUrl?: string;
              webhookHeaders?: Record<string, string>;
              message?: string;
              title?: string;
              key?: string;
              data?:
                | string
                | Record<
                    string,
                    string | number | boolean | null | Array<string>
                  >;
              recipientToggleField?: string;
            }>;
          }>;
        };
      };
    },
    options?: RequestOptions
  ): Promise<{
    id: string;
    name: string;
    description: string;
    iconName: string;
    template: {
      name: string;
      description: string;
      iconName: string;
      settings?: {
        requiresCompletion?: boolean;
        supportsOptOut?: boolean;
        optOutLabel?: string;
        cardLinkLabel?: string;
        cardSubtitle?: string;
        cardOnly?: boolean;
      };
      sections: Array<{
        id: string;
        title: string;
        description?: string;
        layout?: 'form' | 'interactive';
        fields: Array<{
          id: string;
          type:
            | 'text'
            | 'number'
            | 'select'
            | 'multiselect'
            | 'yesno'
            | 'list_item'
            | 'vote'
            | 'toggle'
            | 'action_button'
            | 'static_text'
            | 'dynamic_summary'
            | 'divider'
            | 'info_callout';
          label?: string;
          required: boolean;
          configurable?: boolean;
          variant?: 'short' | 'long';
          placeholder?: string;
          maxLength?: number;
          min?: number;
          max?: number;
          options?: Array<string>;
          minSelections?: number;
          maxSelections?: number;
          items?: Array<{ id: string; name: string; quantity: number }>;
          allowMultiple?: boolean;
          showResults?: boolean;
          content?: string;
          textFormat?: 'p' | 'h1' | 'h2' | 'h3';
          summaryType?:
            | 'response_count'
            | 'vote_leader'
            | 'signup_progress'
            | 'custom_text';
          summaryLabel?: string;
          dividerLabel?: string;
          calloutVariant?: 'info' | 'warning' | 'success';
          calloutMessage?: string;
          buttonLabel?: string;
          buttonVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
          defaultEnabled?: boolean;
          actions?: Array<{
            type:
              | 'notify_members'
              | 'notify_organizers'
              | 'notify_submitter'
              | 'create_post'
              | 'update_event_description'
              | 'set_addon_data'
              | 'send_webhook';
            webhookUrl?: string;
            webhookHeaders?: Record<string, string>;
            message?: string;
            title?: string;
            key?: string;
            data?:
              | string
              | Record<
                  string,
                  string | number | boolean | null | Array<string>
                >;
            recipientToggleField?: string;
          }>;
          visibilityConditions?: Array<{
            field: string;
            operator:
              | 'equals'
              | 'not_equals'
              | 'contains'
              | 'not_contains'
              | 'greater_than'
              | 'less_than'
              | 'greater_or_equal'
              | 'less_or_equal'
              | 'is_empty'
              | 'is_not_empty'
              | 'in_list'
              | 'not_in_list';
            value?: string | number | boolean | null | Array<string>;
          }>;
        }>;
        configurable?: boolean;
        allowedFieldTypes?: Array<
          | 'text'
          | 'number'
          | 'select'
          | 'multiselect'
          | 'yesno'
          | 'list_item'
          | 'vote'
          | 'toggle'
          | 'action_button'
          | 'static_text'
          | 'dynamic_summary'
          | 'divider'
          | 'info_callout'
        >;
        visibilityConditions?: Array<{
          field: string;
          operator:
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'is_empty'
            | 'is_not_empty'
            | 'in_list'
            | 'not_in_list';
          value?: string | number | boolean | null | Array<string>;
        }>;
      }>;
      submitButtonLabel?: string;
      onSubmitActions?: Array<{
        type:
          | 'notify_members'
          | 'notify_organizers'
          | 'notify_submitter'
          | 'create_post'
          | 'update_event_description'
          | 'set_addon_data'
          | 'send_webhook';
        webhookUrl?: string;
        webhookHeaders?: Record<string, string>;
        message?: string;
        title?: string;
        key?: string;
        data?:
          | string
          | Record<string, string | number | boolean | null | Array<string>>;
        recipientToggleField?: string;
      }>;
      automations?: Array<{
        id: string;
        name: string;
        enabled: boolean;
        trigger: {
          type:
            | 'form_submitted'
            | 'list_item_claimed'
            | 'list_item_full'
            | 'vote_cast'
            | 'vote_threshold'
            | 'toggle_changed'
            | 'all_responses_in'
            | 'member_joined'
            | 'member_left'
            | 'date_chosen'
            | 'addon_enabled';
          fieldId?: string;
          threshold?: number;
        };
        conditions: Array<{
          field: string;
          operator:
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'is_empty'
            | 'is_not_empty'
            | 'in_list'
            | 'not_in_list';
          value?: string | number | boolean | null | Array<string>;
        }>;
        actions: Array<{
          type:
            | 'notify_members'
            | 'notify_organizers'
            | 'notify_submitter'
            | 'create_post'
            | 'update_event_description'
            | 'set_addon_data'
            | 'send_webhook';
          webhookUrl?: string;
          webhookHeaders?: Record<string, string>;
          message?: string;
          title?: string;
          key?: string;
          data?:
            | string
            | Record<string, string | number | boolean | null | Array<string>>;
          recipientToggleField?: string;
        }>;
      }>;
    };
    version: number;
    isPublished: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
  /** Read an owned definition */
  readAnOwnedDefinition(
    input: { path: { id: string } },
    options?: RequestOptions
  ): Promise<{
    id: string;
    name: string;
    description: string;
    iconName: string;
    template: {
      name: string;
      description: string;
      iconName: string;
      settings?: {
        requiresCompletion?: boolean;
        supportsOptOut?: boolean;
        optOutLabel?: string;
        cardLinkLabel?: string;
        cardSubtitle?: string;
        cardOnly?: boolean;
      };
      sections: Array<{
        id: string;
        title: string;
        description?: string;
        layout?: 'form' | 'interactive';
        fields: Array<{
          id: string;
          type:
            | 'text'
            | 'number'
            | 'select'
            | 'multiselect'
            | 'yesno'
            | 'list_item'
            | 'vote'
            | 'toggle'
            | 'action_button'
            | 'static_text'
            | 'dynamic_summary'
            | 'divider'
            | 'info_callout';
          label?: string;
          required: boolean;
          configurable?: boolean;
          variant?: 'short' | 'long';
          placeholder?: string;
          maxLength?: number;
          min?: number;
          max?: number;
          options?: Array<string>;
          minSelections?: number;
          maxSelections?: number;
          items?: Array<{ id: string; name: string; quantity: number }>;
          allowMultiple?: boolean;
          showResults?: boolean;
          content?: string;
          textFormat?: 'p' | 'h1' | 'h2' | 'h3';
          summaryType?:
            | 'response_count'
            | 'vote_leader'
            | 'signup_progress'
            | 'custom_text';
          summaryLabel?: string;
          dividerLabel?: string;
          calloutVariant?: 'info' | 'warning' | 'success';
          calloutMessage?: string;
          buttonLabel?: string;
          buttonVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
          defaultEnabled?: boolean;
          actions?: Array<{
            type:
              | 'notify_members'
              | 'notify_organizers'
              | 'notify_submitter'
              | 'create_post'
              | 'update_event_description'
              | 'set_addon_data'
              | 'send_webhook';
            webhookUrl?: string;
            webhookHeaders?: Record<string, string>;
            message?: string;
            title?: string;
            key?: string;
            data?:
              | string
              | Record<
                  string,
                  string | number | boolean | null | Array<string>
                >;
            recipientToggleField?: string;
          }>;
          visibilityConditions?: Array<{
            field: string;
            operator:
              | 'equals'
              | 'not_equals'
              | 'contains'
              | 'not_contains'
              | 'greater_than'
              | 'less_than'
              | 'greater_or_equal'
              | 'less_or_equal'
              | 'is_empty'
              | 'is_not_empty'
              | 'in_list'
              | 'not_in_list';
            value?: string | number | boolean | null | Array<string>;
          }>;
        }>;
        configurable?: boolean;
        allowedFieldTypes?: Array<
          | 'text'
          | 'number'
          | 'select'
          | 'multiselect'
          | 'yesno'
          | 'list_item'
          | 'vote'
          | 'toggle'
          | 'action_button'
          | 'static_text'
          | 'dynamic_summary'
          | 'divider'
          | 'info_callout'
        >;
        visibilityConditions?: Array<{
          field: string;
          operator:
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'is_empty'
            | 'is_not_empty'
            | 'in_list'
            | 'not_in_list';
          value?: string | number | boolean | null | Array<string>;
        }>;
      }>;
      submitButtonLabel?: string;
      onSubmitActions?: Array<{
        type:
          | 'notify_members'
          | 'notify_organizers'
          | 'notify_submitter'
          | 'create_post'
          | 'update_event_description'
          | 'set_addon_data'
          | 'send_webhook';
        webhookUrl?: string;
        webhookHeaders?: Record<string, string>;
        message?: string;
        title?: string;
        key?: string;
        data?:
          | string
          | Record<string, string | number | boolean | null | Array<string>>;
        recipientToggleField?: string;
      }>;
      automations?: Array<{
        id: string;
        name: string;
        enabled: boolean;
        trigger: {
          type:
            | 'form_submitted'
            | 'list_item_claimed'
            | 'list_item_full'
            | 'vote_cast'
            | 'vote_threshold'
            | 'toggle_changed'
            | 'all_responses_in'
            | 'member_joined'
            | 'member_left'
            | 'date_chosen'
            | 'addon_enabled';
          fieldId?: string;
          threshold?: number;
        };
        conditions: Array<{
          field: string;
          operator:
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'is_empty'
            | 'is_not_empty'
            | 'in_list'
            | 'not_in_list';
          value?: string | number | boolean | null | Array<string>;
        }>;
        actions: Array<{
          type:
            | 'notify_members'
            | 'notify_organizers'
            | 'notify_submitter'
            | 'create_post'
            | 'update_event_description'
            | 'set_addon_data'
            | 'send_webhook';
          webhookUrl?: string;
          webhookHeaders?: Record<string, string>;
          message?: string;
          title?: string;
          key?: string;
          data?:
            | string
            | Record<string, string | number | boolean | null | Array<string>>;
          recipientToggleField?: string;
        }>;
      }>;
    };
    version: number;
    isPublished: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
  /** Replace an owned definition at the expected version */
  replaceAnOwnedDefinitionAtTheExpectedVersion(
    input: {
      path: { id: string };
      body: {
        schemaVersion: 1;
        name: string;
        description: string;
        iconName: string;
        template: {
          name: string;
          description: string;
          iconName: string;
          settings?: {
            requiresCompletion?: boolean;
            supportsOptOut?: boolean;
            optOutLabel?: string;
            cardLinkLabel?: string;
            cardSubtitle?: string;
            cardOnly?: boolean;
          };
          sections: Array<{
            id: string;
            title: string;
            description?: string;
            layout?: 'form' | 'interactive';
            fields: Array<{
              id: string;
              type:
                | 'text'
                | 'number'
                | 'select'
                | 'multiselect'
                | 'yesno'
                | 'list_item'
                | 'vote'
                | 'toggle'
                | 'action_button'
                | 'static_text'
                | 'dynamic_summary'
                | 'divider'
                | 'info_callout';
              label?: string;
              required: boolean;
              configurable?: boolean;
              variant?: 'short' | 'long';
              placeholder?: string;
              maxLength?: number;
              min?: number;
              max?: number;
              options?: Array<string>;
              minSelections?: number;
              maxSelections?: number;
              items?: Array<{ id: string; name: string; quantity: number }>;
              allowMultiple?: boolean;
              showResults?: boolean;
              content?: string;
              textFormat?: 'p' | 'h1' | 'h2' | 'h3';
              summaryType?:
                | 'response_count'
                | 'vote_leader'
                | 'signup_progress'
                | 'custom_text';
              summaryLabel?: string;
              dividerLabel?: string;
              calloutVariant?: 'info' | 'warning' | 'success';
              calloutMessage?: string;
              buttonLabel?: string;
              buttonVariant?:
                | 'default'
                | 'secondary'
                | 'outline'
                | 'destructive';
              defaultEnabled?: boolean;
              actions?: Array<{
                type:
                  | 'notify_members'
                  | 'notify_organizers'
                  | 'notify_submitter'
                  | 'create_post'
                  | 'update_event_description'
                  | 'set_addon_data'
                  | 'send_webhook';
                webhookUrl?: string;
                webhookHeaders?: Record<string, string>;
                message?: string;
                title?: string;
                key?: string;
                data?:
                  | string
                  | Record<
                      string,
                      string | number | boolean | null | Array<string>
                    >;
                recipientToggleField?: string;
              }>;
              visibilityConditions?: Array<{
                field: string;
                operator:
                  | 'equals'
                  | 'not_equals'
                  | 'contains'
                  | 'not_contains'
                  | 'greater_than'
                  | 'less_than'
                  | 'greater_or_equal'
                  | 'less_or_equal'
                  | 'is_empty'
                  | 'is_not_empty'
                  | 'in_list'
                  | 'not_in_list';
                value?: string | number | boolean | null | Array<string>;
              }>;
            }>;
            configurable?: boolean;
            allowedFieldTypes?: Array<
              | 'text'
              | 'number'
              | 'select'
              | 'multiselect'
              | 'yesno'
              | 'list_item'
              | 'vote'
              | 'toggle'
              | 'action_button'
              | 'static_text'
              | 'dynamic_summary'
              | 'divider'
              | 'info_callout'
            >;
            visibilityConditions?: Array<{
              field: string;
              operator:
                | 'equals'
                | 'not_equals'
                | 'contains'
                | 'not_contains'
                | 'greater_than'
                | 'less_than'
                | 'greater_or_equal'
                | 'less_or_equal'
                | 'is_empty'
                | 'is_not_empty'
                | 'in_list'
                | 'not_in_list';
              value?: string | number | boolean | null | Array<string>;
            }>;
          }>;
          submitButtonLabel?: string;
          onSubmitActions?: Array<{
            type:
              | 'notify_members'
              | 'notify_organizers'
              | 'notify_submitter'
              | 'create_post'
              | 'update_event_description'
              | 'set_addon_data'
              | 'send_webhook';
            webhookUrl?: string;
            webhookHeaders?: Record<string, string>;
            message?: string;
            title?: string;
            key?: string;
            data?:
              | string
              | Record<
                  string,
                  string | number | boolean | null | Array<string>
                >;
            recipientToggleField?: string;
          }>;
          automations?: Array<{
            id: string;
            name: string;
            enabled: boolean;
            trigger: {
              type:
                | 'form_submitted'
                | 'list_item_claimed'
                | 'list_item_full'
                | 'vote_cast'
                | 'vote_threshold'
                | 'toggle_changed'
                | 'all_responses_in'
                | 'member_joined'
                | 'member_left'
                | 'date_chosen'
                | 'addon_enabled';
              fieldId?: string;
              threshold?: number;
            };
            conditions: Array<{
              field: string;
              operator:
                | 'equals'
                | 'not_equals'
                | 'contains'
                | 'not_contains'
                | 'greater_than'
                | 'less_than'
                | 'greater_or_equal'
                | 'less_or_equal'
                | 'is_empty'
                | 'is_not_empty'
                | 'in_list'
                | 'not_in_list';
              value?: string | number | boolean | null | Array<string>;
            }>;
            actions: Array<{
              type:
                | 'notify_members'
                | 'notify_organizers'
                | 'notify_submitter'
                | 'create_post'
                | 'update_event_description'
                | 'set_addon_data'
                | 'send_webhook';
              webhookUrl?: string;
              webhookHeaders?: Record<string, string>;
              message?: string;
              title?: string;
              key?: string;
              data?:
                | string
                | Record<
                    string,
                    string | number | boolean | null | Array<string>
                  >;
              recipientToggleField?: string;
            }>;
          }>;
        };
        expectedVersion: number;
      };
    },
    options?: RequestOptions
  ): Promise<{
    id: string;
    name: string;
    description: string;
    iconName: string;
    template: {
      name: string;
      description: string;
      iconName: string;
      settings?: {
        requiresCompletion?: boolean;
        supportsOptOut?: boolean;
        optOutLabel?: string;
        cardLinkLabel?: string;
        cardSubtitle?: string;
        cardOnly?: boolean;
      };
      sections: Array<{
        id: string;
        title: string;
        description?: string;
        layout?: 'form' | 'interactive';
        fields: Array<{
          id: string;
          type:
            | 'text'
            | 'number'
            | 'select'
            | 'multiselect'
            | 'yesno'
            | 'list_item'
            | 'vote'
            | 'toggle'
            | 'action_button'
            | 'static_text'
            | 'dynamic_summary'
            | 'divider'
            | 'info_callout';
          label?: string;
          required: boolean;
          configurable?: boolean;
          variant?: 'short' | 'long';
          placeholder?: string;
          maxLength?: number;
          min?: number;
          max?: number;
          options?: Array<string>;
          minSelections?: number;
          maxSelections?: number;
          items?: Array<{ id: string; name: string; quantity: number }>;
          allowMultiple?: boolean;
          showResults?: boolean;
          content?: string;
          textFormat?: 'p' | 'h1' | 'h2' | 'h3';
          summaryType?:
            | 'response_count'
            | 'vote_leader'
            | 'signup_progress'
            | 'custom_text';
          summaryLabel?: string;
          dividerLabel?: string;
          calloutVariant?: 'info' | 'warning' | 'success';
          calloutMessage?: string;
          buttonLabel?: string;
          buttonVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
          defaultEnabled?: boolean;
          actions?: Array<{
            type:
              | 'notify_members'
              | 'notify_organizers'
              | 'notify_submitter'
              | 'create_post'
              | 'update_event_description'
              | 'set_addon_data'
              | 'send_webhook';
            webhookUrl?: string;
            webhookHeaders?: Record<string, string>;
            message?: string;
            title?: string;
            key?: string;
            data?:
              | string
              | Record<
                  string,
                  string | number | boolean | null | Array<string>
                >;
            recipientToggleField?: string;
          }>;
          visibilityConditions?: Array<{
            field: string;
            operator:
              | 'equals'
              | 'not_equals'
              | 'contains'
              | 'not_contains'
              | 'greater_than'
              | 'less_than'
              | 'greater_or_equal'
              | 'less_or_equal'
              | 'is_empty'
              | 'is_not_empty'
              | 'in_list'
              | 'not_in_list';
            value?: string | number | boolean | null | Array<string>;
          }>;
        }>;
        configurable?: boolean;
        allowedFieldTypes?: Array<
          | 'text'
          | 'number'
          | 'select'
          | 'multiselect'
          | 'yesno'
          | 'list_item'
          | 'vote'
          | 'toggle'
          | 'action_button'
          | 'static_text'
          | 'dynamic_summary'
          | 'divider'
          | 'info_callout'
        >;
        visibilityConditions?: Array<{
          field: string;
          operator:
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'is_empty'
            | 'is_not_empty'
            | 'in_list'
            | 'not_in_list';
          value?: string | number | boolean | null | Array<string>;
        }>;
      }>;
      submitButtonLabel?: string;
      onSubmitActions?: Array<{
        type:
          | 'notify_members'
          | 'notify_organizers'
          | 'notify_submitter'
          | 'create_post'
          | 'update_event_description'
          | 'set_addon_data'
          | 'send_webhook';
        webhookUrl?: string;
        webhookHeaders?: Record<string, string>;
        message?: string;
        title?: string;
        key?: string;
        data?:
          | string
          | Record<string, string | number | boolean | null | Array<string>>;
        recipientToggleField?: string;
      }>;
      automations?: Array<{
        id: string;
        name: string;
        enabled: boolean;
        trigger: {
          type:
            | 'form_submitted'
            | 'list_item_claimed'
            | 'list_item_full'
            | 'vote_cast'
            | 'vote_threshold'
            | 'toggle_changed'
            | 'all_responses_in'
            | 'member_joined'
            | 'member_left'
            | 'date_chosen'
            | 'addon_enabled';
          fieldId?: string;
          threshold?: number;
        };
        conditions: Array<{
          field: string;
          operator:
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'is_empty'
            | 'is_not_empty'
            | 'in_list'
            | 'not_in_list';
          value?: string | number | boolean | null | Array<string>;
        }>;
        actions: Array<{
          type:
            | 'notify_members'
            | 'notify_organizers'
            | 'notify_submitter'
            | 'create_post'
            | 'update_event_description'
            | 'set_addon_data'
            | 'send_webhook';
          webhookUrl?: string;
          webhookHeaders?: Record<string, string>;
          message?: string;
          title?: string;
          key?: string;
          data?:
            | string
            | Record<string, string | number | boolean | null | Array<string>>;
          recipientToggleField?: string;
        }>;
      }>;
    };
    version: number;
    isPublished: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
  /** Delete an owned definition without changing enabled event snapshots */
  deleteAddonTemplateDefinitions(
    input: { path: { id: string }; query: { expectedVersion: number } },
    options?: RequestOptions
  ): Promise<{ id: string; deleted: true }>;
  /** publish an owned definition */
  publishAnOwnedDefinition(
    input: { path: { id: string }; body: { expectedVersion: number } },
    options?: RequestOptions
  ): Promise<{
    id: string;
    name: string;
    description: string;
    iconName: string;
    template: {
      name: string;
      description: string;
      iconName: string;
      settings?: {
        requiresCompletion?: boolean;
        supportsOptOut?: boolean;
        optOutLabel?: string;
        cardLinkLabel?: string;
        cardSubtitle?: string;
        cardOnly?: boolean;
      };
      sections: Array<{
        id: string;
        title: string;
        description?: string;
        layout?: 'form' | 'interactive';
        fields: Array<{
          id: string;
          type:
            | 'text'
            | 'number'
            | 'select'
            | 'multiselect'
            | 'yesno'
            | 'list_item'
            | 'vote'
            | 'toggle'
            | 'action_button'
            | 'static_text'
            | 'dynamic_summary'
            | 'divider'
            | 'info_callout';
          label?: string;
          required: boolean;
          configurable?: boolean;
          variant?: 'short' | 'long';
          placeholder?: string;
          maxLength?: number;
          min?: number;
          max?: number;
          options?: Array<string>;
          minSelections?: number;
          maxSelections?: number;
          items?: Array<{ id: string; name: string; quantity: number }>;
          allowMultiple?: boolean;
          showResults?: boolean;
          content?: string;
          textFormat?: 'p' | 'h1' | 'h2' | 'h3';
          summaryType?:
            | 'response_count'
            | 'vote_leader'
            | 'signup_progress'
            | 'custom_text';
          summaryLabel?: string;
          dividerLabel?: string;
          calloutVariant?: 'info' | 'warning' | 'success';
          calloutMessage?: string;
          buttonLabel?: string;
          buttonVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
          defaultEnabled?: boolean;
          actions?: Array<{
            type:
              | 'notify_members'
              | 'notify_organizers'
              | 'notify_submitter'
              | 'create_post'
              | 'update_event_description'
              | 'set_addon_data'
              | 'send_webhook';
            webhookUrl?: string;
            webhookHeaders?: Record<string, string>;
            message?: string;
            title?: string;
            key?: string;
            data?:
              | string
              | Record<
                  string,
                  string | number | boolean | null | Array<string>
                >;
            recipientToggleField?: string;
          }>;
          visibilityConditions?: Array<{
            field: string;
            operator:
              | 'equals'
              | 'not_equals'
              | 'contains'
              | 'not_contains'
              | 'greater_than'
              | 'less_than'
              | 'greater_or_equal'
              | 'less_or_equal'
              | 'is_empty'
              | 'is_not_empty'
              | 'in_list'
              | 'not_in_list';
            value?: string | number | boolean | null | Array<string>;
          }>;
        }>;
        configurable?: boolean;
        allowedFieldTypes?: Array<
          | 'text'
          | 'number'
          | 'select'
          | 'multiselect'
          | 'yesno'
          | 'list_item'
          | 'vote'
          | 'toggle'
          | 'action_button'
          | 'static_text'
          | 'dynamic_summary'
          | 'divider'
          | 'info_callout'
        >;
        visibilityConditions?: Array<{
          field: string;
          operator:
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'is_empty'
            | 'is_not_empty'
            | 'in_list'
            | 'not_in_list';
          value?: string | number | boolean | null | Array<string>;
        }>;
      }>;
      submitButtonLabel?: string;
      onSubmitActions?: Array<{
        type:
          | 'notify_members'
          | 'notify_organizers'
          | 'notify_submitter'
          | 'create_post'
          | 'update_event_description'
          | 'set_addon_data'
          | 'send_webhook';
        webhookUrl?: string;
        webhookHeaders?: Record<string, string>;
        message?: string;
        title?: string;
        key?: string;
        data?:
          | string
          | Record<string, string | number | boolean | null | Array<string>>;
        recipientToggleField?: string;
      }>;
      automations?: Array<{
        id: string;
        name: string;
        enabled: boolean;
        trigger: {
          type:
            | 'form_submitted'
            | 'list_item_claimed'
            | 'list_item_full'
            | 'vote_cast'
            | 'vote_threshold'
            | 'toggle_changed'
            | 'all_responses_in'
            | 'member_joined'
            | 'member_left'
            | 'date_chosen'
            | 'addon_enabled';
          fieldId?: string;
          threshold?: number;
        };
        conditions: Array<{
          field: string;
          operator:
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'is_empty'
            | 'is_not_empty'
            | 'in_list'
            | 'not_in_list';
          value?: string | number | boolean | null | Array<string>;
        }>;
        actions: Array<{
          type:
            | 'notify_members'
            | 'notify_organizers'
            | 'notify_submitter'
            | 'create_post'
            | 'update_event_description'
            | 'set_addon_data'
            | 'send_webhook';
          webhookUrl?: string;
          webhookHeaders?: Record<string, string>;
          message?: string;
          title?: string;
          key?: string;
          data?:
            | string
            | Record<string, string | number | boolean | null | Array<string>>;
          recipientToggleField?: string;
        }>;
      }>;
    };
    version: number;
    isPublished: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
  /** unpublish an owned definition */
  unpublishAnOwnedDefinition(
    input: { path: { id: string }; body: { expectedVersion: number } },
    options?: RequestOptions
  ): Promise<{
    id: string;
    name: string;
    description: string;
    iconName: string;
    template: {
      name: string;
      description: string;
      iconName: string;
      settings?: {
        requiresCompletion?: boolean;
        supportsOptOut?: boolean;
        optOutLabel?: string;
        cardLinkLabel?: string;
        cardSubtitle?: string;
        cardOnly?: boolean;
      };
      sections: Array<{
        id: string;
        title: string;
        description?: string;
        layout?: 'form' | 'interactive';
        fields: Array<{
          id: string;
          type:
            | 'text'
            | 'number'
            | 'select'
            | 'multiselect'
            | 'yesno'
            | 'list_item'
            | 'vote'
            | 'toggle'
            | 'action_button'
            | 'static_text'
            | 'dynamic_summary'
            | 'divider'
            | 'info_callout';
          label?: string;
          required: boolean;
          configurable?: boolean;
          variant?: 'short' | 'long';
          placeholder?: string;
          maxLength?: number;
          min?: number;
          max?: number;
          options?: Array<string>;
          minSelections?: number;
          maxSelections?: number;
          items?: Array<{ id: string; name: string; quantity: number }>;
          allowMultiple?: boolean;
          showResults?: boolean;
          content?: string;
          textFormat?: 'p' | 'h1' | 'h2' | 'h3';
          summaryType?:
            | 'response_count'
            | 'vote_leader'
            | 'signup_progress'
            | 'custom_text';
          summaryLabel?: string;
          dividerLabel?: string;
          calloutVariant?: 'info' | 'warning' | 'success';
          calloutMessage?: string;
          buttonLabel?: string;
          buttonVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
          defaultEnabled?: boolean;
          actions?: Array<{
            type:
              | 'notify_members'
              | 'notify_organizers'
              | 'notify_submitter'
              | 'create_post'
              | 'update_event_description'
              | 'set_addon_data'
              | 'send_webhook';
            webhookUrl?: string;
            webhookHeaders?: Record<string, string>;
            message?: string;
            title?: string;
            key?: string;
            data?:
              | string
              | Record<
                  string,
                  string | number | boolean | null | Array<string>
                >;
            recipientToggleField?: string;
          }>;
          visibilityConditions?: Array<{
            field: string;
            operator:
              | 'equals'
              | 'not_equals'
              | 'contains'
              | 'not_contains'
              | 'greater_than'
              | 'less_than'
              | 'greater_or_equal'
              | 'less_or_equal'
              | 'is_empty'
              | 'is_not_empty'
              | 'in_list'
              | 'not_in_list';
            value?: string | number | boolean | null | Array<string>;
          }>;
        }>;
        configurable?: boolean;
        allowedFieldTypes?: Array<
          | 'text'
          | 'number'
          | 'select'
          | 'multiselect'
          | 'yesno'
          | 'list_item'
          | 'vote'
          | 'toggle'
          | 'action_button'
          | 'static_text'
          | 'dynamic_summary'
          | 'divider'
          | 'info_callout'
        >;
        visibilityConditions?: Array<{
          field: string;
          operator:
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'is_empty'
            | 'is_not_empty'
            | 'in_list'
            | 'not_in_list';
          value?: string | number | boolean | null | Array<string>;
        }>;
      }>;
      submitButtonLabel?: string;
      onSubmitActions?: Array<{
        type:
          | 'notify_members'
          | 'notify_organizers'
          | 'notify_submitter'
          | 'create_post'
          | 'update_event_description'
          | 'set_addon_data'
          | 'send_webhook';
        webhookUrl?: string;
        webhookHeaders?: Record<string, string>;
        message?: string;
        title?: string;
        key?: string;
        data?:
          | string
          | Record<string, string | number | boolean | null | Array<string>>;
        recipientToggleField?: string;
      }>;
      automations?: Array<{
        id: string;
        name: string;
        enabled: boolean;
        trigger: {
          type:
            | 'form_submitted'
            | 'list_item_claimed'
            | 'list_item_full'
            | 'vote_cast'
            | 'vote_threshold'
            | 'toggle_changed'
            | 'all_responses_in'
            | 'member_joined'
            | 'member_left'
            | 'date_chosen'
            | 'addon_enabled';
          fieldId?: string;
          threshold?: number;
        };
        conditions: Array<{
          field: string;
          operator:
            | 'equals'
            | 'not_equals'
            | 'contains'
            | 'not_contains'
            | 'greater_than'
            | 'less_than'
            | 'greater_or_equal'
            | 'less_or_equal'
            | 'is_empty'
            | 'is_not_empty'
            | 'in_list'
            | 'not_in_list';
          value?: string | number | boolean | null | Array<string>;
        }>;
        actions: Array<{
          type:
            | 'notify_members'
            | 'notify_organizers'
            | 'notify_submitter'
            | 'create_post'
            | 'update_event_description'
            | 'set_addon_data'
            | 'send_webhook';
          webhookUrl?: string;
          webhookHeaders?: Record<string, string>;
          message?: string;
          title?: string;
          key?: string;
          data?:
            | string
            | Record<string, string | number | boolean | null | Array<string>>;
          recipientToggleField?: string;
        }>;
      }>;
    };
    version: number;
    isPublished: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
  /** List cached authorized Discord guilds for this identity */
  listCachedAuthorizedDiscordGuildsForThisIdentity(
    input?: { query?: { limit?: number; cursor?: string } },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      id: string;
      name: string;
      status: 'available' | 'invitable';
      authorizedAt: number;
      expiresAt: number;
    }>;
    nextCursor: string | null;
  }>;
  listCachedAuthorizedDiscordGuildsForThisIdentityItems(
    input?: { query?: { limit?: number; cursor?: string } },
    options?: RequestOptions
  ): AsyncIterable<{
    id: string;
    name: string;
    status: 'available' | 'invitable';
    authorizedAt: number;
    expiresAt: number;
  }>;
  /** Refresh this identity’s Discord guild authorization cache */
  refreshThisIdentitySDiscordGuildAuthorizationCache(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<{ count: number; authorizedAt: number; expiresAt: number }>;
  /** List notifications */
  listNotifications(
    input?: {
      query?: {
        unread?: 'true' | 'false';
        pagination?: 'cursor';
        limit?: string;
        cursor?: string;
      };
    },
    options?: RequestOptions
  ): Promise<
    | NotificationListResponse
    | { items: Array<Notification>; nextCursor: string | null }
  >;
  listNotificationsItems(
    input?: {
      query?: {
        unread?: 'true' | 'false';
        pagination?: 'cursor';
        limit?: string;
        cursor?: string;
      };
    },
    options?: RequestOptions
  ): AsyncIterable<Notification>;
  /** Delete all notifications */
  deleteAllNotifications(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<null>;
  /** Get unread count */
  getUnreadCount(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<UnreadCountResponse>;
  /** Mark notification as read */
  markNotificationAsRead(
    input: { path: { notificationId: string } },
    options?: RequestOptions
  ): Promise<MessageResponse>;
  /** Mark notification as unread */
  markNotificationAsUnread(
    input: { path: { notificationId: string } },
    options?: RequestOptions
  ): Promise<MessageResponse>;
  /** Mark all notifications as read */
  markAllNotificationsAsRead(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<MessageResponse>;
  /** Delete notification */
  deleteNotification(
    input: { path: { notificationId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** Mark events notifications read */
  markEventsNotificationsRead(
    input: { path: { scopeId: string } },
    options?: RequestOptions
  ): Promise<{ success: boolean; count: number }>;
  /** Mark posts notifications read */
  markPostsNotificationsRead(
    input: { path: { scopeId: string } },
    options?: RequestOptions
  ): Promise<{ success: boolean; count: number }>;
  /** List muted items */
  listMutedItems(
    input?: { query?: { type?: 'events' | 'posts' } },
    options?: RequestOptions
  ): Promise<MutedListResponse>;
  /** Mute event */
  muteEvent(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<MessageResponse>;
  /** Unmute event */
  unmuteEvent(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** Mute post */
  mutePost(
    input: { path: { postId: string } },
    options?: RequestOptions
  ): Promise<MessageResponse>;
  /** Unmute post */
  unmutePost(
    input: { path: { postId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** Inspect events mute status */
  inspectEventsMuteStatus(
    input: { path: { targetId: string } },
    options?: RequestOptions
  ): Promise<{
    isMuted: boolean;
    eventMuted?: boolean;
    effectiveMuted: boolean;
  }>;
  /** Inspect posts mute status */
  inspectPostsMuteStatus(
    input: { path: { targetId: string } },
    options?: RequestOptions
  ): Promise<{
    isMuted: boolean;
    eventMuted?: boolean;
    effectiveMuted: boolean;
  }>;
  /** Get current profile */
  getCurrentProfile(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<Profile>;
  /** Update profile */
  updateProfile(
    input: { body: UpdateProfileRequest },
    options?: RequestOptions
  ): Promise<Profile>;
  /** Get profile by username */
  getProfileByUsername(
    input: { path: { username: string }; query?: { eventId?: string } },
    options?: RequestOptions
  ): Promise<Profile>;
  /** Get privacy settings */
  getPrivacySettings(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<PrivacySettings>;
  /** Update privacy settings */
  updatePrivacySettings(
    input: { body: UpdatePrivacySettingsRequest },
    options?: RequestOptions
  ): Promise<PrivacySettings>;
  /** Get notification settings */
  getNotificationSettings(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<NotificationSettings>;
  /** Save notification preferences */
  saveNotificationPreferences(
    input: { body: UpdateNotificationSettingsRequest },
    options?: RequestOptions
  ): Promise<NotificationSettings>;
  /** List custom themes */
  listCustomThemes(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<CustomThemeListResponse>;
  /** Create custom theme */
  createCustomTheme(
    input: { body: CreateCustomThemeRequest },
    options?: RequestOptions
  ): Promise<CustomTheme>;
  /** Get theme preferences */
  getThemePreferences(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<ThemePreferencesResponse>;
  /** Set theme preferences */
  setThemePreferences(
    input: { body: SetThemePreferenceRequest },
    options?: RequestOptions
  ): Promise<ThemePreferencesResponse>;
  /** Update custom theme */
  updateCustomTheme(
    input: { path: { themeId: string }; body: UpdateCustomThemeRequest },
    options?: RequestOptions
  ): Promise<CustomTheme>;
  /** Delete custom theme */
  deleteCustomTheme(
    input: { path: { themeId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** List link and email invites */
  listLinkAndEmailInvites(
    input: {
      path: { eventId: string };
      query?: {
        pagination?: 'cursor';
        limit?: number;
        cursor?: string;
        kind?: 'link' | 'email' | 'all';
      };
    },
    options?: RequestOptions
  ): Promise<
    | Array<InviteSummary>
    | { items: Array<InviteSummary>; nextCursor: string | null }
  >;
  listLinkAndEmailInvitesItems(
    input: {
      path: { eventId: string };
      query?: {
        pagination?: 'cursor';
        limit?: number;
        cursor?: string;
        kind?: 'link' | 'email' | 'all';
      };
    },
    options?: RequestOptions
  ): AsyncIterable<InviteSummary>;
  /** Create link invitation */
  createLinkInvitation(
    input: {
      path: { eventId: string };
      body: { name?: string; maxUses?: number; expiresAt?: string };
    },
    options?: RequestOptions
  ): Promise<{ id: string; token: string }>;
  /** Create email invitation */
  createEmailInvitation(
    input: {
      path: { eventId: string };
      body: {
        invites: Array<{
          email: string;
          recipientName?: string;
          plusOnes?: number;
        }>;
        customMessage?: string;
        expiresAt?: string;
        send?: boolean;
      };
    },
    options?: RequestOptions
  ): Promise<{
    createdCount: number;
    inviteIds: Array<string>;
    queuedCount: number;
  }>;
  /** Create member invitation */
  createMemberInvitation(
    input: {
      path: { eventId: string };
      body: {
        username: string;
        role?: 'ATTENDEE' | 'MODERATOR';
        message?: string;
      };
    },
    options?: RequestOptions
  ): Promise<{ inviteId: string; status: 'PENDING' }>;
  /** List username invitations */
  listUsernameInvitations(
    input: {
      path: { eventId: string };
      query?: {
        pagination?: 'cursor';
        limit?: number;
        cursor?: string;
        status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'all';
      };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      inviteId: string;
      eventId: string;
      eventTitle: string;
      inviterId: string;
      inviteeId: string;
      role: 'ATTENDEE' | 'MODERATOR';
      status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
      message: string | null;
      createdAt: number;
      respondedAt: number | null;
    }>;
    nextCursor: string | null;
  }>;
  listUsernameInvitationsItems(
    input: {
      path: { eventId: string };
      query?: {
        pagination?: 'cursor';
        limit?: number;
        cursor?: string;
        status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'all';
      };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    inviteId: string;
    eventId: string;
    eventTitle: string;
    inviterId: string;
    inviteeId: string;
    role: 'ATTENDEE' | 'MODERATOR';
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    message: string | null;
    createdAt: number;
    respondedAt: number | null;
  }>;
  /** Create pending invitation */
  createPendingInvitation(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<{ queuedCount: number }>;
  /** Edit invitation */
  editInvitation(
    input: {
      path: { inviteId: string };
      body: {
        name?: string;
        maxUses?: number | null;
        expiresAt?: string | null;
      };
    },
    options?: RequestOptions
  ): Promise<InviteSummary>;
  /** Delete invitation */
  deleteInvitation(
    input: { path: { inviteId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** Inspect bearer invitation */
  inspectBearerInvitation(
    input: { path: { token: string } },
    options?: RequestOptions
  ): Promise<InvitePublic>;
  /** Accept bearer invitation */
  acceptBearerInvitation(
    input: { path: { token: string } },
    options?: RequestOptions
  ): Promise<{ eventId: string; membershipId: string }>;
  /** List username invitations */
  listUsernameInvitationsMemberInvites(
    input?: {
      query?: {
        pagination?: 'cursor';
        limit?: number;
        cursor?: string;
        status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'all';
      };
    },
    options?: RequestOptions
  ): Promise<{
    items: Array<{
      inviteId: string;
      eventId: string;
      eventTitle: string;
      inviterId: string;
      inviteeId: string;
      role: 'ATTENDEE' | 'MODERATOR';
      status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
      message: string | null;
      createdAt: number;
      respondedAt: number | null;
    }>;
    nextCursor: string | null;
  }>;
  listUsernameInvitationsMemberInvitesItems(
    input?: {
      query?: {
        pagination?: 'cursor';
        limit?: number;
        cursor?: string;
        status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'all';
      };
    },
    options?: RequestOptions
  ): AsyncIterable<{
    inviteId: string;
    eventId: string;
    eventTitle: string;
    inviterId: string;
    inviteeId: string;
    role: 'ATTENDEE' | 'MODERATOR';
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    message: string | null;
    createdAt: number;
    respondedAt: number | null;
  }>;
  /** Inspect username invitation */
  inspectUsernameInvitation(
    input: { path: { inviteId: string } },
    options?: RequestOptions
  ): Promise<{
    inviteId: string;
    eventId: string;
    eventTitle: string;
    inviterId: string;
    inviteeId: string;
    role: 'ATTENDEE' | 'MODERATOR';
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    message: string | null;
    createdAt: number;
    respondedAt: number | null;
  }>;
  /** cancel username invitation */
  cancelUsernameInvitation(
    input: { path: { inviteId: string } },
    options?: RequestOptions
  ): Promise<{ success: true }>;
  /** accept username invitation */
  acceptUsernameInvitation(
    input: { path: { inviteId: string } },
    options?: RequestOptions
  ): Promise<{ eventId: string; membershipId: string }>;
  /** decline username invitation */
  declineUsernameInvitation(
    input: { path: { inviteId: string } },
    options?: RequestOptions
  ): Promise<{ success: true }>;
  /** Invite a list’s current people to an event */
  inviteAListSCurrentPeopleToAnEvent(
    input: { path: { inviteListId: string }; body: InviteListSend },
    options?: RequestOptions
  ): Promise<InviteListSendResult>;
  /** Edit a private Invite list */
  editAPrivateInviteList(
    input: { path: { inviteListId: string }; body: UpdateInviteList },
    options?: RequestOptions
  ): Promise<InviteListDetail>;
  /** Delete a private Invite list */
  deleteAPrivateInviteList(
    input: { path: { inviteListId: string } },
    options?: RequestOptions
  ): Promise<DeleteInviteListResult>;
  /** Inspect a private Invite list */
  inspectAPrivateInviteList(
    input: { path: { inviteListId: string } },
    options?: RequestOptions
  ): Promise<InviteListDetail>;
  /** Search existing people by username */
  searchExistingPeopleByUsername(
    input: { query: { q: string } },
    options?: RequestOptions
  ): Promise<InviteListPeople>;
  /** List accepted friend choices */
  listAcceptedFriendChoices(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<InviteListPeople>;
  /** List private Invite lists */
  listPrivateInviteLists(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<InviteListCollection>;
  /** Create a private Invite list */
  createAPrivateInviteList(
    input: { body: CreateInviteList },
    options?: RequestOptions
  ): Promise<InviteListDetail>;
  /** Create report */
  createReport(
    input: { body: CreateReportRequest },
    options?: RequestOptions
  ): Promise<ReportCreateResponse>;
  /** List all users */
  listAllUsers(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<AdminUserListResponse>;
  /** Delete user */
  deleteUser(
    input: { path: { userId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** Set user role */
  setUserRole(
    input: { path: { userId: string }; body: SetUserRoleRequest },
    options?: RequestOptions
  ): Promise<MessageResponse>;
  /** List all events */
  listAllEvents(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<AdminEventListResponse>;
  /** Delete event (admin) */
  deleteEventAdmin(
    input: { path: { eventId: string } },
    options?: RequestOptions
  ): Promise<null>;
  /** List all reports */
  listAllReports(
    input?: Record<string, never>,
    options?: RequestOptions
  ): Promise<AdminReportListResponse>;
  /** Read an accessible file descriptor */
  inspectUpload(
    input: { path: { storageId: string } },
    options?: RequestOptions
  ): Promise<{
    storageId: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string | null;
  }>;
}
