import { describe, expect, it, vi } from 'vitest';

import { mergeSmartDateOptions } from './multi-date-options';

describe('mergeSmartDateOptions', () => {
  it('adds unique Smart Date results and keeps options chronological', () => {
    const existingStart = new Date('2030-06-20T18:00:00Z');
    const existingEnd = new Date('2030-06-20T20:00:00Z');
    const earlierStart = new Date('2030-06-18T18:00:00Z');
    const createId = vi.fn(() => 'smart-1');

    const result = mergeSmartDateOptions(
      [
        {
          id: 'existing',
          date: existingStart,
          endDate: existingEnd,
        },
      ],
      [
        { start: existingStart, end: existingEnd },
        { start: earlierStart },
        { start: earlierStart },
      ],
      createId
    );

    expect(result.addedCount).toBe(1);
    expect(createId).toHaveBeenCalledOnce();
    expect(result.options).toEqual([
      { id: 'smart-1', date: earlierStart, endDate: undefined },
      { id: 'existing', date: existingStart, endDate: existingEnd },
    ]);
  });
});
