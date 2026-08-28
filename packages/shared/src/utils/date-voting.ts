export type AvailabilityVoteStatus = 'YES' | 'MAYBE' | 'NO' | 'PENDING';

interface AvailabilityVoteLike {
  status: AvailabilityVoteStatus;
}

interface DateOptionLike<TAvailability extends AvailabilityVoteLike> {
  dateTime: number;
  availabilities: readonly TAvailability[];
}

export interface AvailabilityVoteCounts {
  yes: number;
  maybe: number;
  no: number;
  pending: number;
  total: number;
}

export function getAvailabilityVoteCounts(
  availabilities: readonly AvailabilityVoteLike[]
): AvailabilityVoteCounts {
  const counts: AvailabilityVoteCounts = {
    yes: 0,
    maybe: 0,
    no: 0,
    pending: 0,
    total: availabilities.length,
  };

  for (const availability of availabilities) {
    switch (availability.status) {
      case 'YES':
        counts.yes += 1;
        break;
      case 'MAYBE':
        counts.maybe += 1;
        break;
      case 'NO':
        counts.no += 1;
        break;
      case 'PENDING':
        counts.pending += 1;
        break;
    }
  }

  return counts;
}

export function getAvailabilityVotePercentages(counts: AvailabilityVoteCounts) {
  if (counts.total === 0) {
    return { yes: 0, maybe: 0, no: 0, pending: 0 };
  }

  return {
    yes: (counts.yes / counts.total) * 100,
    maybe: (counts.maybe / counts.total) * 100,
    no: (counts.no / counts.total) * 100,
    pending: (counts.pending / counts.total) * 100,
  };
}

/**
 * Rank date options using the same scoring as the web app: yes = 2,
 * maybe = 1, and no/pending = 0. Competition ranking skips positions
 * after ties (1, 1, 3).
 */
export function rankAvailabilityOptions<
  TAvailability extends AvailabilityVoteLike,
  TOption extends DateOptionLike<TAvailability>,
>(options: readonly TOption[]): Array<TOption & { rank: number }> {
  const scored = options
    .map(option => ({
      option,
      score: option.availabilities.reduce(
        (total, availability) =>
          total +
          (availability.status === 'YES'
            ? 2
            : availability.status === 'MAYBE'
              ? 1
              : 0),
        0
      ),
    }))
    .sort(
      (first, second) =>
        second.score - first.score ||
        first.option.dateTime - second.option.dateTime
    );

  let previousScore: number | undefined;
  let rank = 1;

  return scored.map(({ option, score }, index) => {
    if (index > 0 && score < (previousScore ?? score)) {
      rank = index + 1;
    }
    previousScore = score;
    return { ...option, rank };
  });
}
