import {
  getBringListItems,
  getCustomAddonSummary,
  getQuestionnaireQuestions,
  REMINDER_OFFSETS,
} from './addon-contracts';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/** Placement is read-only: an unavailable saved feature is never disabled or rewritten. */
export function eventFeaturePresentation(addonType: string, config: unknown) {
  if (record(config)) {
    if (
      addonType === 'reminders' &&
      REMINDER_OFFSETS.some(offset => offset === config.reminderOffset)
    )
      return { kind: 'reminders' as const, title: 'Remind me' };
    if (
      addonType === 'questionnaire' &&
      Array.isArray(config.questions) &&
      config.questions.length > 0 &&
      getQuestionnaireQuestions(config).every(
        question =>
          question.id.trim() &&
          question.label.trim() &&
          (!['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(
            question.type
          ) ||
            (question.options && question.options.length > 0))
      ) &&
      getQuestionnaireQuestions(config).length === config.questions.length
    )
      return { kind: 'questionnaire' as const, title: 'Your details' };
    if (
      addonType === 'bring-list' &&
      Array.isArray(config.items) &&
      config.items.length > 0 &&
      getBringListItems(config).every(
        item => item.id.trim() && item.name.trim()
      ) &&
      getBringListItems(config).length === config.items.length
    )
      return { kind: 'bring-list' as const, title: 'What to bring' };
    if (
      addonType === 'discord' &&
      typeof config.guildId === 'string' &&
      config.guildId.trim()
    )
      return { kind: 'discord' as const, title: 'Discord connection' };
    if (addonType.startsWith('custom:')) {
      const summary = getCustomAddonSummary(config);
      if (summary) return { kind: 'custom' as const, title: summary.name };
    }
  }
  return { kind: 'unavailable' as const, title: 'Saved event feature' };
}

function equalConfig(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right))
    return (
      left.length === right.length &&
      left.every((value, index) => equalConfig(value, right[index]))
    );
  if (!record(left) || !record(right)) return false;
  const keys = Object.keys(left).sort(),
    other = Object.keys(right).sort();
  return (
    keys.length === other.length &&
    keys.every(
      (key, index) => key === other[index] && equalConfig(left[key], right[key])
    )
  );
}
export function participationResetWarnings(
  existing: { addonType: string; enabled: boolean; config: unknown }[],
  desired: Record<string, unknown>
) {
  return existing
    .filter(
      addon =>
        addon.enabled &&
        (addon.addonType === 'questionnaire' ||
          addon.addonType === 'bring-list') &&
        !equalConfig(addon.config, desired[addon.addonType])
    )
    .map(addon =>
      addon.addonType === 'questionnaire'
        ? 'saved questionnaire responses'
        : 'all saved Bring List claims'
    );
}
