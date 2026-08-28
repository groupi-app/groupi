import { describe, expect, it } from 'vitest';

import {
  getAvailabilityVoteCounts,
  getAvailabilityVotePercentages,
  rankAvailabilityOptions,
} from './date-voting';

describe('date voting utilities', () => {
  it('counts every response and preserves pending space in the vote bar', () => {
    const counts = getAvailabilityVoteCounts([
      { status: 'YES' },
      { status: 'YES' },
      { status: 'MAYBE' },
      { status: 'NO' },
      { status: 'PENDING' },
    ]);

    expect(counts).toEqual({
      yes: 2,
      maybe: 1,
      no: 1,
      pending: 1,
      total: 5,
    });
    expect(getAvailabilityVotePercentages(counts)).toEqual({
      yes: 40,
      maybe: 20,
      no: 20,
      pending: 20,
    });
  });

  it('returns an empty distribution when nobody has responded', () => {
    expect(
      getAvailabilityVotePercentages(getAvailabilityVoteCounts([]))
    ).toEqual({ yes: 0, maybe: 0, no: 0, pending: 0 });
  });

  it('ranks by yes/maybe score and skips a position after a tie', () => {
    const ranked = rankAvailabilityOptions([
      {
        id: 'later-tie',
        dateTime: 300,
        availabilities: [{ status: 'YES' as const }],
      },
      {
        id: 'winner',
        dateTime: 200,
        availabilities: [
          { status: 'YES' as const },
          { status: 'MAYBE' as const },
        ],
      },
      {
        id: 'earlier-tie',
        dateTime: 100,
        availabilities: [
          { status: 'MAYBE' as const },
          { status: 'MAYBE' as const },
        ],
      },
      {
        id: 'last',
        dateTime: 400,
        availabilities: [{ status: 'MAYBE' as const }],
      },
    ]);

    expect(ranked.map(option => [option.id, option.rank])).toEqual([
      ['winner', 1],
      ['earlier-tie', 2],
      ['later-tie', 2],
      ['last', 4],
    ]);
  });
});
