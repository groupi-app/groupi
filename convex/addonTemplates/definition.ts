import { z } from '@hono/zod-openapi';
import { isValidTemplate, isValidField } from '../addons/handlers/custom';
import {
  isValidAction,
  CONDITION_OPERATORS,
  TRIGGER_TYPES,
} from '../addons/automations/types';

const text = z.string().max(10000);
const id = z
  .string()
  .min(1)
  .max(100)
  .refine(
    value =>
      /^[\x20-\x7e]+$/.test(value) &&
      !value.startsWith('$') &&
      !['__proto__', 'prototype', 'constructor'].includes(value),
    'Identifier must be printable ASCII, must not start with $, and must not be a reserved object key'
  );
const condition = z
  .object({
    field: text.min(1),
    operator: z.enum(CONDITION_OPERATORS),
    value: z.unknown().optional(),
  })
  .strict();
// Webhooks are deliberately not accepted until their runtime has a safe outbound boundary.
const action = z
  .object({
    type: z.enum(
      [
        'notify_members',
        'notify_organizers',
        'notify_submitter',
        'create_post',
        'update_event_description',
        'set_addon_data',
      ],
      {
        error:
          'Unsupported action; send_webhook is not supported by definition authoring',
      }
    ),
    message: text.optional(),
    title: text.optional(),
    key: text.optional(),
    data: z.unknown().optional(),
    recipientToggleField: id.optional(),
  })
  .strict()
  .refine(isValidAction, 'Invalid action configuration');
const fieldTypes = [
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
const field = z
  .object({
    id,
    type: z.enum(fieldTypes),
    label: text.optional(),
    required: z.boolean(),
    configurable: z.boolean().optional(),
    variant: z.enum(['short', 'long']).optional(),
    placeholder: text.optional(),
    maxLength: z.number().int().positive().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    options: z.array(text.min(1)).max(100).optional(),
    minSelections: z.number().int().nonnegative().optional(),
    maxSelections: z.number().int().nonnegative().optional(),
    items: z
      .array(
        z
          .object({ id, name: text, quantity: z.number().int().positive() })
          .strict()
      )
      .max(100)
      .optional(),
    allowMultiple: z.boolean().optional(),
    showResults: z.boolean().optional(),
    content: text.optional(),
    textFormat: z.enum(['p', 'h1', 'h2', 'h3']).optional(),
    summaryType: z
      .enum(['response_count', 'vote_leader', 'signup_progress', 'custom_text'])
      .optional(),
    summaryLabel: text.optional(),
    dividerLabel: text.optional(),
    calloutVariant: z.enum(['info', 'warning', 'success']).optional(),
    calloutMessage: text.optional(),
    buttonLabel: text.optional(),
    buttonVariant: z
      .enum(['default', 'secondary', 'outline', 'destructive'])
      .optional(),
    defaultEnabled: z.boolean().optional(),
    actions: z.array(action).max(50).optional(),
    visibilityConditions: z.array(condition).max(50).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!isValidField(value)) {
      const guidance: Partial<Record<typeof value.type, string>> = {
        select:
          'Select fields require a label and at least two options unless configurable',
        multiselect:
          'Multiselect fields require a label and at least two options unless configurable',
        vote: 'Vote fields require a label and at least two options unless configurable',
        list_item:
          'List fields require a label and valid items unless configurable',
        action_button:
          'Action buttons require buttonLabel and at least one valid action',
        static_text: 'Static text fields require content',
        dynamic_summary: 'Dynamic summary fields require summaryType',
        info_callout: 'Info callout fields require calloutMessage',
        number: 'Number fields require a label and min must not exceed max',
      };
      ctx.addIssue({
        code: 'custom',
        message:
          guidance[value.type] ??
          'Invalid field configuration; check its label and type-specific settings',
      });
    }
    if (value.options && new Set(value.options).size !== value.options.length)
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Options must be unique',
      });
    if (value.type !== 'multiselect') return;
    if (value.required && value.maxSelections === 0)
      ctx.addIssue({
        code: 'custom',
        path: ['maxSelections'],
        message:
          'Required multiselect fields must allow at least one selection',
      });
    if (
      value.minSelections !== undefined &&
      value.maxSelections !== undefined &&
      value.minSelections > value.maxSelections
    )
      ctx.addIssue({
        code: 'custom',
        path: ['minSelections'],
        message: 'Minimum selections must not exceed maximum selections',
      });
    // Configurable fields may leave choices empty until the organizer supplies them.
    if (value.options && value.options.length > 0) {
      if (
        value.minSelections !== undefined &&
        value.minSelections > value.options.length
      )
        ctx.addIssue({
          code: 'custom',
          path: ['minSelections'],
          message: 'Minimum selections must not exceed the number of options',
        });
      if (
        value.maxSelections !== undefined &&
        value.maxSelections > value.options.length
      )
        ctx.addIssue({
          code: 'custom',
          path: ['maxSelections'],
          message: 'Maximum selections must not exceed the number of options',
        });
    }
  });
const template = z
  .object({
    name: z.string().min(1).max(60),
    description: z.string().min(1).max(200),
    iconName: id,
    settings: z
      .object({
        requiresCompletion: z.boolean().optional(),
        cardLinkLabel: text.optional(),
        cardSubtitle: text.optional(),
        cardOnly: z.boolean().optional(),
      })
      .strict()
      .optional(),
    sections: z
      .array(
        z
          .object({
            id,
            title: text,
            description: text.optional(),
            layout: z.enum(['form', 'interactive']).optional(),
            fields: z.array(field).max(100),
            configurable: z.boolean().optional(),
            allowedFieldTypes: z.array(z.enum(fieldTypes)).optional(),
            visibilityConditions: z.array(condition).max(50).optional(),
          })
          .strict()
          .superRefine((section, ctx) => {
            if (!section.configurable && section.fields.length === 0)
              ctx.addIssue({
                code: 'custom',
                path: ['fields'],
                message: 'Non-configurable sections require at least one field',
              });
          })
      )
      .min(1)
      .max(50),
    submitButtonLabel: text.optional(),
    onSubmitActions: z.array(action).max(50).optional(),
    automations: z
      .array(
        z
          .object({
            id,
            name: text.min(1),
            enabled: z.boolean(),
            trigger: z
              .object({
                type: z.enum(TRIGGER_TYPES),
                fieldId: id.optional(),
                threshold: z.number().int().positive().optional(),
              })
              .strict(),
            conditions: z.array(condition).max(50),
            actions: z.array(action).min(1).max(50),
          })
          .strict()
      )
      .max(50)
      .optional(),
  })
  .strict()
  .refine(isValidTemplate, 'Invalid complete template configuration');

function safeJson(value: unknown, depth = 0): boolean {
  if (depth > 30) return false;
  if (!value || typeof value !== 'object') return true;
  return Object.entries(value).every(
    ([key, item]) =>
      key.length <= 1024 &&
      !key.startsWith('$') &&
      /^[\x20-\x7e]*$/.test(key) &&
      !['__proto__', 'constructor', 'prototype'].includes(key) &&
      safeJson(item, depth + 1)
  );
}
export const DefinitionDocumentSchema = z
  .object({
    schemaVersion: z.literal(1),
    name: z
      .string()
      .min(1)
      .max(60)
      .refine(value => value.trim().length > 0, 'Name is required'),
    description: z.string().max(200),
    iconName: id,
    template,
  })
  .strict()
  .superRefine((doc, ctx) => {
    if (
      !safeJson(doc) ||
      new TextEncoder().encode(JSON.stringify(doc)).byteLength > 64 * 1024
    )
      ctx.addIssue({
        code: 'custom',
        message: 'Definition is unsafe or exceeds 64 KiB of UTF-8 JSON',
      });
    const sections = doc.template.sections;
    const fields = sections.flatMap(section => section.fields);
    const unique = (ids: string[]) => new Set(ids).size === ids.length;
    if (
      !unique(sections.map(s => s.id)) ||
      !unique(fields.map(f => f.id)) ||
      !unique((doc.template.automations ?? []).map(a => a.id)) ||
      !unique(fields.flatMap(f => (f.items ?? []).map(i => i.id)))
    )
      ctx.addIssue({
        code: 'custom',
        message:
          'Section, field, item and automation identifiers must be unique',
      });
  });
