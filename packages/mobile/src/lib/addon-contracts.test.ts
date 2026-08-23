import { describe, expect, it } from 'vitest';
import {
  buildClaimSummaries,
  getBringListItems,
  getClaimsMap,
  getPersonClaims,
  getQuestionnaireAnswers,
  getQuestionnaireQuestions,
  getReminderOffset,
  isRequiredAnswerMissing,
  parseNumberAnswer,
  setClaimQuantity,
  toggleCheckboxAnswer,
} from './addon-contracts';

describe('questionnaire add-on contracts', () => {
  it('reads the canonical uppercase question types', () => {
    expect(
      getQuestionnaireQuestions({
        questions: [
          {
            id: 'diet',
            label: 'Dietary needs',
            type: 'CHECKBOXES',
            required: true,
            options: ['Vegetarian', 'Gluten-free'],
          },
          { id: 'invalid', label: 'Invalid', type: 'checkboxes' },
        ],
      })
    ).toEqual([
      {
        id: 'diet',
        label: 'Dietary needs',
        type: 'CHECKBOXES',
        required: true,
        options: ['Vegetarian', 'Gluten-free'],
      },
    ]);
  });

  it('preserves typed answers and removes unsafe array values', () => {
    expect(
      getQuestionnaireAnswers({
        name: 'Taylor',
        guests: 2,
        attending: false,
        diet: ['Vegetarian', 42, null],
        invalidNumber: Number.NaN,
        nested: { unsafe: true },
      })
    ).toEqual({
      name: 'Taylor',
      guests: 2,
      attending: false,
      diet: ['Vegetarian'],
    });
  });

  it('toggles checkbox arrays without trusting malformed stored data', () => {
    expect(toggleCheckboxAnswer('not-an-array', 'Vegetarian')).toEqual([
      'Vegetarian',
    ]);
    expect(toggleCheckboxAnswer(['Vegetarian', 42], 'Gluten-free')).toEqual([
      'Vegetarian',
      'Gluten-free',
    ]);
    expect(toggleCheckboxAnswer(['Vegetarian'], 'Vegetarian')).toEqual([]);
  });

  it('accepts false and zero as required answers', () => {
    const yesNoQuestion = {
      id: 'attending',
      label: 'Attending?',
      type: 'YES_NO' as const,
      required: true,
    };
    const numberQuestion = {
      id: 'guests',
      label: 'Guests',
      type: 'NUMBER' as const,
      required: true,
    };

    expect(isRequiredAnswerMissing(yesNoQuestion, false)).toBe(false);
    expect(isRequiredAnswerMissing(numberQuestion, 0)).toBe(false);
    expect(isRequiredAnswerMissing(numberQuestion, undefined)).toBe(true);
  });

  it('converts finite numeric input to canonical number answers', () => {
    expect(parseNumberAnswer('2.5')).toBe(2.5);
    expect(parseNumberAnswer('')).toBeUndefined();
    expect(parseNumberAnswer('not a number')).toBeUndefined();
  });
});

describe('reminder add-on contracts', () => {
  it('reads reminderOffset and supports every backend offset', () => {
    expect(getReminderOffset({ reminderOffset: '3_DAYS' })).toBe('3_DAYS');
    expect(getReminderOffset({ reminderTiming: '1_HOUR' })).toBe('1_DAY');
    expect(getReminderOffset({ reminderOffset: 'SOMETIME' })).toBe('1_DAY');
  });
});

describe('bring-list add-on contracts', () => {
  it('reads canonical item configs and drops malformed entries', () => {
    expect(
      getBringListItems({
        items: [
          { id: 'cups', name: 'Cups', quantity: 20 },
          { id: 'invalid', name: 'Invalid', quantity: 0 },
        ],
      })
    ).toEqual([{ id: 'cups', name: 'Cups', quantity: 20 }]);
  });

  it('reads one quantity map per person from claims keys', () => {
    const entries = [
      { key: 'claims:person-a', data: { cups: 4, ice: 1 } },
      { key: 'claims:person-b', data: { cups: 3 } },
      { key: 'claim:legacy', data: { cups: 100 } },
    ];

    expect(getPersonClaims(entries, 'person-a')).toEqual({ cups: 4, ice: 1 });
    expect(buildClaimSummaries(entries)).toEqual({
      cups: {
        totalClaimed: 7,
        claimants: [
          { personId: 'person-a', quantity: 4 },
          { personId: 'person-b', quantity: 3 },
        ],
      },
      ice: {
        totalClaimed: 1,
        claimants: [{ personId: 'person-a', quantity: 1 }],
      },
    });
  });

  it('ignores invalid claim quantities and removes zero claims', () => {
    expect(
      getClaimsMap({
        cups: 2,
        ice: 0,
        plates: -1,
        forks: 'four',
        spoons: 0.5,
      })
    ).toEqual({ cups: 2 });
    expect(setClaimQuantity({ cups: 2, ice: 1 }, 'cups', 0)).toEqual({
      ice: 1,
    });
    expect(setClaimQuantity({ cups: 2 }, 'cups', Number.NaN)).toEqual({});
  });
});
