export const QUESTION_TYPES = [
  'SHORT_ANSWER',
  'LONG_ANSWER',
  'MULTIPLE_CHOICE',
  'CHECKBOXES',
  'NUMBER',
  'DROPDOWN',
  'YES_NO',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface QuestionnaireQuestion {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
}

export type QuestionnaireAnswer = string | number | boolean | string[];
export type QuestionnaireAnswers = Record<string, QuestionnaireAnswer>;

export interface BringListItem {
  id: string;
  name: string;
  quantity: number;
}

export type ClaimsMap = Record<string, number>;

export const REMINDER_OFFSETS = [
  '30_MINUTES',
  '1_HOUR',
  '2_HOURS',
  '4_HOURS',
  '1_DAY',
  '2_DAYS',
  '3_DAYS',
  '1_WEEK',
  '2_WEEKS',
  '4_WEEKS',
] as const;

export type ReminderOffset = (typeof REMINDER_OFFSETS)[number];

export interface AddonDataEntry {
  key: string;
  data: unknown;
}

export interface Claimant {
  personId: string;
  quantity: number;
}

export interface ClaimSummary {
  totalClaimed: number;
  claimants: Claimant[];
}

export interface CustomAddonSummary {
  name: string;
  description: string;
  iconName?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getCustomAddonSummary(
  config: unknown
): CustomAddonSummary | null {
  if (!isRecord(config) || !isRecord(config.template)) return null;
  const { name, description, iconName } = config.template;
  if (typeof name !== 'string' || typeof description !== 'string') return null;

  return {
    name,
    description,
    ...(typeof iconName === 'string' ? { iconName } : {}),
  };
}

function isQuestionType(value: unknown): value is QuestionType {
  return (
    typeof value === 'string' && QUESTION_TYPES.includes(value as QuestionType)
  );
}

export function getQuestionnaireQuestions(
  config: unknown
): QuestionnaireQuestion[] {
  if (!isRecord(config) || !Array.isArray(config.questions)) return [];

  return config.questions.flatMap(question => {
    if (!isRecord(question)) return [];
    if (
      typeof question.id !== 'string' ||
      typeof question.label !== 'string' ||
      !isQuestionType(question.type) ||
      typeof question.required !== 'boolean'
    ) {
      return [];
    }

    const options = Array.isArray(question.options)
      ? question.options.filter(
          (option): option is string => typeof option === 'string'
        )
      : undefined;

    return [
      {
        id: question.id,
        label: question.label,
        type: question.type,
        required: question.required,
        ...(options ? { options } : {}),
      },
    ];
  });
}

export function getQuestionnaireAnswers(data: unknown): QuestionnaireAnswers {
  if (!isRecord(data)) return {};

  const answers: QuestionnaireAnswers = {};
  for (const [questionId, answer] of Object.entries(data)) {
    if (
      typeof answer === 'string' ||
      (typeof answer === 'number' && Number.isFinite(answer)) ||
      typeof answer === 'boolean'
    ) {
      answers[questionId] = answer;
      continue;
    }

    if (Array.isArray(answer)) {
      answers[questionId] = answer.filter(
        (option): option is string => typeof option === 'string'
      );
    }
  }

  return answers;
}

export function toggleCheckboxAnswer(
  currentValue: unknown,
  option: string
): string[] {
  const selected = Array.isArray(currentValue)
    ? currentValue.filter((value): value is string => typeof value === 'string')
    : [];

  return selected.includes(option)
    ? selected.filter(value => value !== option)
    : [...selected, option];
}

export function isRequiredAnswerMissing(
  question: QuestionnaireQuestion,
  answer: QuestionnaireAnswer | undefined
): boolean {
  if (!question.required) return false;
  if (answer === undefined) return true;
  if (typeof answer === 'string') return answer.trim().length === 0;
  if (question.type === 'CHECKBOXES') {
    return !Array.isArray(answer) || answer.length === 0;
  }
  return false;
}

export function parseNumberAnswer(value: string): number | undefined {
  if (value.trim() === '') return undefined;

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function getBringListItems(config: unknown): BringListItem[] {
  if (!isRecord(config) || !Array.isArray(config.items)) return [];

  return config.items.flatMap(item => {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.name !== 'string' ||
      typeof item.quantity !== 'number' ||
      !Number.isFinite(item.quantity) ||
      item.quantity < 1
    ) {
      return [];
    }

    return [
      {
        id: item.id,
        name: item.name,
        quantity: Math.floor(item.quantity),
      },
    ];
  });
}

export function getClaimsMap(data: unknown): ClaimsMap {
  if (!isRecord(data)) return {};

  const claims: ClaimsMap = {};
  for (const [itemId, quantity] of Object.entries(data)) {
    if (
      typeof quantity === 'number' &&
      Number.isFinite(quantity) &&
      quantity > 0
    ) {
      const normalizedQuantity = Math.floor(quantity);
      if (normalizedQuantity > 0) claims[itemId] = normalizedQuantity;
    }
  }
  return claims;
}

export function getPersonClaims(
  entries: AddonDataEntry[] | undefined,
  personId: string | undefined
): ClaimsMap {
  if (!entries || !personId) return {};

  const entry = entries.find(item => item.key === `claims:${personId}`);
  return getClaimsMap(entry?.data);
}

export function buildClaimSummaries(
  entries: AddonDataEntry[] | undefined
): Record<string, ClaimSummary> {
  const summaries: Record<string, ClaimSummary> = {};
  if (!entries) return summaries;

  for (const entry of entries) {
    if (!entry.key.startsWith('claims:')) continue;

    const personId = entry.key.slice('claims:'.length);
    if (!personId) continue;

    for (const [itemId, quantity] of Object.entries(getClaimsMap(entry.data))) {
      const summary = summaries[itemId] ?? {
        totalClaimed: 0,
        claimants: [],
      };
      summary.totalClaimed += quantity;
      summary.claimants.push({ personId, quantity });
      summaries[itemId] = summary;
    }
  }

  return summaries;
}

export function setClaimQuantity(
  currentClaims: ClaimsMap,
  itemId: string,
  quantity: number
): ClaimsMap {
  const next = { ...currentClaims };
  const normalizedQuantity = Number.isFinite(quantity)
    ? Math.max(0, Math.floor(quantity))
    : 0;

  if (normalizedQuantity === 0) {
    delete next[itemId];
  } else {
    next[itemId] = normalizedQuantity;
  }

  return next;
}

export function getReminderOffset(
  config: unknown,
  fallback: ReminderOffset = '1_DAY'
): ReminderOffset {
  if (!isRecord(config) || typeof config.reminderOffset !== 'string') {
    return fallback;
  }

  return REMINDER_OFFSETS.includes(config.reminderOffset as ReminderOffset)
    ? (config.reminderOffset as ReminderOffset)
    : fallback;
}
