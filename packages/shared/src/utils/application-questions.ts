/** Core admission questions share the existing questionnaire field vocabulary. */
export type ApplicationQuestion = {
  id: string;
  label: string;
  required: boolean;
  type:
    | 'SHORT_ANSWER'
    | 'LONG_ANSWER'
    | 'MULTIPLE_CHOICE'
    | 'CHECKBOXES'
    | 'NUMBER'
    | 'DROPDOWN'
    | 'YES_NO';
  options?: string[];
};
export type ApplicationAnswers = Record<
  string,
  string | number | boolean | string[]
>;
export function validateQuestions(questions: ApplicationQuestion[]) {
  if (questions.length > 50)
    throw new Error('At most 50 questions are supported');
  const ids = new Set<string>();
  for (const q of questions) {
    if (
      !q.id.trim() ||
      q.id.length > 100 ||
      ids.has(q.id) ||
      !q.label.trim() ||
      q.label.length > 1000
    )
      throw new Error('Invalid or duplicate question');
    ids.add(q.id);
    if (['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(q.type)) {
      if (
        !q.options?.length ||
        q.options.length > 100 ||
        q.options.some(o => !o.trim() || o.length > 500) ||
        new Set(q.options).size !== q.options.length
      )
        throw new Error('Invalid question options');
    } else if (q.options !== undefined)
      throw new Error('This question does not support options');
  }
}
export function validateAnswers(
  questions: ApplicationQuestion[],
  answers: ApplicationAnswers
) {
  if (Object.keys(answers).some(id => !questions.some(q => q.id === id)))
    throw new Error('Unknown response field');
  for (const q of questions) {
    const value = answers[q.id];
    if (
      value === undefined ||
      value === '' ||
      (typeof value === 'string' &&
        !value.trim() &&
        ['SHORT_ANSWER', 'LONG_ANSWER'].includes(q.type)) ||
      (Array.isArray(value) && value.length === 0)
    ) {
      if (q.required) throw new Error(`Required answer: ${q.id}`);
      continue;
    }
    const valid =
      q.type === 'YES_NO'
        ? typeof value === 'boolean'
        : q.type === 'NUMBER'
          ? typeof value === 'number' && Number.isFinite(value)
          : q.type === 'SHORT_ANSWER' || q.type === 'LONG_ANSWER'
            ? typeof value === 'string' &&
              value.length <= (q.type === 'SHORT_ANSWER' ? 1000 : 10000)
            : q.type === 'CHECKBOXES'
              ? Array.isArray(value) &&
                value.every(o => q.options?.includes(o)) &&
                new Set(value).size === value.length
              : typeof value === 'string' && !!q.options?.includes(value);
    if (!valid) throw new Error(`Invalid answer: ${q.id}`);
  }
}
