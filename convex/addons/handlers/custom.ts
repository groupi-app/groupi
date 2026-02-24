import { defineAddonHandler } from '../define';
import { ADDON_TYPES } from '../types';
import {
  isValidAutomations,
  isValidAction,
  isValidCondition,
} from '../automations/types';
import type {
  Automation,
  AutomationAction,
  AutomationCondition,
} from '../automations/types';

// ===== Template Validation =====

const FIELD_TYPES = [
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

type FieldType = (typeof FIELD_TYPES)[number];

type SummaryType =
  | 'response_count'
  | 'vote_leader'
  | 'signup_progress'
  | 'custom_text';

const SUMMARY_TYPES: SummaryType[] = [
  'response_count',
  'vote_leader',
  'signup_progress',
  'custom_text',
];

type CalloutVariant = 'info' | 'warning' | 'success';

const CALLOUT_VARIANTS: CalloutVariant[] = ['info', 'warning', 'success'];

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const BUTTON_VARIANTS: ButtonVariant[] = [
  'default',
  'secondary',
  'outline',
  'destructive',
];

const DISPLAY_FIELD_TYPES: FieldType[] = [
  'action_button',
  'static_text',
  'dynamic_summary',
  'divider',
  'info_callout',
];

interface ListItem {
  id: string;
  name: string;
  quantity: number;
}

interface TemplateField {
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
  textFormat?: string;
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

type SectionLayout = 'form' | 'interactive';

const SECTION_LAYOUTS: SectionLayout[] = ['form', 'interactive'];

const FORM_FIELD_TYPES: FieldType[] = [
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

const INTERACTIVE_FIELD_TYPES: FieldType[] = [
  'vote',
  'list_item',
  'toggle',
  'action_button',
  'static_text',
  'dynamic_summary',
  'divider',
  'info_callout',
];

interface TemplateSection {
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

interface TemplateSettings {
  requiresCompletion?: boolean;
  cardLinkLabel?: string;
  cardSubtitle?: string;
  cardOnly?: boolean;
}

interface CustomAddonTemplate {
  name: string;
  description: string;
  iconName: string;
  settings?: TemplateSettings;
  sections: TemplateSection[];
  submitButtonLabel?: string;
  onSubmitActions?: AutomationAction[];
  automations?: Automation[];
}

interface CustomAddonConfig {
  templateId: string;
  template: CustomAddonTemplate;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isValidField(field: unknown): field is TemplateField {
  if (typeof field !== 'object' || field === null) return false;
  const f = field as Record<string, unknown>;

  if (!isNonEmptyString(f.id)) return false;
  if (typeof f.required !== 'boolean') return false;
  if (!isNonEmptyString(f.type)) return false;
  if (!FIELD_TYPES.includes(f.type as FieldType)) return false;
  if (f.configurable !== undefined && typeof f.configurable !== 'boolean')
    return false;

  const fieldType = f.type as FieldType;
  const isDisplay = DISPLAY_FIELD_TYPES.includes(fieldType);
  const isConfigurable = f.configurable === true;

  // Display fields don't require a label; input fields do
  if (!isDisplay && !isNonEmptyString(f.label)) return false;

  // Validate type-specific fields
  switch (fieldType) {
    case 'text':
      if (
        f.variant !== undefined &&
        f.variant !== 'short' &&
        f.variant !== 'long'
      )
        return false;
      if (
        f.maxLength !== undefined &&
        (typeof f.maxLength !== 'number' || f.maxLength < 1)
      )
        return false;
      break;

    case 'number':
      if (f.min !== undefined && typeof f.min !== 'number') return false;
      if (f.max !== undefined && typeof f.max !== 'number') return false;
      if (f.min !== undefined && f.max !== undefined && f.min > f.max)
        return false;
      break;

    case 'select':
    case 'multiselect':
      if (isConfigurable) {
        // Configurable fields allow empty or missing options (organizer fills in)
        if (f.options !== undefined && !Array.isArray(f.options)) return false;
        if (
          Array.isArray(f.options) &&
          f.options.length > 0 &&
          !f.options.every(
            (o: unknown) => typeof o === 'string' && o.length > 0
          )
        )
          return false;
      } else {
        if (!Array.isArray(f.options) || f.options.length < 2) return false;
        if (
          !f.options.every(
            (o: unknown) => typeof o === 'string' && o.length > 0
          )
        )
          return false;
      }
      break;

    case 'vote':
      if (isConfigurable) {
        if (f.options !== undefined && !Array.isArray(f.options)) return false;
        if (
          Array.isArray(f.options) &&
          f.options.length > 0 &&
          !f.options.every(
            (o: unknown) => typeof o === 'string' && o.length > 0
          )
        )
          return false;
      } else {
        if (!Array.isArray(f.options) || f.options.length < 2) return false;
        if (
          !f.options.every(
            (o: unknown) => typeof o === 'string' && o.length > 0
          )
        )
          return false;
      }
      if (f.allowMultiple !== undefined && typeof f.allowMultiple !== 'boolean')
        return false;
      if (f.showResults !== undefined && typeof f.showResults !== 'boolean')
        return false;
      // Optional inline actions
      if (f.actions !== undefined) {
        if (!Array.isArray(f.actions)) return false;
        for (const a of f.actions) {
          if (!isValidAction(a)) return false;
        }
      }
      break;

    case 'list_item':
      if (isConfigurable) {
        // Configurable list_item allows empty or missing items (organizer fills in)
        if (f.items !== undefined) {
          if (!Array.isArray(f.items)) return false;
          for (const item of f.items) {
            if (typeof item !== 'object' || item === null) return false;
            const i = item as Record<string, unknown>;
            if (!isNonEmptyString(i.id)) return false;
            if (typeof i.name !== 'string') return false;
            if (typeof i.quantity !== 'number' || i.quantity < 1) return false;
          }
        }
      } else {
        if (!Array.isArray(f.items) || f.items.length === 0) return false;
        for (const item of f.items) {
          if (typeof item !== 'object' || item === null) return false;
          const i = item as Record<string, unknown>;
          if (!isNonEmptyString(i.id)) return false;
          if (!isNonEmptyString(i.name)) return false;
          if (typeof i.quantity !== 'number' || i.quantity < 1) return false;
        }
      }
      // Optional inline actions
      if (f.actions !== undefined) {
        if (!Array.isArray(f.actions)) return false;
        for (const a of f.actions) {
          if (!isValidAction(a)) return false;
        }
      }
      break;

    case 'action_button':
      if (!isNonEmptyString(f.buttonLabel)) return false;
      if (
        f.buttonVariant !== undefined &&
        !BUTTON_VARIANTS.includes(f.buttonVariant as ButtonVariant)
      )
        return false;
      if (!Array.isArray(f.actions) || f.actions.length === 0) return false;
      for (const a of f.actions) {
        if (!isValidAction(a)) return false;
      }
      break;

    case 'toggle':
      if (
        f.defaultEnabled !== undefined &&
        typeof f.defaultEnabled !== 'boolean'
      )
        return false;
      // Optional inline actions
      if (f.actions !== undefined) {
        if (!Array.isArray(f.actions)) return false;
        for (const a of f.actions) {
          if (!isValidAction(a)) return false;
        }
      }
      break;

    case 'yesno':
      // No extra fields needed
      break;

    case 'static_text':
      if (!isNonEmptyString(f.content)) return false;
      if (
        f.textFormat !== undefined &&
        (typeof f.textFormat !== 'string' ||
          !['p', 'h1', 'h2', 'h3'].includes(f.textFormat))
      )
        return false;
      break;

    case 'dynamic_summary':
      if (
        !isNonEmptyString(f.summaryType) ||
        !SUMMARY_TYPES.includes(f.summaryType as SummaryType)
      )
        return false;
      break;

    case 'divider':
      // No required content
      break;

    case 'info_callout':
      if (!isNonEmptyString(f.calloutMessage)) return false;
      if (
        f.calloutVariant !== undefined &&
        !CALLOUT_VARIANTS.includes(f.calloutVariant as CalloutVariant)
      )
        return false;
      break;
  }

  // Validate visibilityConditions (optional)
  if (f.visibilityConditions !== undefined) {
    if (!Array.isArray(f.visibilityConditions)) return false;
    for (const c of f.visibilityConditions) {
      if (!isValidCondition(c)) return false;
    }
  }

  return true;
}

function isValidSection(section: unknown): section is TemplateSection {
  if (typeof section !== 'object' || section === null) return false;
  const s = section as Record<string, unknown>;

  if (!isNonEmptyString(s.id)) return false;
  if (!isNonEmptyString(s.title)) return false;
  if (s.description !== undefined && typeof s.description !== 'string')
    return false;
  if (s.configurable !== undefined && typeof s.configurable !== 'boolean')
    return false;
  if (s.layout !== undefined) {
    if (typeof s.layout !== 'string') return false;
    if (!SECTION_LAYOUTS.includes(s.layout as SectionLayout)) return false;
  }
  if (s.allowedFieldTypes !== undefined) {
    if (!Array.isArray(s.allowedFieldTypes)) return false;
    for (const ft of s.allowedFieldTypes) {
      if (!FIELD_TYPES.includes(ft as FieldType)) return false;
    }
  }

  const isConfigurable = s.configurable === true;

  if (isConfigurable) {
    // Configurable sections allow empty fields array
    if (s.fields !== undefined) {
      if (!Array.isArray(s.fields)) return false;
      if (!s.fields.every(isValidField)) return false;
    }
  } else {
    if (!Array.isArray(s.fields) || s.fields.length === 0) return false;
    if (!s.fields.every(isValidField)) return false;
  }

  // Validate fields are allowed for this section's layout
  if (Array.isArray(s.fields)) {
    const allowedForLayout =
      s.layout === 'interactive' ? INTERACTIVE_FIELD_TYPES : FORM_FIELD_TYPES;
    for (const f of s.fields) {
      const fieldType = (f as { type: string }).type as FieldType;
      if (!allowedForLayout.includes(fieldType)) return false;
    }
  }

  // Validate section-level visibilityConditions (optional)
  if (s.visibilityConditions !== undefined) {
    if (!Array.isArray(s.visibilityConditions)) return false;
    for (const c of s.visibilityConditions) {
      if (!isValidCondition(c)) return false;
    }
  }

  return true;
}

function isValidTemplate(template: unknown): template is CustomAddonTemplate {
  if (typeof template !== 'object' || template === null) return false;
  const t = template as Record<string, unknown>;

  if (!isNonEmptyString(t.name)) return false;
  if (typeof t.name === 'string' && t.name.length > 60) return false;
  if (!isNonEmptyString(t.description)) return false;
  if (typeof t.description === 'string' && t.description.length > 200)
    return false;
  if (!isNonEmptyString(t.iconName)) return false;

  // Validate settings (optional)
  if (t.settings !== undefined) {
    if (typeof t.settings !== 'object' || t.settings === null) return false;
    const s = t.settings as Record<string, unknown>;
    if (
      s.requiresCompletion !== undefined &&
      typeof s.requiresCompletion !== 'boolean'
    )
      return false;
    if (s.cardLinkLabel !== undefined && typeof s.cardLinkLabel !== 'string')
      return false;
    if (s.cardSubtitle !== undefined && typeof s.cardSubtitle !== 'string')
      return false;
    if (s.cardOnly !== undefined && typeof s.cardOnly !== 'boolean')
      return false;
  }

  // Validate sections
  if (!Array.isArray(t.sections) || t.sections.length === 0) return false;

  if (!t.sections.every(isValidSection)) return false;

  // Validate submitButtonLabel (optional)
  if (
    t.submitButtonLabel !== undefined &&
    typeof t.submitButtonLabel !== 'string'
  )
    return false;

  // Validate onSubmitActions (optional)
  if (t.onSubmitActions !== undefined) {
    if (!Array.isArray(t.onSubmitActions)) return false;
    for (const a of t.onSubmitActions) {
      if (!isValidAction(a)) return false;
    }
  }

  // Validate automations (optional)
  if (t.automations !== undefined) {
    if (!isValidAutomations(t.automations)) return false;
  }

  return true;
}

/**
 * Validate the config for a custom addon.
 * Config must contain { templateId: string, template: CustomAddonTemplate }.
 */
export function isValidCustomConfig(
  config: unknown
): config is CustomAddonConfig {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;

  if (!isNonEmptyString(c.templateId)) return false;

  return isValidTemplate(c.template);
}

// Export for use in template mutations
export { isValidTemplate };
export type {
  CustomAddonTemplate,
  CustomAddonConfig,
  TemplateSection,
  TemplateField,
  TemplateSettings,
  ListItem,
  FieldType,
};

// ===== Handler =====

/**
 * Custom addon handler — trusted because automations need:
 * - ctx.rawCtx.scheduler.runAfter() for webhook actions
 * - ctx.rawCtx.db for system post creation and event description updates
 * - Access to internal mutations/actions
 */
export const customAddonHandler = defineAddonHandler({
  type: ADDON_TYPES.CUSTOM,
  trusted: true,

  validateConfig: isValidCustomConfig,

  onEnabled: async (ctx, config) => {
    const template = extractTemplate(config);
    if (!template?.automations?.length) return;

    const { runAutomations } = await import('../automations/engine');
    await runAutomations(ctx, 'addon_enabled', {});
  },

  onConfigUpdated: async (ctx, _oldConfig, _newConfig) => {
    // Clear all existing responses when config changes
    await ctx.deleteAllAddonData();

    // Notify members that responses were cleared
    const person = await ctx.getAuthPerson();
    if (person) {
      await ctx.notifyEventMembers({
        type: 'ADDON_CONFIG_RESET',
        authorId: person._id,
      });
    }
  },

  onDisabled: async ctx => {
    await ctx.deleteAllAddonData();
  },

  onEventDeleted: async ctx => {
    await ctx.deleteAllAddonData();
  },

  onDataSubmitted: async (ctx, key, data, submitterId) => {
    const { runAutomationsForDataSubmission } = await import(
      '../automations/engine'
    );
    await runAutomationsForDataSubmission(ctx, key, data, submitterId);
  },

  onMemberJoined: async (ctx, personId) => {
    const { runAutomations } = await import('../automations/engine');
    await runAutomations(ctx, 'member_joined', { personId });
  },

  onMemberLeft: async (ctx, personId) => {
    const { runAutomations } = await import('../automations/engine');
    await runAutomations(ctx, 'member_left', { personId });
  },

  onDateChosen: async (ctx, chosenDateTime, _config) => {
    const { runAutomations } = await import('../automations/engine');
    await runAutomations(ctx, 'date_chosen', { chosenDateTime });
  },
});

// ===== Helpers =====

function extractTemplate(config: unknown): CustomAddonTemplate | null {
  if (typeof config !== 'object' || config === null) return null;
  const c = config as Record<string, unknown>;
  if (typeof c.template !== 'object' || c.template === null) return null;
  return c.template as CustomAddonTemplate;
}
