import { MutationCtx } from '../../_generated/server';
import { Id } from '../../_generated/dataModel';
import { type AddonHandler, ADDON_TYPES } from '../types';
import { notifyEventMembers } from '../../lib/notifications';
import { requireAuth } from '../../auth';

/**
 * Valid question types for the questionnaire addon.
 */
const QUESTION_TYPES = [
  'SHORT_ANSWER',
  'LONG_ANSWER',
  'MULTIPLE_CHOICE',
  'CHECKBOXES',
  'NUMBER',
  'DROPDOWN',
  'YES_NO',
] as const;

type QuestionType = (typeof QUESTION_TYPES)[number];

/** Types that require an options array */
const CHOICE_TYPES: QuestionType[] = [
  'MULTIPLE_CHOICE',
  'CHECKBOXES',
  'DROPDOWN',
];

interface Question {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
}

interface QuestionnaireConfig {
  questions: Question[];
}

function isValidQuestionnaireConfig(
  config: unknown
): config is QuestionnaireConfig {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;

  if (!Array.isArray(c.questions) || c.questions.length === 0) return false;

  for (const q of c.questions) {
    if (typeof q !== 'object' || q === null) return false;
    const question = q as Record<string, unknown>;

    // Required fields
    if (typeof question.id !== 'string' || question.id.length === 0)
      return false;
    if (typeof question.label !== 'string' || question.label.length === 0)
      return false;
    if (typeof question.required !== 'boolean') return false;
    if (
      typeof question.type !== 'string' ||
      !QUESTION_TYPES.includes(question.type as QuestionType)
    )
      return false;

    // Choice types must have non-empty options
    if (CHOICE_TYPES.includes(question.type as QuestionType)) {
      if (!Array.isArray(question.options) || question.options.length === 0)
        return false;
      if (!question.options.every((o: unknown) => typeof o === 'string'))
        return false;
    }
  }

  return true;
}

/**
 * Delete all addonData rows for a given event+addonType.
 */
async function clearAllResponses(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  addonType: string
) {
  const entries = await ctx.db
    .query('addonData')
    .withIndex('by_event_addon', q =>
      q.eq('eventId', eventId).eq('addonType', addonType)
    )
    .collect();

  for (const entry of entries) {
    await ctx.db.delete(entry._id);
  }
}

export const questionnaireHandler: AddonHandler = {
  type: ADDON_TYPES.QUESTIONNAIRE,

  validateConfig: (config: unknown): boolean => {
    return isValidQuestionnaireConfig(config);
  },

  onConfigUpdated: async (
    ctx: MutationCtx,
    eventId: Id<'events'>,
    _oldConfig: unknown,
    _newConfig: unknown
  ) => {
    // Clear all existing responses when config changes
    await clearAllResponses(ctx, eventId, ADDON_TYPES.QUESTIONNAIRE);

    // Notify members that responses were cleared
    const { person } = await requireAuth(ctx);
    await notifyEventMembers(ctx, {
      eventId,
      type: 'ADDON_CONFIG_RESET',
      authorId: person._id,
    });
  },

  onDisabled: async (ctx: MutationCtx, eventId: Id<'events'>) => {
    await clearAllResponses(ctx, eventId, ADDON_TYPES.QUESTIONNAIRE);
  },

  onEventDeleted: async (ctx: MutationCtx, eventId: Id<'events'>) => {
    await clearAllResponses(ctx, eventId, ADDON_TYPES.QUESTIONNAIRE);
  },
};
