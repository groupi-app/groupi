import { evaluateVisibilityConditions } from '../../packages/shared/src/utils/addon-visibility';
import type { AutomationCondition } from './automations/types';
/** Validate app-supported submissions before persisting or running automations. */
type Field = {
  id: string;
  type: string;
  required?: boolean;
  visibilityConditions?: AutomationCondition[];
  options?: string[];
  min?: number;
  max?: number;
  maxLength?: number;
  minSelections?: number;
  maxSelections?: number;
  allowMultiple?: boolean;
  items?: { id: string; quantity: number }[];
};
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Submission must be a JSON object');
  return value as Record<string, unknown>;
}
function answers(fields: Field[], data: Record<string, unknown>) {
  if (Object.keys(data).some(id => !fields.some(f => f.id === id)))
    throw new Error('Unknown response field');
  for (const f of fields) {
    const value = data[f.id];
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && !value.length)
    ) {
      if (f.required) throw new Error(`Required answer: ${f.id}`);
      continue;
    }
    let valid = false;
    switch (f.type) {
      case 'SHORT_ANSWER':
      case 'LONG_ANSWER':
      case 'text':
        valid =
          typeof value === 'string' &&
          (f.maxLength === undefined || value.length <= f.maxLength);
        break;
      case 'NUMBER':
      case 'number':
        valid =
          typeof value === 'number' &&
          Number.isFinite(value) &&
          (f.min === undefined || value >= f.min) &&
          (f.max === undefined || value <= f.max);
        break;
      case 'YES_NO':
      case 'yesno':
        valid = typeof value === 'boolean';
        break;
      case 'MULTIPLE_CHOICE':
      case 'DROPDOWN':
      case 'select':
        valid = typeof value === 'string' && !!f.options?.includes(value);
        break;
      case 'CHECKBOXES':
      case 'multiselect':
        valid =
          Array.isArray(value) &&
          value.every(v => typeof v === 'string' && f.options?.includes(v)) &&
          new Set(value).size === value.length &&
          (f.minSelections === undefined || value.length >= f.minSelections) &&
          (f.maxSelections === undefined || value.length <= f.maxSelections);
        break;
    }
    if (!valid) throw new Error(`Invalid answer: ${f.id}`);
  }
}
export function validateParticipationData(
  type: string,
  configValue: unknown,
  key: string,
  value: unknown,
  personId: string
) {
  const config = object(configValue);
  const data = object(value);
  if (type === 'questionnaire') {
    if (key !== `response:${personId}`)
      throw new Error('Use your own questionnaire response');
    answers(config.questions as Field[], data);
  } else if (
    type === 'bring-list' ||
    (type.startsWith('custom:') && key === `claims:${personId}`)
  ) {
    if (key !== `claims:${personId}`) throw new Error('Use your own claims');
    const fields = type.startsWith('custom:')
      ? (object(config.template).sections as { fields: Field[] }[]).flatMap(
          s => s.fields
        )
      : [];
    const items =
      type === 'bring-list'
        ? (config.items as { id: string; quantity: number }[])
        : fields
            .filter(f => f.type === 'list_item')
            .flatMap(f => f.items ?? []);
    for (const [id, quantity] of Object.entries(data)) {
      const item = items.find(i => i.id === id);
      if (
        !item ||
        typeof quantity !== 'number' ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > item.quantity
      )
        throw new Error(`Invalid claim quantity for ${id}`);
    }
  } else if (type.startsWith('custom:')) {
    const sections = object(config.template).sections as {
      layout?: string;
      visibilityConditions?: AutomationCondition[];
      fields: Field[];
    }[];
    const fields = sections.flatMap(s => s.fields);
    if (key === `response:${personId}`) {
      answers(
        sections
          .filter(
            s =>
              s.layout !== 'interactive' &&
              evaluateVisibilityConditions(s.visibilityConditions, data)
          )
          .flatMap(s => s.fields)
          .filter(f =>
            ['text', 'number', 'select', 'multiselect', 'yesno'].includes(
              f.type
            )
          )
          .filter(f =>
            evaluateVisibilityConditions(f.visibilityConditions, data)
          ),
        data
      );
    } else {
      const field = fields.find(f => key === `${f.type}:${f.id}:${personId}`);
      if (field?.type === 'vote') {
        if (
          Object.keys(data).length !== 1 ||
          !Array.isArray(data.options) ||
          data.options.some(
            v => typeof v !== 'string' || !field.options?.includes(v)
          ) ||
          new Set(data.options).size !== data.options.length ||
          (!field.allowMultiple && data.options.length > 1)
        )
          throw new Error('Invalid vote options');
      } else if (field?.type === 'toggle') {
        if (Object.keys(data).length !== 1 || typeof data.enabled !== 'boolean')
          throw new Error('Toggle needs enabled:boolean');
      } else throw new Error('Unknown or unsupported participant field');
    }
  } else throw new Error('This add-on has no participant data submission');
}

export function claimItems(
  type: string,
  configValue: unknown
): { id: string; quantity: number }[] {
  const config = object(configValue);
  if (type === 'bring-list')
    return config.items as { id: string; quantity: number }[];
  if (!type.startsWith('custom:')) return [];
  return (object(config.template).sections as { fields: Field[] }[])
    .flatMap(s => s.fields)
    .filter(f => f.type === 'list_item')
    .flatMap(f => f.items ?? []);
}
