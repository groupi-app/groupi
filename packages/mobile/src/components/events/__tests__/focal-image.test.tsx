import { isValidElement, type ReactElement } from 'react';
import type { ImageProps, LayoutChangeEvent } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  states: [] as unknown[],
  stateIndex: 0,
  effects: [] as (() => void | (() => void))[],
  getSize: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...(await importOriginal<typeof import('react')>()),
  useState: (initial: unknown) => {
    const index = mocks.stateIndex++;
    if (!(index in mocks.states)) mocks.states[index] = initial;
    return [
      mocks.states[index],
      (value: unknown) => {
        mocks.states[index] = value;
      },
    ];
  },
  useMemo: (factory: () => unknown) => factory(),
  useEffect: (effect: () => void | (() => void)) => {
    mocks.effects.push(effect);
  },
}));

vi.mock('react-native', () => ({
  View: 'View',
  Image: Object.assign(() => null, { getSize: mocks.getSize }),
}));

import { FocalImage } from '../focal-image';

function render(uri = 'https://example.com/cover.jpg') {
  mocks.stateIndex = 0;
  return FocalImage({ uri, focalPoint: { x: 1, y: 0.5 } });
}

function layout(width: number, height: number) {
  render().props.onLayout({
    nativeEvent: { layout: { width, height, x: 0, y: 0 } },
  } as LayoutChangeEvent);
}

function image(tree: ReturnType<typeof render>) {
  expect(isValidElement(tree.props.children)).toBe(true);
  return tree.props.children as ReactElement<ImageProps>;
}

describe('FocalImage image sizing', () => {
  beforeEach(() => {
    mocks.states = [];
    mocks.stateIndex = 0;
    mocks.effects = [];
    mocks.getSize.mockReset();
  });

  it('waits for both the real layout and source dimensions before decoding', () => {
    expect(render().props.children).toBeNull();
    mocks.effects[0]();
    mocks.getSize.mock.calls[0][1](2400, 1200);
    expect(render().props.children).toBeNull();

    layout(360, 240);
    const cover = image(render());
    expect(cover.props.style).toMatchObject({
      width: 480,
      height: 240,
      left: -120,
      top: 0,
    });
  });

  it('does not mount a placeholder-sized image while metadata is pending', () => {
    layout(360, 240);
    expect(render().props.children).toBeNull();
  });

  it('creates a fresh native image when the container grows', () => {
    render();
    mocks.effects[0]();
    mocks.getSize.mock.calls[0][1](2400, 1200);
    layout(360, 240);
    const first = image(render());
    layout(720, 480);
    const resized = image(render());

    expect(resized.key).not.toBe(first.key);
    expect(resized.props.style).toMatchObject({ width: 960, height: 480 });
  });

  it('never uses dimensions belonging to a different cover', () => {
    render();
    mocks.effects[0]();
    mocks.getSize.mock.calls[0][1](2400, 1200);
    layout(360, 240);
    image(render());
    expect(
      render('https://example.com/replacement.jpg').props.children
    ).toBeNull();
  });

  it('ignores metadata responses after the source effect is cleaned up', () => {
    render();
    const cleanup = mocks.effects[0]();
    cleanup?.();
    mocks.getSize.mock.calls[0][1](2400, 1200);
    layout(360, 240);
    expect(render().props.children).toBeNull();
  });

  it('still tries displaying the full measured cover if metadata lookup fails', () => {
    render();
    mocks.effects[0]();
    mocks.getSize.mock.calls[0][2]();
    layout(320, 180);
    expect(image(render()).props.style).toMatchObject({
      width: 320,
      height: 180,
    });
  });
});
