import { describe, expect, it } from 'vitest';
import { readPaginated } from '../src/pagination.js';
import { CliError } from '../src/errors.js';

describe('paginated reads', () => {
  it.each([null, 'next'])(
    'rejects an oversized bounded page before continuation (nextCursor=%s)',
    async nextCursor => {
      let requests = 0;
      await expect(
        readPaginated({
          limit: 1,
          fetchPage: async () => {
            requests++;
            return { items: ['one', 'two'], nextCursor };
          },
          projectItem: item => item,
        })
      ).rejects.toMatchObject({ code: 'INVALID_RESPONSE', exitCode: 5 });
      expect(requests).toBe(1);
    }
  );
  it.each(
    [
      null,
      undefined,
      [],
      'page',
      {},
      { items: {}, nextCursor: null },
      { items: [] },
      { items: [], nextCursor: '' },
      { items: [], nextCursor: 1 },
    ].map(page => ({ page }))
  )('rejects malformed page envelopes: $page', async ({ page }) => {
    await expect(
      readPaginated({
        limit: 1,
        fetchPage: async () => page,
        projectItem: item => item,
      })
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE', exitCode: 5 });
  });
  it.each([
    { page: null },
    { page: { items: [] } },
    { page: { items: [], nextCursor: '' } },
    { page: { items: 'invalid', nextCursor: null } },
    { page: { items: ['two', 'three'], nextCursor: null } },
    { page: { items: ['two', 'three'], nextCursor: 'more' } },
  ])(
    'rejects the entire retrieval for a malformed later page: $page',
    async ({ page }) => {
      let requests = 0;
      await expect(
        readPaginated({
          limit: 1,
          all: true,
          fetchPage: async () =>
            ++requests === 1 ? { items: ['one'], nextCursor: 'next' } : page,
          projectItem: item => item,
        })
      ).rejects.toMatchObject({ code: 'INVALID_RESPONSE', exitCode: 5 });
      expect(requests).toBe(2);
    }
  );
  it.each(['start', 'middle'])(
    'stops a longer cursor cycle returning to %s',
    async repeatedCursor => {
      const requests: unknown[] = [];
      const pages = [
        { items: ['one'], nextCursor: 'middle' },
        { items: [], nextCursor: 'last' },
        { items: ['two'], nextCursor: repeatedCursor },
      ];
      await expect(
        readPaginated({
          limit: 1,
          cursor: 'start',
          all: true,
          fetchPage: async request => {
            requests.push(request);
            return pages.shift();
          },
          projectItem: item => item,
        })
      ).rejects.toMatchObject({ code: 'INVALID_RESPONSE', exitCode: 5 });
      expect(requests).toEqual([
        { cursor: 'start', limit: 1 },
        { cursor: 'middle', limit: 1 },
        { cursor: 'last', limit: 1 },
      ]);
    }
  );
  it.each([
    { failurePage: 1, source: 'item' },
    { failurePage: 2, source: 'item' },
    { failurePage: 1, source: 'transport' },
    { failurePage: 2, source: 'transport' },
  ])(
    'propagates $source errors from page $failurePage without a partial result',
    async ({ failurePage, source }) => {
      const error = new CliError(
        source === 'item' ? 'INVALID_RESPONSE' : 'NETWORK_ERROR',
        'Original failure',
        5
      );
      let requests = 0;
      await expect(
        readPaginated({
          limit: 1,
          all: true,
          fetchPage: async () => {
            requests++;
            if (requests === failurePage && source === 'transport') throw error;
            return {
              items: [requests === failurePage ? null : 'valid'],
              nextCursor: requests === 1 ? 'next' : null,
            };
          },
          projectItem: item => {
            if (typeof item !== 'string') throw error;
            return item;
          },
        })
      ).rejects.toBe(error);
      expect(requests).toBe(failurePage);
    }
  );
  it('accepts an empty terminal first page', async () => {
    await expect(
      readPaginated({
        limit: 20,
        all: true,
        fetchPage: async () => ({ items: [], nextCursor: null }),
        projectItem: item => item,
      })
    ).resolves.toEqual({ items: [], nextCursor: null });
  });
  it.each([false, true])(
    'rejects a repeated starting cursor before returning or continuing (all=%s)',
    async all => {
      let requests = 0;
      await expect(
        readPaginated({
          limit: 1,
          cursor: 'start',
          all,
          fetchPage: async () => {
            requests++;
            if (requests > 1) throw Error('Unexpected continuation');
            return { items: [], nextCursor: 'start' };
          },
          projectItem: item => item,
        })
      ).rejects.toMatchObject({ code: 'INVALID_RESPONSE', exitCode: 5 });
      expect(requests).toBe(1);
    }
  );
  it('follows empty continuing pages, preserves order and duplicates, and completes on an empty page', async () => {
    const requests: unknown[] = [];
    const pages = [
      { items: ['one', 'one'], nextCursor: 'empty' },
      { items: [], nextCursor: 'more' },
      { items: ['two'], nextCursor: 'end' },
      { items: [], nextCursor: null },
    ];
    const result = await readPaginated({
      limit: 2,
      all: true,
      fetchPage: async request => {
        requests.push(request);
        return pages.shift();
      },
      projectItem: item => item,
    });
    expect(result).toEqual({ items: ['one', 'one', 'two'], nextCursor: null });
    expect(requests).toEqual([
      { cursor: undefined, limit: 2 },
      { cursor: 'empty', limit: 2 },
      { cursor: 'more', limit: 2 },
      { cursor: 'end', limit: 2 },
    ]);
  });
  it('returns one projected page and its continuation from a supplied cursor', async () => {
    const requests: unknown[] = [];
    const result = await readPaginated({
      limit: 2,
      cursor: 'start',
      fetchPage: async request => {
        requests.push(request);
        return { items: ['one', 'two'], nextCursor: 'next' };
      },
      projectItem: item => String(item).toUpperCase(),
    });
    expect(result).toEqual({ items: ['ONE', 'TWO'], nextCursor: 'next' });
    expect(requests).toEqual([{ cursor: 'start', limit: 2 }]);
  });
});
