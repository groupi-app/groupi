import { describe, expect, it } from 'vitest';
import {
  parseGDL,
  tokenizeGDL,
  isGDL,
  type DateTimeOption,
  type GDLResult,
  type Token,
} from './index';
import { GDL_CONFORMANCE_FIXTURES, GDL_ERROR_FIXTURES } from './fixtures';

function serialize(options: DateTimeOption[]) {
  return options.map(option => ({
    start: option.start.toISOString(),
    ...(option.end ? { end: option.end.toISOString() } : {}),
    ...(option.note ? { note: option.note } : {}),
  }));
}

describe('public GDL conformance', () => {
  it.each(GDL_CONFORMANCE_FIXTURES)('$name', fixture => {
    const referenceDate = new Date(fixture.referenceDate);
    const originalReference = referenceDate.getTime();
    const result: GDLResult = parseGDL(fixture.input, {
      referenceDate,
      timeZone: fixture.timeZone,
    });
    expect(result.success, JSON.stringify(result)).toBe(true);
    if (!result.success) throw new Error(result.error);
    expect(serialize(result.results)).toEqual(fixture.expected);
    expect(referenceDate.getTime()).toBe(originalReference);
  });

  it.each(GDL_ERROR_FIXTURES)(
    'rejects $name with its affected occurrence',
    fixture => {
      const result = parseGDL(fixture.input, {
        referenceDate: new Date(fixture.referenceDate),
        timeZone: fixture.timeZone,
      });
      expect(result.success).toBe(false);
      if (result.success)
        throw new Error('Expected an explicit civil-time error');
      expect(result.error).toMatch(
        fixture.kind === 'ambiguous'
          ? /ambiguous/i
          : /nonexistent|does not exist/i
      );
      expect(result.error).toContain(fixture.occurrence);
      expect(result.error).toContain(fixture.localTime);
      expect(result.error).toContain(fixture.timeZone);
      expect(result).not.toHaveProperty('results');
    }
  );

  it.each([
    [
      'invalid timezone',
      {
        referenceDate: new Date('2026-01-05T12:00:00Z'),
        timeZone: 'Not/A_Zone',
      },
    ],
    ['missing timezone', { referenceDate: new Date('2026-01-05T12:00:00Z') }],
    [
      'empty timezone',
      { referenceDate: new Date('2026-01-05T12:00:00Z'), timeZone: '' },
    ],
    [
      'invalid reference date',
      { referenceDate: new Date(NaN), timeZone: 'UTC' },
    ],
    ['missing reference date', { timeZone: 'UTC' }],
    [
      'string reference date',
      { referenceDate: '2026-01-05T12:00:00Z', timeZone: 'UTC' },
    ],
    ['missing context', undefined],
    ['null context', null],
  ])('reports %s instead of using host defaults or throwing', (_, context) => {
    const result = parseGDL('Fr@18', context as Parameters<typeof parseGDL>[1]);
    expect(result.success).toBe(false);
    if (result.success) throw new Error('Expected context validation error');
    expect(result.error.length).toBeGreaterThan(0);
  });

  it.each([
    '02/30@9',
    '13/01@9',
    'Fr@24',
    'Fr@12:60',
    'Fr@(22,2,0)',
    'Fr@7^(2h,4h,0h)',
  ])('rejects invalid date, time or step in %s', input => {
    expect(
      parseGDL(input, {
        referenceDate: new Date('2026-01-05T12:00:00Z'),
        timeZone: 'UTC',
      }).success
    ).toBe(false);
  });

  it('exports detection and tokens with original source positions', () => {
    const input = 'Fr@(22,2,2) "late + early"';
    expect(isGDL(input)).toBe(true);
    expect(isGDL('Friday evening')).toBe(false);
    const tokens: Token[] = tokenizeGDL(input);
    expect(tokens.map(token => token.value).join('')).toBe(input);
    for (const token of tokens)
      expect(input.slice(token.start, token.end)).toBe(token.value);
    expect(
      tokens.filter(token => token.type === 'note').map(token => token.value)
    ).toEqual(['"late + early"']);
    expect(tokens.some(token => token.type === 'error')).toBe(false);
  });
});

describe('bounded calendar expansion', () => {
  const context = {
    referenceDate: new Date('2026-03-01T05:00:00Z'),
    timeZone: 'America/New_York',
  };

  it('rejects enormous recurrence counts before expansion', () => {
    expect(parseGDL('Su*999999999999999999999@9', context).success).toBe(false);
  });

  it('resolves an overnight span endpoint as a civil time across a transition', () => {
    const result = parseGDL('03/07@23-3', context);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);
    expect(serialize(result.results)).toEqual([
      { start: '2026-03-08T04:00:00.000Z', end: '2026-03-08T07:00:00.000Z' },
    ]);
  });

  it('stops stepped weekday ranges before overshooting their endpoint', () => {
    const result = parseGDL('(Mo,Fr,3)@9', {
      referenceDate: new Date('2026-01-05T12:00:00Z'),
      timeZone: 'UTC',
    });
    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);
    expect(serialize(result.results)).toEqual([
      { start: '2026-01-05T09:00:00.000Z' },
      { start: '2026-01-08T09:00:00.000Z' },
    ]);
  });
});

it('resolves span endpoints after each overnight start', () => {
  const result = parseGDL('Fr@(22,2,2)-1', {
    referenceDate: new Date('2026-01-05T12:00:00Z'),
    timeZone: 'UTC',
  });
  if (!result.success) throw new Error(result.error);
  expect(serialize(result.results)).toEqual([
    { start: '2026-01-09T22:00:00.000Z', end: '2026-01-10T01:00:00.000Z' },
    { start: '2026-01-10T00:00:00.000Z', end: '2026-01-10T01:00:00.000Z' },
    { start: '2026-01-10T02:00:00.000Z', end: '2026-01-11T01:00:00.000Z' },
  ]);
});

it('rejects durations whose endpoint exceeds the Date range', () => {
  expect(
    parseGDL(`Fr@9^${'9'.repeat(300)}h`, {
      referenceDate: new Date('2026-01-05T12:00:00Z'),
      timeZone: 'UTC',
    }).success
  ).toBe(false);
});

it.each([
  '(1,2,Mo)@18',
  '(01/01,01/02,Mo)@18',
  '(Mo,Fr,Mo)@18',
  '(1,2,1/1)@18',
])('rejects nonnumeric day range steps without expansion: %s', input => {
  const result = parseGDL(input, {
    referenceDate: new Date('2026-01-05T12:00:00Z'),
    timeZone: 'UTC',
  });
  expect(result.success).toBe(false);
  if (result.success) throw new Error('Expected invalid step error');
  expect(result.error).toMatch(/step.*positive integer/i);
});
