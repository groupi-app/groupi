import { REMINDER_OFFSET_MS } from '@/lib/datetime-helpers';
import { FIELD_TYPES } from '../model/custom-addon-schema';
import { getCustomTemplate } from '../model/completion';

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Guard rendering of preserved/legacy configurations without rewriting them. */
export function canRenderParticipantFeature(type: string, value: unknown) {
  if (!record(value)) return false;
  switch (type) {
    case 'reminders':
      return (
        typeof value.reminderOffset === 'string' &&
        Object.hasOwn(REMINDER_OFFSET_MS, value.reminderOffset)
      );
    case 'bring-list':
      return (
        Array.isArray(value.items) &&
        value.items.every(
          item =>
            record(item) &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.quantity === 'number' &&
            Number.isFinite(item.quantity) &&
            item.quantity > 0
        )
      );
    case 'questionnaire':
      return (
        Array.isArray(value.questions) &&
        value.questions.every(
          question =>
            record(question) &&
            typeof question.id === 'string' &&
            typeof question.label === 'string' &&
            [
              'SHORT_ANSWER',
              'LONG_ANSWER',
              'MULTIPLE_CHOICE',
              'CHECKBOXES',
              'NUMBER',
              'DROPDOWN',
              'YES_NO',
            ].includes(String(question.type)) &&
            typeof question.required === 'boolean' &&
            (question.options === undefined ||
              (Array.isArray(question.options) &&
                question.options.every(option => typeof option === 'string')))
        )
      );
    case 'discord':
      return (
        typeof value.guildId === 'string' &&
        value.guildId.length > 0 &&
        typeof value.guildName === 'string'
      );
    default: {
      if (!type.startsWith('custom:')) return false;
      const template = getCustomTemplate(value);
      return Boolean(
        template &&
          template.sections.every(
            section =>
              record(section) &&
              typeof section.id === 'string' &&
              typeof section.title === 'string' &&
              Array.isArray(section.fields) &&
              section.fields.every(
                field =>
                  record(field) &&
                  typeof field.id === 'string' &&
                  typeof field.label === 'string' &&
                  FIELD_TYPES.includes(
                    field.type as (typeof FIELD_TYPES)[number]
                  )
              )
          )
      );
    }
  }
}
export function isPlanningFeature(type: string) {
  return type === 'reminders' || type === 'discord';
}

export function featureInCollection(
  type: string,
  config: unknown,
  collection: 'forms' | 'lists' | 'polls'
) {
  if (type === 'questionnaire') return collection === 'forms';
  if (type === 'bring-list') return collection === 'lists';
  if (!type.startsWith('custom:') || !record(config)) return false;
  const template = getCustomTemplate(config);
  if (!template || !canRenderParticipantFeature(type, config)) return false;
  if (collection === 'forms')
    return (
      Boolean(template.settings?.requiresCompletion) ||
      template.sections.some(
        section =>
          section.layout !== 'interactive' &&
          section.fields.some(field =>
            ['text', 'number', 'select', 'multiselect', 'yesno'].includes(
              field.type
            )
          )
      )
    );
  return template.sections.some(section =>
    section.fields.some(
      field => field.type === (collection === 'lists' ? 'list_item' : 'vote')
    )
  );
}

/** Only known public metadata may name an unavailable saved feature. */
export function participantFeatureTitle(type: string, config: unknown) {
  if (
    type.startsWith('custom:') &&
    record(config) &&
    record(config.template) &&
    typeof config.template.name === 'string' &&
    config.template.name.trim()
  )
    return config.template.name.trim().slice(0, 100);
  const names: Record<string, string> = {
    reminders: 'Reminders',
    questionnaire: 'Your details',
    'bring-list': 'What to bring',
    discord: 'Discord Event',
  };
  return names[type] ?? 'Saved event feature';
}
