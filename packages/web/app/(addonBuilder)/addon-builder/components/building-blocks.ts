import type {
  TriggerType,
  ActionType,
  CustomAddonTemplate,
} from '@/lib/custom-addon-schema';

// ===== Data Blocks =====

export type DataBlockGroup = 'event' | 'addon' | 'member' | 'fields' | 'vote';

export interface DataBlock {
  id: string;
  /** Dot-path for variable interpolation, e.g. "event.title" */
  path: string;
  label: string;
  description: string;
  group: DataBlockGroup;
  /** String to insert, e.g. "{{event.title}}" */
  insertValue: string;
}

// ===== Action Blocks =====

export type ActionBlockGroup = 'notify' | 'content' | 'integration' | 'data';

export interface ActionInput {
  name: string;
  type: 'text' | 'textarea' | 'url';
  placeholder: string;
}

export interface ActionBlock {
  id: string;
  type: ActionType;
  label: string;
  description: string;
  group: ActionBlockGroup;
  inputs: ActionInput[];
}

// ===== Static data blocks (always available) =====

const EVENT_DATA_BLOCKS: DataBlock[] = [
  {
    id: 'event.title',
    path: 'event.title',
    label: 'Event Title',
    description: 'The title of the event',
    group: 'event',
    insertValue: '{{event.title}}',
  },
  {
    id: 'event.location',
    path: 'event.location',
    label: 'Event Location',
    description: 'The event location',
    group: 'event',
    insertValue: '{{event.location}}',
  },
  {
    id: 'event.date',
    path: 'event.date',
    label: 'Chosen Date',
    description: 'The chosen event date (formatted)',
    group: 'event',
    insertValue: '{{event.date}}',
  },
  {
    id: 'event.memberCount',
    path: 'event.memberCount',
    label: 'Member Count',
    description: 'Number of event members',
    group: 'event',
    insertValue: '{{event.memberCount}}',
  },
];

const ADDON_DATA_BLOCKS: DataBlock[] = [
  {
    id: 'addon.name',
    path: 'addon.name',
    label: 'Add-on Name',
    description: 'The name of this add-on',
    group: 'addon',
    insertValue: '{{addon.name}}',
  },
  {
    id: 'addon.responseCount',
    path: 'addon.responseCount',
    label: 'Response Count',
    description: 'Number of submitted responses',
    group: 'addon',
    insertValue: '{{addon.responseCount}}',
  },
];

const MEMBER_DATA_BLOCKS: DataBlock[] = [
  {
    id: 'member.name',
    path: 'member.name',
    label: 'Member Name',
    description: "The submitter's name",
    group: 'member',
    insertValue: '{{member.name}}',
  },
  {
    id: 'member.role',
    path: 'member.role',
    label: 'Member Role',
    description: "The submitter's role",
    group: 'member',
    insertValue: '{{member.role}}',
  },
];

const VOTE_DATA_BLOCKS: DataBlock[] = [
  {
    id: 'vote.top_option',
    path: 'vote.top_option',
    label: 'Top Vote Option',
    description: 'The highest-voted option',
    group: 'vote',
    insertValue: '{{vote.top_option}}',
  },
];

// ===== Triggers that imply a person context =====

const MEMBER_TRIGGERS: TriggerType[] = [
  'form_submitted',
  'list_item_claimed',
  'list_item_full',
  'vote_cast',
  'vote_threshold',
  'member_joined',
  'member_left',
];

const FIELD_TRIGGERS: TriggerType[] = [
  'form_submitted',
  'list_item_claimed',
  'vote_cast',
];

const VOTE_TRIGGERS: TriggerType[] = ['vote_cast', 'vote_threshold'];

// ===== Catalog functions =====

/**
 * Get all data blocks available for a template (regardless of trigger).
 * Used by the Toolbox panel to show everything.
 */
export function getDataBlocks(template: CustomAddonTemplate): DataBlock[] {
  const blocks: DataBlock[] = [
    ...EVENT_DATA_BLOCKS,
    ...ADDON_DATA_BLOCKS,
    ...MEMBER_DATA_BLOCKS,
    ...getFieldDataBlocks(template),
    ...VOTE_DATA_BLOCKS,
  ];
  return blocks;
}

/**
 * Get data blocks filtered by trigger context.
 * Used by VariablePicker and autocomplete.
 */
export function getDataBlocksForTrigger(
  template: CustomAddonTemplate,
  triggerType?: TriggerType
): DataBlock[] {
  const blocks: DataBlock[] = [];

  // Member variables (available for triggers involving a person)
  if (triggerType && MEMBER_TRIGGERS.includes(triggerType)) {
    blocks.push(...MEMBER_DATA_BLOCKS);
  }

  // Event variables (always available)
  blocks.push(...EVENT_DATA_BLOCKS);

  // Field variables (available for form/vote/list triggers)
  if (triggerType && FIELD_TRIGGERS.includes(triggerType)) {
    blocks.push(...getFieldDataBlocks(template));
  }

  // Vote variables
  if (triggerType && VOTE_TRIGGERS.includes(triggerType)) {
    blocks.push(...VOTE_DATA_BLOCKS);
  }

  // Addon variables (always available)
  blocks.push(...ADDON_DATA_BLOCKS);

  return blocks;
}

/**
 * Derive data blocks from the template's custom fields.
 * Uses the field id (slug) for variable paths and the label for display.
 */
function getFieldDataBlocks(template: CustomAddonTemplate): DataBlock[] {
  return template.sections.flatMap(s =>
    s.fields
      .filter(f => f.label)
      .map(f => ({
        id: `fields.${f.id}`,
        path: `fields.${f.id}`,
        label: f.label,
        description: `Value of "${f.label}"`,
        group: 'fields' as const,
        insertValue: `{{fields.${f.id}}}`,
      }))
  );
}

// ===== Action blocks (defined inline to avoid circular imports with automation-utils) =====

const ACTION_BLOCKS: ActionBlock[] = [
  {
    id: 'notify_members',
    type: 'notify_members',
    label: 'Notify all members',
    description: 'Send a notification to every event member',
    group: 'notify',
    inputs: [
      { name: 'message', type: 'textarea', placeholder: 'Message content' },
    ],
  },
  {
    id: 'notify_organizers',
    type: 'notify_organizers',
    label: 'Notify organizers',
    description: 'Send a notification to organizers and moderators',
    group: 'notify',
    inputs: [
      { name: 'message', type: 'textarea', placeholder: 'Message content' },
    ],
  },
  {
    id: 'notify_submitter',
    type: 'notify_submitter',
    label: 'Notify submitter',
    description: 'Send a notification to the person who triggered this',
    group: 'notify',
    inputs: [
      { name: 'message', type: 'textarea', placeholder: 'Message content' },
    ],
  },
  {
    id: 'create_post',
    type: 'create_post',
    label: 'Create a post',
    description: 'Post in the event discussion',
    group: 'content',
    inputs: [
      { name: 'title', type: 'text', placeholder: 'Post title' },
      { name: 'message', type: 'textarea', placeholder: 'Message content' },
    ],
  },
  {
    id: 'update_event_description',
    type: 'update_event_description',
    label: 'Update event description',
    description: 'Replace the event description',
    group: 'content',
    inputs: [
      { name: 'message', type: 'textarea', placeholder: 'Message content' },
    ],
  },
  {
    id: 'send_webhook',
    type: 'send_webhook',
    label: 'Send webhook',
    description: 'HTTP POST to an external URL',
    group: 'integration',
    inputs: [
      {
        name: 'webhookUrl',
        type: 'url',
        placeholder: 'https://example.com/webhook',
      },
    ],
  },
  {
    id: 'set_addon_data',
    type: 'set_addon_data',
    label: 'Set add-on data',
    description: 'Write a data entry for this add-on',
    group: 'data',
    inputs: [{ name: 'key', type: 'text', placeholder: 'Data key' }],
  },
];

/**
 * Get all available action blocks.
 */
export function getActionBlocks(): ActionBlock[] {
  return ACTION_BLOCKS;
}

// ===== Group labels for display =====

export const DATA_GROUP_LABELS: Record<DataBlockGroup, string> = {
  event: 'Event Context',
  addon: 'Add-on',
  member: 'Member',
  fields: 'Custom Fields',
  vote: 'Vote',
};

export const ACTION_GROUP_LABELS: Record<ActionBlockGroup, string> = {
  notify: 'Notifications',
  content: 'Content',
  integration: 'Integration',
  data: 'Data',
};
