import {
  isDisplayField,
  type TriggerType,
  type ActionType,
  type ConditionOperator,
  type CustomAddonTemplate,
  type TemplateField,
} from '@/lib/custom-addon-schema';

// ===== Trigger metadata =====

interface TriggerMeta {
  label: string;
  description: string;
  /** Which field types must exist for this trigger to be available */
  requiredFieldTypes?: string[];
}

export const TRIGGER_META: Record<TriggerType, TriggerMeta> = {
  form_submitted: {
    label: 'Form submitted',
    description: 'When an attendee submits their response',
  },
  list_item_claimed: {
    label: 'List item claimed',
    description: 'When someone claims a sign-up spot',
    requiredFieldTypes: ['list_item'],
  },
  list_item_full: {
    label: 'List item full',
    description: 'When a sign-up item reaches capacity',
    requiredFieldTypes: ['list_item'],
  },
  vote_cast: {
    label: 'Vote cast',
    description: 'When someone casts a vote',
    requiredFieldTypes: ['vote'],
  },
  vote_threshold: {
    label: 'Vote threshold reached',
    description: 'When an option reaches N votes',
    requiredFieldTypes: ['vote'],
  },
  toggle_changed: {
    label: 'Toggle changed',
    description: 'When someone flips a toggle',
    requiredFieldTypes: ['toggle'],
  },
  all_responses_in: {
    label: 'All responses in',
    description: 'When every event member has submitted',
  },
  member_joined: {
    label: 'Member joined',
    description: 'When someone joins the event',
  },
  member_left: {
    label: 'Member left',
    description: 'When someone leaves the event',
  },
  date_chosen: {
    label: 'Date chosen',
    description: 'When the organizer picks the event date',
  },
  addon_enabled: {
    label: 'Add-on enabled',
    description: 'When this add-on is enabled on an event',
  },
};

// ===== Action metadata =====

interface ActionMeta {
  label: string;
  description: string;
  requiresMessage: boolean;
  requiresTitle: boolean;
  requiresUrl: boolean;
  requiresKey: boolean;
}

export const ACTION_META: Record<ActionType, ActionMeta> = {
  notify_members: {
    label: 'Notify all members',
    description: 'Send a notification to every event member',
    requiresMessage: true,
    requiresTitle: false,
    requiresUrl: false,
    requiresKey: false,
  },
  notify_organizers: {
    label: 'Notify organizers',
    description: 'Send a notification to organizers and moderators',
    requiresMessage: true,
    requiresTitle: false,
    requiresUrl: false,
    requiresKey: false,
  },
  notify_submitter: {
    label: 'Notify submitter',
    description: 'Send a notification to the person who triggered this',
    requiresMessage: true,
    requiresTitle: false,
    requiresUrl: false,
    requiresKey: false,
  },
  create_post: {
    label: 'Create a post',
    description: 'Post in the event discussion',
    requiresMessage: true,
    requiresTitle: true,
    requiresUrl: false,
    requiresKey: false,
  },
  update_event_description: {
    label: 'Update event description',
    description: 'Replace the event description',
    requiresMessage: true,
    requiresTitle: false,
    requiresUrl: false,
    requiresKey: false,
  },
  send_webhook: {
    label: 'Send webhook',
    description: 'HTTP POST to an external URL',
    requiresMessage: false,
    requiresTitle: false,
    requiresUrl: true,
    requiresKey: false,
  },
  set_addon_data: {
    label: 'Set add-on data',
    description: 'Write a data entry for this add-on',
    requiresMessage: false,
    requiresTitle: false,
    requiresUrl: false,
    requiresKey: true,
  },
};

// ===== Condition operator metadata =====

interface OperatorMeta {
  label: string;
  needsValue: boolean;
}

export const OPERATOR_META: Record<ConditionOperator, OperatorMeta> = {
  equals: { label: 'equals', needsValue: true },
  not_equals: { label: 'does not equal', needsValue: true },
  contains: { label: 'contains', needsValue: true },
  not_contains: { label: 'does not contain', needsValue: true },
  greater_than: { label: 'is greater than', needsValue: true },
  less_than: { label: 'is less than', needsValue: true },
  greater_or_equal: { label: 'is at least', needsValue: true },
  less_or_equal: { label: 'is at most', needsValue: true },
  is_empty: { label: 'is empty', needsValue: false },
  is_not_empty: { label: 'is not empty', needsValue: false },
  in_list: { label: 'is one of', needsValue: true },
  not_in_list: { label: 'is not one of', needsValue: true },
};

// ===== Condition field info =====

/**
 * Data category for a condition field. Determines which operators
 * are available and whether the value input is a dropdown, text, or number.
 */
export type FieldCategory =
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'array'
  | 'unknown';

export interface ConditionFieldInfo {
  category: FieldCategory;
  /** For enum/boolean fields: the fixed set of possible values */
  enumValues?: string[];
  /** For array fields with known element values (multiselect, vote w/ allowMultiple) */
  elementValues?: string[];
}

/**
 * Condition field paths — built-in (non-template) fields available for conditions.
 */
export interface ConditionFieldOption {
  value: string;
  label: string;
  group: string;
}

/**
 * Get all condition field paths for the template, grouped.
 */
export function getConditionFieldOptions(
  template: CustomAddonTemplate
): ConditionFieldOption[] {
  const fields = getAllFields(template);
  const options: ConditionFieldOption[] = [];

  for (const f of fields) {
    if (!f.label || isDisplayField(f.type)) continue;
    options.push({
      value: `fields.${f.id}`,
      label: f.label,
      group: 'Fields',
    });
  }

  options.push(
    { value: 'member.name', label: 'Member name', group: 'Member' },
    { value: 'member.role', label: 'Member role', group: 'Member' }
  );

  return options;
}

/**
 * Resolve a condition field path to its data category and known values.
 */
export function getFieldInfo(
  fieldPath: string,
  template: CustomAddonTemplate
): ConditionFieldInfo {
  // Built-in fields
  if (fieldPath === 'member.role') {
    return {
      category: 'enum',
      enumValues: ['ORGANIZER', 'MODERATOR', 'ATTENDEE'],
    };
  }
  if (fieldPath === 'member.name') {
    return { category: 'string' };
  }

  // Template fields — match by ID
  if (fieldPath.startsWith('fields.')) {
    const fieldId = fieldPath.slice('fields.'.length);
    const field = getAllFields(template).find(f => f.id === fieldId);
    if (!field) return { category: 'unknown' };

    switch (field.type) {
      case 'text':
        return { category: 'string' };
      case 'number':
        return { category: 'number' };
      case 'yesno':
        return { category: 'boolean', enumValues: ['Yes', 'No'] };
      case 'select':
        return { category: 'enum', enumValues: field.options ?? [] };
      case 'multiselect':
        return {
          category: 'array',
          elementValues: field.options ?? [],
        };
      case 'vote':
        return field.allowMultiple
          ? { category: 'array', elementValues: field.options ?? [] }
          : { category: 'enum', enumValues: field.options ?? [] };
      case 'list_item':
        return { category: 'array' };
      default:
        return { category: 'unknown' };
    }
  }

  return { category: 'unknown' };
}

/**
 * Get the operators that make sense for a given field category.
 */
export function getOperatorsForCategory(
  category: FieldCategory
): ConditionOperator[] {
  switch (category) {
    case 'string':
      return [
        'equals',
        'not_equals',
        'contains',
        'not_contains',
        'is_empty',
        'is_not_empty',
      ];
    case 'number':
      return [
        'equals',
        'not_equals',
        'greater_than',
        'less_than',
        'greater_or_equal',
        'less_or_equal',
        'is_empty',
        'is_not_empty',
      ];
    case 'boolean':
    case 'enum':
      return ['equals', 'not_equals', 'is_empty', 'is_not_empty'];
    case 'array':
      return ['contains', 'not_contains', 'is_empty', 'is_not_empty'];
    case 'unknown':
    default:
      // Show all operators if we can't determine the type
      return Object.keys(OPERATOR_META) as ConditionOperator[];
  }
}

// ===== Dynamic availability =====

/**
 * Get triggers available for the current template.
 * Filters based on which field types exist in the template.
 */
export function getAvailableTriggers(
  template: CustomAddonTemplate
): TriggerType[] {
  const allFields = getAllFields(template);
  const fieldTypes = new Set(allFields.map(f => f.type));

  return (Object.keys(TRIGGER_META) as TriggerType[]).filter(type => {
    const meta = TRIGGER_META[type];
    if (!meta.requiredFieldTypes) return true;
    return meta.requiredFieldTypes.some(ft =>
      fieldTypes.has(ft as TemplateField['type'])
    );
  });
}

/**
 * Get all fields from all sections (flat list).
 */
export function getAllFields(template: CustomAddonTemplate): TemplateField[] {
  return template.sections.flatMap(s => s.fields);
}

/**
 * Get field options for visibility conditions.
 * Only includes input fields (not display-only) and excludes the current field.
 */
export function getVisibilityFieldOptions(
  template: CustomAddonTemplate,
  excludeFieldId?: string
): ConditionFieldOption[] {
  return getAllFields(template)
    .filter(f => !isDisplayField(f.type) && f.id !== excludeFieldId)
    .map(f => ({
      value: `fields.${f.id}`,
      label: f.label || f.id,
      group: 'Fields',
    }));
}

/**
 * Get field options for section-level visibility conditions.
 * Only includes input fields (not display-only) and excludes fields
 * belonging to the given section — a section can't depend on its own
 * fields to show/hide itself.
 */
export function getVisibilityFieldOptionsExcludingSection(
  template: CustomAddonTemplate,
  sectionId: string
): ConditionFieldOption[] {
  const sectionFieldIds = new Set(
    template.sections.find(s => s.id === sectionId)?.fields.map(f => f.id) ?? []
  );

  return getAllFields(template)
    .filter(f => !isDisplayField(f.type) && !sectionFieldIds.has(f.id))
    .map(f => ({
      value: `fields.${f.id}`,
      label: f.label || f.id,
      group: 'Fields',
    }));
}

/**
 * Get list_item fields (for list_item_full trigger fieldId picker).
 */
export function getListItemFields(
  template: CustomAddonTemplate
): TemplateField[] {
  return getAllFields(template).filter(f => f.type === 'list_item');
}

/**
 * Get vote fields (for vote_threshold trigger).
 */
export function getVoteFields(template: CustomAddonTemplate): TemplateField[] {
  return getAllFields(template).filter(f => f.type === 'vote');
}

// ===== Template Variables =====

import {
  getDataBlocksForTrigger,
  DATA_GROUP_LABELS,
  type DataBlock,
  type DataBlockGroup,
} from './building-blocks';

export interface VariableGroup {
  label: string;
  variables: { path: string; description: string }[];
}

/**
 * Get available template variables for a given trigger type and template.
 * Delegates to the unified building blocks catalog.
 */
export function getAvailableVariables(
  template: CustomAddonTemplate,
  triggerType?: TriggerType
): VariableGroup[] {
  const blocks = getDataBlocksForTrigger(template, triggerType);

  // Group blocks by their group field
  const groupMap = new Map<DataBlockGroup, DataBlock[]>();
  for (const block of blocks) {
    const list = groupMap.get(block.group) ?? [];
    list.push(block);
    groupMap.set(block.group, list);
  }

  const groups: VariableGroup[] = [];
  for (const [group, groupBlocks] of groupMap) {
    groups.push({
      label: DATA_GROUP_LABELS[group],
      variables: groupBlocks.map(b => ({
        path: b.path,
        description: b.description,
      })),
    });
  }

  return groups;
}
