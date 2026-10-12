/** Shared public-contract examples, reusable by client and REST adapter tests. */
export interface GDLConformanceFixture {
  name: string;
  input: string;
  referenceDate: string;
  timeZone: string;
  expected: Array<{ start: string; end?: string; note?: string }>;
}

export const GDL_CONFORMANCE_FIXTURES: GDLConformanceFixture[] = [
  {
    name: 'stepped start-time range',
    input: 'Fr@(18,22,2)',
    referenceDate: '2026-01-05T12:00:00Z',
    timeZone: 'UTC',
    expected: [
      { start: '2026-01-09T18:00:00.000Z' },
      { start: '2026-01-09T20:00:00.000Z' },
      { start: '2026-01-09T22:00:00.000Z' },
    ],
  },
  {
    name: 'duration range',
    input: 'Fr@7^(2h,4h)',
    referenceDate: '2026-01-05T12:00:00Z',
    timeZone: 'UTC',
    expected: [
      { start: '2026-01-09T07:00:00.000Z', end: '2026-01-09T09:00:00.000Z' },
      { start: '2026-01-09T07:00:00.000Z', end: '2026-01-09T10:00:00.000Z' },
      { start: '2026-01-09T07:00:00.000Z', end: '2026-01-09T11:00:00.000Z' },
    ],
  },
  {
    name: 'duration range with minute steps',
    input: 'Fr@7^(30m,90m,30m)',
    referenceDate: '2026-01-05T12:00:00Z',
    timeZone: 'UTC',
    expected: [
      { start: '2026-01-09T07:00:00.000Z', end: '2026-01-09T07:30:00.000Z' },
      { start: '2026-01-09T07:00:00.000Z', end: '2026-01-09T08:00:00.000Z' },
      { start: '2026-01-09T07:00:00.000Z', end: '2026-01-09T08:30:00.000Z' },
    ],
  },
  {
    name: 'descending time range crosses midnight',
    input: 'Fr@(22,2)',
    referenceDate: '2026-01-05T12:00:00Z',
    timeZone: 'UTC',
    expected: [
      { start: '2026-01-09T22:00:00.000Z' },
      { start: '2026-01-09T23:00:00.000Z' },
      { start: '2026-01-10T00:00:00.000Z' },
      { start: '2026-01-10T01:00:00.000Z' },
      { start: '2026-01-10T02:00:00.000Z' },
    ],
  },
  {
    name: 'stepped overnight range stops before overshooting',
    input: 'Fr@(22,3,2)',
    referenceDate: '2026-01-05T12:00:00Z',
    timeZone: 'UTC',
    expected: [
      { start: '2026-01-09T22:00:00.000Z' },
      { start: '2026-01-10T00:00:00.000Z' },
      { start: '2026-01-10T02:00:00.000Z' },
    ],
  },
  {
    name: 'overnight starts keep their following-day duration',
    input: 'Fr@(22,2,2)^2h',
    referenceDate: '2026-01-05T12:00:00Z',
    timeZone: 'UTC',
    expected: [
      { start: '2026-01-09T22:00:00.000Z', end: '2026-01-10T00:00:00.000Z' },
      { start: '2026-01-10T00:00:00.000Z', end: '2026-01-10T02:00:00.000Z' },
      { start: '2026-01-10T02:00:00.000Z', end: '2026-01-10T04:00:00.000Z' },
    ],
  },
  {
    name: 'reference instant is already Friday in UTC',
    input: 'Th@18',
    referenceDate: '2026-01-02T02:00:00Z',
    timeZone: 'UTC',
    expected: [{ start: '2026-01-08T18:00:00.000Z' }],
  },
  {
    name: 'same reference instant is still Thursday in New York',
    input: 'Th@18',
    referenceDate: '2026-01-02T02:00:00Z',
    timeZone: 'America/New_York',
    expected: [{ start: '2026-01-01T23:00:00.000Z' }],
  },
  {
    name: 'weekly recurrence keeps local 09:00 across spring transition',
    input: 'Su*3@9',
    referenceDate: '2026-03-01T05:00:00Z',
    timeZone: 'America/New_York',
    expected: [
      { start: '2026-03-01T14:00:00.000Z' },
      { start: '2026-03-08T13:00:00.000Z' },
      { start: '2026-03-15T13:00:00.000Z' },
    ],
  },
  {
    name: 'duration uses elapsed hours over spring transition',
    input: '03/08@1:30^2h',
    referenceDate: '2026-03-01T05:00:00Z',
    timeZone: 'America/New_York',
    expected: [
      { start: '2026-03-08T06:30:00.000Z', end: '2026-03-08T08:30:00.000Z' },
    ],
  },
  {
    name: 'span resolves its explicit wall clock endpoint over spring transition',
    input: '03/08@1:30-3:30',
    referenceDate: '2026-03-01T05:00:00Z',
    timeZone: 'America/New_York',
    expected: [
      { start: '2026-03-08T06:30:00.000Z', end: '2026-03-08T07:30:00.000Z' },
    ],
  },
  {
    name: 'duration uses elapsed hours over autumn transition',
    input: '11/01@0:30^3h',
    referenceDate: '2026-10-25T04:00:00Z',
    timeZone: 'America/New_York',
    expected: [
      { start: '2026-11-01T04:30:00.000Z', end: '2026-11-01T07:30:00.000Z' },
    ],
  },
  {
    name: 'span retains wall clock endpoint over autumn transition',
    input: '11/01@0:30-3:30',
    referenceDate: '2026-10-25T04:00:00Z',
    timeZone: 'America/New_York',
    expected: [
      { start: '2026-11-01T04:30:00.000Z', end: '2026-11-01T08:30:00.000Z' },
    ],
  },
  {
    name: 'Lord Howe recurrence follows a half-hour offset change',
    input: 'Su*3@9',
    referenceDate: '2026-09-26T14:00:00Z',
    timeZone: 'Australia/Lord_Howe',
    expected: [
      { start: '2026-09-26T22:30:00.000Z' },
      { start: '2026-10-03T22:00:00.000Z' },
      { start: '2026-10-10T22:00:00.000Z' },
    ],
  },
  {
    name: 'Lord Howe duration crosses a half-hour spring gap',
    input: '10/04@1:45^1h',
    referenceDate: '2026-10-01T00:00:00Z',
    timeZone: 'Australia/Lord_Howe',
    expected: [
      { start: '2026-10-03T15:15:00.000Z', end: '2026-10-03T16:15:00.000Z' },
    ],
  },
  {
    name: 'Apia duration crosses a skipped calendar day',
    input: '12/29@12^24h',
    referenceDate: '2011-12-01T00:00:00Z',
    timeZone: 'Pacific/Apia',
    expected: [
      { start: '2011-12-29T22:00:00.000Z', end: '2011-12-30T22:00:00.000Z' },
    ],
  },
  {
    name: 'all-day dates start at midnight in the supplied timezone',
    input: '03/07',
    referenceDate: '2026-03-01T05:00:00Z',
    timeZone: 'America/New_York',
    expected: [{ start: '2026-03-07T05:00:00.000Z' }],
  },
  {
    name: 'notes and deduplication survive consolidation',
    input: 'Fr@18 + Fr@18 "setup + cleanup"',
    referenceDate: '2026-01-05T12:00:00Z',
    timeZone: 'UTC',
    expected: [{ start: '2026-01-09T18:00:00.000Z', note: 'setup + cleanup' }],
  },
];

export const GDL_ERROR_FIXTURES = [
  {
    name: 'New York spring gap',
    input: '03/08@2:30',
    referenceDate: '2026-03-01T05:00:00Z',
    timeZone: 'America/New_York',
    occurrence: '2026-03-08',
    localTime: '02:30',
    kind: 'nonexistent',
  },
  {
    name: 'New York autumn fold',
    input: '11/01@1:30',
    referenceDate: '2026-10-25T04:00:00Z',
    timeZone: 'America/New_York',
    occurrence: '2026-11-01',
    localTime: '01:30',
    kind: 'ambiguous',
  },
  {
    name: 'later recurrence in spring gap',
    input: 'Su*2@2:30',
    referenceDate: '2026-03-01T05:00:00Z',
    timeZone: 'America/New_York',
    occurrence: '2026-03-08',
    localTime: '02:30',
    kind: 'nonexistent',
  },
  {
    name: 'span endpoint in spring gap',
    input: '03/08@1:30-2:30',
    referenceDate: '2026-03-01T05:00:00Z',
    timeZone: 'America/New_York',
    occurrence: '2026-03-08',
    localTime: '02:30',
    kind: 'nonexistent',
  },
  {
    name: 'Lord Howe half-hour spring gap',
    input: '10/04@2:15',
    referenceDate: '2026-10-01T00:00:00Z',
    timeZone: 'Australia/Lord_Howe',
    occurrence: '2026-10-04',
    localTime: '02:15',
    kind: 'nonexistent',
  },
  {
    name: 'Lord Howe half-hour autumn fold',
    input: '04/05@1:45',
    referenceDate: '2026-04-01T00:00:00Z',
    timeZone: 'Australia/Lord_Howe',
    occurrence: '2026-04-05',
    localTime: '01:45',
    kind: 'ambiguous',
  },
  {
    name: 'Apia skipped date',
    input: '12/30@12',
    referenceDate: '2011-12-01T00:00:00Z',
    timeZone: 'Pacific/Apia',
    occurrence: '2011-12-30',
    localTime: '12:00',
    kind: 'nonexistent',
  },
] as const;
