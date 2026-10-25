import { v } from 'convex/values';

// Participant answers, votes, toggles, claims and service metadata use these values.
export const answerValue = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
  v.array(v.string())
);
export const participantData = v.record(v.string(), answerValue);
export const addonData = v.union(v.string(), participantData);
const condition = v.object({
  field: v.string(),
  operator: v.union(
    ...(
      [
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
      ] as const
    ).map(x => v.literal(x))
  ),
  value: v.optional(answerValue),
});
const action = v.object({
  type: v.union(
    ...(
      [
        'notify_members',
        'notify_organizers',
        'notify_submitter',
        'create_post',
        'update_event_description',
        'send_webhook',
        'set_addon_data',
      ] as const
    ).map(x => v.literal(x))
  ),
  message: v.optional(v.string()),
  title: v.optional(v.string()),
  webhookUrl: v.optional(v.string()),
  webhookHeaders: v.optional(v.record(v.string(), v.string())),
  key: v.optional(v.string()),
  data: v.optional(addonData),
  recipientToggleField: v.optional(v.string()),
});
const fieldType = v.union(
  ...(
    [
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
    ] as const
  ).map(x => v.literal(x))
);
const item = v.object({
  id: v.string(),
  name: v.string(),
  quantity: v.number(),
});
const field = v.object({
  id: v.string(),
  type: fieldType,
  label: v.optional(v.string()),
  required: v.boolean(),
  configurable: v.optional(v.boolean()),
  variant: v.optional(v.union(v.literal('short'), v.literal('long'))),
  placeholder: v.optional(v.string()),
  maxLength: v.optional(v.number()),
  min: v.optional(v.number()),
  max: v.optional(v.number()),
  options: v.optional(v.array(v.string())),
  minSelections: v.optional(v.number()),
  maxSelections: v.optional(v.number()),
  items: v.optional(v.array(item)),
  allowMultiple: v.optional(v.boolean()),
  showResults: v.optional(v.boolean()),
  content: v.optional(v.string()),
  textFormat: v.optional(v.string()),
  summaryType: v.optional(
    v.union(
      ...(
        [
          'response_count',
          'vote_leader',
          'signup_progress',
          'custom_text',
        ] as const
      ).map(x => v.literal(x))
    )
  ),
  summaryLabel: v.optional(v.string()),
  dividerLabel: v.optional(v.string()),
  calloutVariant: v.optional(
    v.union(v.literal('info'), v.literal('warning'), v.literal('success'))
  ),
  calloutMessage: v.optional(v.string()),
  buttonLabel: v.optional(v.string()),
  buttonVariant: v.optional(
    v.union(
      ...(['default', 'secondary', 'outline', 'destructive'] as const).map(x =>
        v.literal(x)
      )
    )
  ),
  defaultEnabled: v.optional(v.boolean()),
  actions: v.optional(v.array(action)),
  visibilityConditions: v.optional(v.array(condition)),
});
export const template = v.object({
  name: v.string(),
  description: v.string(),
  iconName: v.string(),
  settings: v.optional(
    v.object({
      requiresCompletion: v.optional(v.boolean()),
      supportsOptOut: v.optional(v.boolean()),
      optOutLabel: v.optional(v.string()),
      cardLinkLabel: v.optional(v.string()),
      cardSubtitle: v.optional(v.string()),
      cardOnly: v.optional(v.boolean()),
    })
  ),
  sections: v.array(
    v.object({
      id: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      layout: v.optional(v.union(v.literal('form'), v.literal('interactive'))),
      fields: v.array(field),
      configurable: v.optional(v.boolean()),
      allowedFieldTypes: v.optional(v.array(fieldType)),
      visibilityConditions: v.optional(v.array(condition)),
    })
  ),
  submitButtonLabel: v.optional(v.string()),
  onSubmitActions: v.optional(v.array(action)),
  automations: v.optional(
    v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        enabled: v.boolean(),
        trigger: v.object({
          type: v.union(
            ...(
              [
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
              ] as const
            ).map(x => v.literal(x))
          ),
          fieldId: v.optional(v.string()),
          threshold: v.optional(v.number()),
        }),
        conditions: v.array(condition),
        actions: v.array(action),
      })
    )
  ),
});
export const definitionDocument = v.object({
  schemaVersion: v.literal(1),
  name: v.string(),
  description: v.string(),
  iconName: v.string(),
  template,
});
export const templateRecord = v.object({
  id: v.id('addonTemplates'),
  name: v.string(),
  description: v.string(),
  iconName: v.string(),
  template,
  version: v.number(),
  isPublished: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const addonConfig = v.union(
  v.object({ reminderOffset: v.string() }),
  v.object({ guildId: v.string(), guildName: v.string() }),
  v.object({ items: v.array(item) }),
  v.object({
    questions: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        type: v.union(
          ...(
            [
              'SHORT_ANSWER',
              'LONG_ANSWER',
              'MULTIPLE_CHOICE',
              'CHECKBOXES',
              'NUMBER',
              'DROPDOWN',
              'YES_NO',
            ] as const
          ).map(x => v.literal(x))
        ),
        required: v.boolean(),
        options: v.optional(v.array(v.string())),
      })
    ),
  }),
  v.object({ templateId: v.string(), template: v.optional(template) })
);

const { id: _templateId, ...templateRecordFields } = templateRecord.fields;
export const templateDocument = v.object({
  ...templateRecordFields,
  _id: v.id('addonTemplates'),
  _creationTime: v.number(),
  ownerId: v.id('persons'),
});
