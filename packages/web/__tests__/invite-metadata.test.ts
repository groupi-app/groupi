import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/(invite)/invite/[inviteId]/components/invite-details', () => ({
  InviteDetails: () => null,
}));
vi.mock('@/components/skeletons/invite-details-skeleton', () => ({
  InviteDetailsSkeleton: () => null,
}));

const chosenDateTime = Date.parse('2029-01-20T03:00:00Z');
const baseMeta = {
  title: 'Evening event',
  location: 'Main hall',
  chosenDateTime,
  chosenEndDateTime: null,
  creatorName: 'The host',
};

async function metadata(meta: object) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_CONVEX_SITE_URL', 'https://fixture.example');
  const fetchMeta = vi.fn().mockResolvedValue(Response.json(meta));
  vi.stubGlobal('fetch', fetchMeta);
  const { generateMetadata } = await import(
    '@/app/(invite)/invite/[inviteId]/page'
  );
  const result = await generateMetadata({
    params: Promise.resolve({ inviteId: 'fixture' }),
  });
  expect(fetchMeta).toHaveBeenCalledWith(
    'https://fixture.example/api/invite-meta/fixture',
    expect.anything()
  );
  expect(result.openGraph?.description).toBe(result.description);
  return result.description;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('invite OpenGraph dates', () => {
  it('uses the event timezone for both the date and time', async () => {
    expect(
      await metadata({
        ...baseMeta,
        timezone: 'America/New_York',
        chosenEndDateTime: Date.parse('2029-01-20T04:00:00Z'),
      })
    ).toBe(
      'Main hall · Fri, Jan 19, 2029, 10:00 PM EST - 11:00 PM EST · Hosted by The host'
    );
  });

  it('includes both dates when the event crosses midnight in its timezone', async () => {
    expect(
      await metadata({
        ...baseMeta,
        timezone: 'America/New_York',
        chosenEndDateTime: Date.parse('2029-01-20T05:30:00Z'),
      })
    ).toContain(
      'Fri, Jan 19, 2029, 10:00 PM EST - Sat, Jan 20, 2029, 12:30 AM EST'
    );
  });

  it('distinguishes repeated wall-clock times when the DST offset changes', async () => {
    expect(
      await metadata({
        ...baseMeta,
        timezone: 'America/New_York',
        chosenDateTime: Date.parse('2026-11-01T05:30:00Z'),
        chosenEndDateTime: Date.parse('2026-11-01T06:30:00Z'),
      })
    ).toContain('Sun, Nov 1, 2026, 1:30 AM EDT - 1:30 AM EST');
  });

  it.each([undefined, 'not-a-timezone'])(
    'uses explicit UTC when the saved zone is missing or invalid (%s)',
    async timezone => {
      expect(await metadata({ ...baseMeta, timezone })).toContain(
        'Sat, Jan 20, 2029, 3:00 AM UTC'
      );
    }
  );

  it('does not add a date when the event has no chosen time', async () => {
    expect(
      await metadata({
        ...baseMeta,
        timezone: 'America/New_York',
        chosenDateTime: null,
      })
    ).toBe('Main hall · Hosted by The host');
  });
});
