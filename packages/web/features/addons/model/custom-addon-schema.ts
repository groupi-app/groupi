import YAML from 'yaml';

// ===== Field Types =====

export const FIELD_TYPES = [
  'text',
  'number',
  'select',
  'multiselect',
  'yesno',
  'list_item',
  'vote',
  'toggle',
  'action_button',
  'static_text',
  'dynamic_summary',
  'divider',
  'info_callout',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const INPUT_FIELD_TYPES: FieldType[] = [
  'text',
  'number',
  'select',
  'multiselect',
  'yesno',
  'list_item',
  'vote',
];

export const DISPLAY_FIELD_TYPES: FieldType[] = [
  'action_button',
  'static_text',
  'dynamic_summary',
  'divider',
  'info_callout',
];

export function isDisplayField(type: FieldType): boolean {
  return DISPLAY_FIELD_TYPES.includes(type);
}

// ===== Section Layouts =====

export const SECTION_LAYOUTS = ['form', 'interactive'] as const;
export type SectionLayout = (typeof SECTION_LAYOUTS)[number];

/** Field types allowed in form sections (batch submit + display-only) */
export const FORM_FIELD_TYPES: FieldType[] = [
  'text',
  'number',
  'select',
  'multiselect',
  'yesno',
  'static_text',
  'dynamic_summary',
  'divider',
  'info_callout',
];

/** Field types allowed in interactive sections (save independently or display-only) */
export const INTERACTIVE_FIELD_TYPES: FieldType[] = [
  'vote',
  'list_item',
  'toggle',
  'action_button',
  'static_text',
  'dynamic_summary',
  'divider',
  'info_callout',
];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text',
  number: 'Number',
  select: 'Dropdown',
  multiselect: 'Checkboxes',
  yesno: 'Yes / No',
  list_item: 'Sign-up List',
  vote: 'Poll / Vote',
  toggle: 'Toggle',
  action_button: 'Action Button',
  static_text: 'Static Text',
  dynamic_summary: 'Dynamic Summary',
  divider: 'Divider',
  info_callout: 'Info Callout',
};

export const FIELD_TYPE_DESCRIPTIONS: Record<FieldType, string> = {
  text: 'Attendees type a short or long answer',
  number: 'Attendees enter a number',
  select: 'Attendees pick one option from a list',
  multiselect: 'Attendees check one or more options',
  yesno: 'Attendees answer yes or no',
  list_item: 'Attendees claim spots on a sign-up sheet',
  vote: 'Attendees vote on options and see results',
  toggle: 'A per-person on/off switch',
  action_button: 'A button that triggers actions when clicked',
  static_text: 'Show read-only text with {{variable}} support',
  dynamic_summary: 'Show a live-computed stat or summary',
  divider: 'Visual separator between fields',
  info_callout: 'Colored notice box for attendees',
};

// ===== Display Field Types =====

export type SummaryType =
  | 'response_count'
  | 'vote_leader'
  | 'signup_progress'
  | 'custom_text';

export const SUMMARY_TYPE_LABELS: Record<SummaryType, string> = {
  response_count: 'Response Count',
  vote_leader: 'Vote Leader',
  signup_progress: 'Sign-up Progress',
  custom_text: 'Custom Text',
};

export type TextFormat = 'p' | 'h1' | 'h2' | 'h3';

export const TEXT_FORMAT_LABELS: Record<TextFormat, string> = {
  p: 'Paragraph',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
};

export type CalloutVariant = 'info' | 'warning' | 'success';

export const CALLOUT_VARIANT_LABELS: Record<CalloutVariant, string> = {
  info: 'Info',
  warning: 'Warning',
  success: 'Success',
};

// ===== Action Button Types =====

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'destructive';

export const BUTTON_VARIANT_LABELS: Record<ButtonVariant, string> = {
  default: 'Primary',
  secondary: 'Secondary',
  outline: 'Outline',
  destructive: 'Destructive',
};

// ===== Template Types =====

export interface ListItem {
  id: string;
  name: string;
  quantity: number;
}

export interface TemplateField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  // organizer-time configuration
  configurable?: boolean;
  // text
  variant?: 'short' | 'long';
  placeholder?: string;
  maxLength?: number;
  // number
  min?: number;
  max?: number;
  // select / multiselect / vote
  options?: string[];
  minSelections?: number;
  maxSelections?: number;
  // list_item
  items?: ListItem[];
  // vote
  allowMultiple?: boolean;
  showResults?: boolean;
  // static_text
  content?: string;
  textFormat?: TextFormat;
  // dynamic_summary
  summaryType?: SummaryType;
  summaryLabel?: string;
  // divider
  dividerLabel?: string;
  // info_callout
  calloutVariant?: CalloutVariant;
  calloutMessage?: string;
  // action_button
  buttonLabel?: string;
  buttonVariant?: ButtonVariant;
  // toggle
  defaultEnabled?: boolean;
  // inline actions (action_button, vote, list_item, toggle)
  actions?: AutomationAction[];
  // conditional visibility
  visibilityConditions?: AutomationCondition[];
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  layout?: SectionLayout;
  fields: TemplateField[];
  // organizer-time configuration
  configurable?: boolean;
  allowedFieldTypes?: FieldType[];
  // conditional visibility
  visibilityConditions?: AutomationCondition[];
}

export interface TemplateSettings {
  requiresCompletion?: boolean;
  /** Custom label for the card link button (default: "View") */
  cardLinkLabel?: string;
  /** Custom subtitle shown on the event card (default: "{n} responses"). Supports {{response_count}}. */
  cardSubtitle?: string;
  /** When true, no dedicated page is created — content renders inline on the event card */
  cardOnly?: boolean;
}

// ===== Automation Types =====

export const TRIGGER_TYPES = [
  'form_submitted',
  'list_item_claimed',
  'list_item_full',
  'vote_cast',
  'vote_threshold',
  'toggle_changed',
  'all_responses_in',
  'member_joined',
  'member_left',
  'date_chosen',
  'addon_enabled',
] as const;

export type TriggerType = (typeof TRIGGER_TYPES)[number];

export const CONDITION_OPERATORS = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'greater_than',
  'less_than',
  'greater_or_equal',
  'less_or_equal',
  'is_empty',
  'is_not_empty',
  'in_list',
  'not_in_list',
] as const;

export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

export const ACTION_TYPES = [
  'notify_members',
  'notify_organizers',
  'notify_submitter',
  'create_post',
  'update_event_description',
  'send_webhook',
  'set_addon_data',
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

export interface AutomationTrigger {
  type: TriggerType;
  fieldId?: string;
  threshold?: number;
}

export interface AutomationCondition {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
}

export interface AutomationAction {
  type: ActionType;
  message?: string;
  title?: string;
  webhookUrl?: string;
  webhookHeaders?: Record<string, string>;
  key?: string;
  data?: unknown;
  /** Only send to recipients whose toggle field is enabled */
  recipientToggleField?: string;
}

export interface Automation {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
}

// ===== Template =====

export interface CustomAddonTemplate {
  name: string;
  description: string;
  iconName: string;
  settings?: TemplateSettings;
  sections: TemplateSection[];
  submitButtonLabel?: string;
  onSubmitActions?: AutomationAction[];
  automations?: Automation[];
}

export interface CustomAddonConfig {
  templateId: string;
  template: CustomAddonTemplate;
}

// ===== Factories =====

let nextId = 0;
function generateId(): string {
  return `${Date.now().toString(36)}${(nextId++).toString(36)}`;
}

/**
 * Derive a field ID from a label: lowercase, spaces→dashes, strip
 * non-alphanumeric, deduplicate against existing IDs.
 *
 * "My Field" → "my-field"
 * "My Field" (duplicate) → "my-field-1"
 */
export function slugifyFieldId(label: string, existingIds: string[]): string {
  let slug = label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!slug) slug = 'field';

  if (!existingIds.includes(slug)) return slug;

  let i = 1;
  while (existingIds.includes(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}

/**
 * Re-derive all field IDs across a template from their labels.
 * Processes fields in order so earlier fields get the base slug
 * and later duplicates get the suffix.
 * Also refactors any {{fields.old-id}} variable references in
 * text content to match the new IDs.
 */
export function resluggifyAllFields(
  template: CustomAddonTemplate
): CustomAddonTemplate {
  // Pass 1: compute new IDs and build a rename map
  const usedIds: string[] = [];
  const renames = new Map<string, string>();

  const sections = template.sections.map(section => ({
    ...section,
    fields: section.fields.map(field => {
      if (!field.label) {
        usedIds.push(field.id);
        return field;
      }
      const newId = slugifyFieldId(field.label, usedIds);
      usedIds.push(newId);
      if (newId !== field.id) {
        renames.set(field.id, newId);
        return { ...field, id: newId };
      }
      return field;
    }),
  }));

  if (renames.size === 0) return { ...template, sections };

  // Pass 2: refactor variable references in all text content
  const refactor = (text: string): string =>
    text.replace(/\{\{fields\.([^}]+)\}\}/g, (match, path: string) => {
      const trimmed = path.trim();
      const newId = renames.get(trimmed);
      return newId ? `{{fields.${newId}}}` : match;
    });

  const refactorAction = (action: AutomationAction): AutomationAction => {
    let changed = false;
    const result = { ...action };
    if (result.message) {
      const updated = refactor(result.message);
      if (updated !== result.message) {
        result.message = updated;
        changed = true;
      }
    }
    if (result.title) {
      const updated = refactor(result.title);
      if (updated !== result.title) {
        result.title = updated;
        changed = true;
      }
    }
    return changed ? result : action;
  };

  const refactorConditions = (
    conditions: AutomationCondition[]
  ): AutomationCondition[] =>
    conditions.map(cond => {
      if (cond.field.startsWith('fields.')) {
        const oldId = cond.field.slice('fields.'.length);
        const newId = renames.get(oldId);
        if (newId) return { ...cond, field: `fields.${newId}` };
      }
      return cond;
    });

  const refactoredSections = sections.map(section => {
    let updatedSection = {
      ...section,
      fields: section.fields.map(field => {
        let updated = field;
        if (field.content) {
          const newContent = refactor(field.content);
          if (newContent !== field.content)
            updated = { ...updated, content: newContent };
        }
        if (field.calloutMessage) {
          const newMsg = refactor(field.calloutMessage);
          if (newMsg !== field.calloutMessage)
            updated = { ...updated, calloutMessage: newMsg };
        }
        if (field.actions) {
          const newActions = field.actions.map(refactorAction);
          if (newActions.some((a, i) => a !== field.actions![i]))
            updated = { ...updated, actions: newActions };
        }
        if (field.visibilityConditions) {
          const newConds = refactorConditions(field.visibilityConditions);
          if (newConds.some((c, i) => c !== field.visibilityConditions![i]))
            updated = { ...updated, visibilityConditions: newConds };
        }
        return updated;
      }),
    };

    // Refactor section-level visibility conditions
    if (updatedSection.visibilityConditions) {
      const newConds = refactorConditions(updatedSection.visibilityConditions);
      if (
        newConds.some((c, i) => c !== updatedSection.visibilityConditions![i])
      ) {
        updatedSection = { ...updatedSection, visibilityConditions: newConds };
      }
    }

    return updatedSection;
  });

  let result: CustomAddonTemplate = {
    ...template,
    sections: refactoredSections,
  };

  if (result.onSubmitActions) {
    const newActions = result.onSubmitActions.map(refactorAction);
    if (newActions.some((a, i) => a !== result.onSubmitActions![i]))
      result = { ...result, onSubmitActions: newActions };
  }

  if (result.automations) {
    const newAutos = result.automations.map(auto => {
      const newActions = auto.actions.map(refactorAction);
      if (newActions.some((a, i) => a !== auto.actions[i]))
        return { ...auto, actions: newActions };
      return auto;
    });
    if (newAutos.some((a, i) => a !== result.automations![i]))
      result = { ...result, automations: newAutos };
  }

  return result;
}

export function createEmptyTemplate(): CustomAddonTemplate {
  return {
    name: '',
    description: '',
    iconName: 'listChecks',
    settings: {
      requiresCompletion: false,
    },
    sections: [createEmptySection()],
  };
}

export function createEmptySection(): TemplateSection {
  return {
    id: generateId(),
    title: '',
    fields: [],
  };
}

export function createEmptyField(type: FieldType): TemplateField {
  const base: TemplateField = {
    id: generateId(),
    type,
    label: '',
    required: false,
  };

  switch (type) {
    case 'text':
      return { ...base, variant: 'short' };
    case 'number':
      return base;
    case 'select':
    case 'multiselect':
      return { ...base, options: ['', ''] };
    case 'yesno':
      return base;
    case 'list_item':
      return {
        ...base,
        items: [{ id: generateId(), name: '', quantity: 1 }],
      };
    case 'vote':
      return {
        ...base,
        options: ['', ''],
        allowMultiple: false,
        showResults: true,
      };
    case 'toggle':
      return { ...base, required: false, defaultEnabled: true };
    case 'action_button':
      return {
        ...base,
        required: false,
        buttonLabel: 'Click Me',
        buttonVariant: 'default' as ButtonVariant,
        actions: [],
      };
    case 'static_text':
      return {
        ...base,
        required: false,
        content: '',
        textFormat: 'p' as TextFormat,
      };
    case 'dynamic_summary':
      return {
        ...base,
        required: false,
        summaryType: 'response_count' as SummaryType,
        summaryLabel: '',
      };
    case 'divider':
      return { ...base, required: false, dividerLabel: '' };
    case 'info_callout':
      return {
        ...base,
        required: false,
        calloutVariant: 'info' as CalloutVariant,
        calloutMessage: '',
      };
    default:
      return base;
  }
}

// ===== Validation =====

export interface ValidationError {
  message: string;
  /** Which section the error belongs to (undefined = template-level) */
  sectionId?: string;
  /** Which field the error belongs to (undefined = section-level) */
  fieldId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  /** Flat error strings for backward compat (YAML editor, backend) */
  errorMessages: string[];
}

/** Get errors for a specific field */
export function getFieldErrors(
  validation: ValidationResult,
  fieldId: string
): string[] {
  return validation.errors
    .filter(e => e.fieldId === fieldId)
    .map(e => e.message);
}

/** Get section-level errors (not field errors within the section) */
export function getSectionErrors(
  validation: ValidationResult,
  sectionId: string
): string[] {
  return validation.errors
    .filter(e => e.sectionId === sectionId && !e.fieldId)
    .map(e => e.message);
}

/** Get template-level errors (not tied to any section) */
export function getTemplateErrors(validation: ValidationResult): string[] {
  return validation.errors.filter(e => !e.sectionId).map(e => e.message);
}

export function validateTemplate(
  template: CustomAddonTemplate
): ValidationResult {
  const errors: ValidationError[] = [];

  const push = (message: string, sectionId?: string, fieldId?: string) => {
    errors.push({ message, sectionId, fieldId });
  };

  if (!template.name || template.name.trim().length === 0) {
    push('Name is required');
  } else if (template.name.length > 60) {
    push('Name must be at most 60 characters');
  }

  if (template.description && template.description.length > 200) {
    push('Description must be at most 200 characters');
  }

  if (!template.iconName) {
    push('Icon is required');
  }

  if (!template.sections || template.sections.length === 0) {
    push('At least one section is required');
  }

  if (template.settings?.requiresCompletion) {
    if (template.settings?.cardOnly) {
      push('Requires completion is not compatible with card-only mode');
    }
    const hasFormSection = (template.sections ?? []).some(
      s => (s.layout ?? 'form') === 'form'
    );
    if (!hasFormSection) {
      push(
        'Requires completion needs at least one form section with a submit button'
      );
    }
  }

  // Build field ID set for reference validation
  const allFieldIds = new Set(
    (template.sections ?? []).flatMap(s => s.fields.map(f => f.id))
  );
  const fieldTypeById = new Map(
    (template.sections ?? []).flatMap(s =>
      s.fields.map(f => [f.id, f.type] as const)
    )
  );

  for (const section of template.sections ?? []) {
    if (!section.title || section.title.trim().length === 0) {
      push('Needs a title', section.id);
    }

    if (
      section.layout !== undefined &&
      !SECTION_LAYOUTS.includes(section.layout)
    ) {
      push('Invalid section layout', section.id);
    }

    if (
      (!section.fields || section.fields.length === 0) &&
      !section.configurable
    ) {
      push('Needs at least one field', section.id);
    }

    // Validate fields are allowed in this section's layout
    const allowedForLayout =
      section.layout === 'interactive'
        ? INTERACTIVE_FIELD_TYPES
        : FORM_FIELD_TYPES;
    for (const field of section.fields ?? []) {
      if (!allowedForLayout.includes(field.type)) {
        const layoutLabel =
          section.layout === 'interactive' ? 'interactive' : 'form';
        push(
          `"${FIELD_TYPE_LABELS[field.type]}" fields are not allowed in ${layoutLabel} sections`,
          section.id,
          field.id
        );
      }
    }

    for (const field of section.fields ?? []) {
      if (!FIELD_TYPES.includes(field.type)) {
        push(`Unknown field type: ${field.type}`, section.id, field.id);
        continue;
      }

      const isDisplay = isDisplayField(field.type);

      if (!isDisplay && (!field.label || field.label.trim().length === 0)) {
        push('Needs a label', section.id, field.id);
      }

      if (field.type === 'static_text') {
        if (!field.content || field.content.trim().length === 0) {
          push('Needs content', section.id, field.id);
        }
      }

      if (field.type === 'dynamic_summary') {
        if (!field.summaryType) {
          push('Needs a summary type', section.id, field.id);
        }
      }

      if (field.type === 'info_callout') {
        if (!field.calloutMessage || field.calloutMessage.trim().length === 0) {
          push('Needs a message', section.id, field.id);
        }
      }

      if (
        (field.type === 'select' ||
          field.type === 'multiselect' ||
          field.type === 'vote') &&
        (!field.options || field.options.length < 2) &&
        !field.configurable
      ) {
        push('Needs at least 2 options', section.id, field.id);
      }

      if (
        (field.type === 'select' ||
          field.type === 'multiselect' ||
          field.type === 'vote') &&
        field.options?.some(o => !o || o.trim().length === 0) &&
        !field.configurable
      ) {
        push('Has empty options', section.id, field.id);
      }

      if (
        field.type === 'list_item' &&
        (!field.items || field.items.length === 0) &&
        !field.configurable
      ) {
        push('Needs at least one item', section.id, field.id);
      }

      if (field.type === 'list_item' && !field.configurable) {
        for (const item of field.items ?? []) {
          if (!item.name || item.name.trim().length === 0) {
            push('An item needs a name', section.id, field.id);
          }
          if (item.quantity < 1) {
            push('Item quantity must be at least 1', section.id, field.id);
          }
        }
      }

      if (field.type === 'action_button') {
        if (!field.buttonLabel || field.buttonLabel.trim().length === 0) {
          push('Needs a button label', section.id, field.id);
        }
        if (!field.actions || field.actions.length === 0) {
          push('Needs at least one action', section.id, field.id);
        }
        for (const action of field.actions ?? []) {
          if (!ACTION_TYPES.includes(action.type)) {
            push('Has an invalid action type', section.id, field.id);
          }
        }
      }

      if (field.type === 'toggle' && field.actions) {
        for (const action of field.actions) {
          if (!ACTION_TYPES.includes(action.type)) {
            push('Has an invalid inline action type', section.id, field.id);
          }
        }
      }

      if (
        (field.type === 'vote' || field.type === 'list_item') &&
        field.actions
      ) {
        for (const action of field.actions) {
          if (!ACTION_TYPES.includes(action.type)) {
            push('Has an invalid inline action type', section.id, field.id);
          }
        }
      }

      if (
        field.type === 'number' &&
        field.min !== undefined &&
        field.max !== undefined &&
        field.min > field.max
      ) {
        push('Min must be less than or equal to max', section.id, field.id);
      }

      if (
        field.type === 'text' &&
        field.maxLength !== undefined &&
        field.maxLength < 1
      ) {
        push('Max length must be at least 1', section.id, field.id);
      }

      // Validate visibilityConditions
      if (field.visibilityConditions) {
        for (const cond of field.visibilityConditions) {
          if (!cond.field) {
            push('Visibility condition missing field', section.id, field.id);
          } else if (cond.field.startsWith('fields.')) {
            const refId = cond.field.slice('fields.'.length);
            if (!allFieldIds.has(refId)) {
              push(
                'Visibility condition references a missing field',
                section.id,
                field.id
              );
            }
          }
          if (!CONDITION_OPERATORS.includes(cond.operator)) {
            push(
              'Visibility condition has invalid operator',
              section.id,
              field.id
            );
          }
        }
      }
    }

    // Validate section-level visibilityConditions
    if (section.visibilityConditions) {
      for (const cond of section.visibilityConditions) {
        if (!cond.field) {
          push('Section visibility condition missing field', section.id);
        } else if (cond.field.startsWith('fields.')) {
          const refId = cond.field.slice('fields.'.length);
          if (!allFieldIds.has(refId)) {
            push(
              'Section visibility condition references a missing field',
              section.id
            );
          }
        }
        if (!CONDITION_OPERATORS.includes(cond.operator)) {
          push('Section visibility condition has invalid operator', section.id);
        }
      }
    }
  }

  // Validate onSubmitActions (optional)
  for (const action of template.onSubmitActions ?? []) {
    if (!ACTION_TYPES.includes(action.type)) {
      push('On-submit actions contain an invalid action type');
    }
  }

  // Validate automations (optional)
  for (const auto of template.automations ?? []) {
    const autoName = auto.name || 'Untitled automation';
    if (!auto.name || auto.name.trim().length === 0) {
      push('Automation needs a name');
    }

    if (!auto.trigger?.type || !TRIGGER_TYPES.includes(auto.trigger.type)) {
      push(`${autoName}: invalid trigger`);
    }

    if (auto.trigger?.type === 'list_item_full') {
      if (!auto.trigger.fieldId) {
        push(`${autoName}: "List item full" trigger requires a field`);
      } else if (
        !allFieldIds.has(auto.trigger.fieldId) ||
        fieldTypeById.get(auto.trigger.fieldId) !== 'list_item'
      ) {
        push(`${autoName}: trigger references a missing or wrong-type field`);
      }
    }

    if (auto.trigger?.type === 'vote_threshold') {
      if (
        typeof auto.trigger.threshold !== 'number' ||
        auto.trigger.threshold < 1
      ) {
        push(`${autoName}: "Vote threshold" requires a threshold >= 1`);
      }
    }

    if (!auto.actions || auto.actions.length === 0) {
      push(`${autoName}: needs at least one action`);
    }

    for (const action of auto.actions ?? []) {
      if (!ACTION_TYPES.includes(action.type)) {
        push(`${autoName}: has an invalid action type`);
      }
      if (
        ['notify_members', 'notify_organizers', 'notify_submitter'].includes(
          action.type
        ) &&
        !action.message
      ) {
        push(`${autoName}: notification action needs a message`);
      }
      if (action.type === 'create_post' && (!action.title || !action.message)) {
        push(`${autoName}: create post action needs a title and message`);
      }
      if (action.type === 'send_webhook' && !action.webhookUrl) {
        push(`${autoName}: webhook action needs a URL`);
      }
      if (action.type === 'set_addon_data' && !action.key) {
        push(`${autoName}: set data action needs a key`);
      }
      if (
        action.recipientToggleField &&
        !allFieldIds.has(action.recipientToggleField)
      ) {
        push(`${autoName}: recipient filter references a missing field`);
      }
    }

    for (const cond of auto.conditions ?? []) {
      if (!cond.field) {
        push(`${autoName}: has a condition without a field`);
      } else if (cond.field.startsWith('fields.')) {
        const refId = cond.field.slice('fields.'.length);
        if (!allFieldIds.has(refId)) {
          push(`${autoName}: condition references a missing field`);
        }
      }
      if (!CONDITION_OPERATORS.includes(cond.operator)) {
        push(`${autoName}: has an invalid condition operator`);
      }
    }
  }

  const errorMessages = errors.map(e => e.message);
  return { valid: errors.length === 0, errors, errorMessages };
}

// ===== YAML Conversion =====

/**
 * Serialize a template to a YAML string.
 * Strips internal-only fields (ids are kept for roundtrip fidelity).
 */
export function templateToYaml(template: CustomAddonTemplate): string {
  return YAML.stringify(template, {
    lineWidth: 0, // don't wrap long lines
    defaultKeyType: 'PLAIN',
    defaultStringType: 'PLAIN',
  });
}

/**
 * Parse a YAML string into a template object.
 * Returns null if the YAML is invalid.
 */
export function yamlToTemplate(
  yamlString: string
):
  | { template: CustomAddonTemplate; error: null }
  | { template: null; error: string } {
  try {
    const parsed = YAML.parse(yamlString);
    if (typeof parsed !== 'object' || parsed === null) {
      return { template: null, error: 'YAML must be an object' };
    }
    return { template: parsed as CustomAddonTemplate, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid YAML';
    return { template: null, error: message };
  }
}
