import { describe, expect, it } from 'vitest';

import {
  focalPointFromTouch,
  focalPointToObjectPosition,
  getContainedImageBounds,
  getCoverImageBounds,
  normalizeFocalPoint,
} from '../image-focal-point';

describe('image focal point utilities', () => {
  it('defaults invalid focal points to the center and clamps valid values', () => {
    expect(normalizeFocalPoint()).toEqual({ x: 0.5, y: 0.5 });
    expect(normalizeFocalPoint({ x: Number.NaN, y: 0.2 })).toEqual({
      x: 0.5,
      y: 0.5,
    });
    expect(normalizeFocalPoint({ x: -1, y: 2 })).toEqual({ x: 0, y: 1 });
  });

  it('formats a normalized focal point for native image positioning', () => {
    expect(focalPointToObjectPosition({ x: 0.25, y: 0.75 })).toBe('25% 75%');
  });

  it('calculates the visible bounds of a contained landscape image', () => {
    expect(getContainedImageBounds(1600, 900, 320, 320)).toEqual({
      left: 0,
      top: 70,
      width: 320,
      height: 180,
    });
  });

  it('maps touches to the actual contained image and clamps letterboxing', () => {
    const bounds = { left: 0, top: 70, width: 320, height: 180 };

    expect(focalPointFromTouch(80, 115, bounds)).toEqual({
      x: 0.25,
      y: 0.25,
    });
    expect(focalPointFromTouch(160, 20, bounds)).toEqual({ x: 0.5, y: 0 });
  });

  it('positions a cover image around the focal point without exposing gaps', () => {
    expect(getCoverImageBounds(1600, 900, 200, 200, { x: 0, y: 0.5 })).toEqual({
      left: 0,
      top: 0,
      width: 1600 / 4.5,
      height: 200,
    });
    expect(getCoverImageBounds(1600, 900, 200, 200, { x: 1, y: 0.5 })).toEqual({
      left: 200 - 1600 / 4.5,
      top: 0,
      width: 1600 / 4.5,
      height: 200,
    });
  });
});
