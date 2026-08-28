import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const gesture = {
    numberOfTaps: vi.fn(),
    onEnd: vi.fn(),
    onUpdate: vi.fn(),
  };
  gesture.numberOfTaps.mockReturnValue(gesture);
  gesture.onEnd.mockReturnValue(gesture);
  gesture.onUpdate.mockReturnValue(gesture);

  return { gesture };
});

vi.mock('react-native-reanimated', () => ({
  default: { View: 'AnimatedView' },
  runOnJS: (callback: () => void) => callback,
  useAnimatedStyle: (factory: () => object) => factory(),
  useSharedValue: (value: number) => ({ value }),
  withTiming: (value: number) => value,
}));

vi.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Exclusive: vi.fn(() => mocks.gesture),
    Pan: vi.fn(() => mocks.gesture),
    Pinch: vi.fn(() => mocks.gesture),
    Simultaneous: vi.fn(() => mocks.gesture),
    Tap: vi.fn(() => mocks.gesture),
  },
  GestureDetector: 'GestureDetector',
  GestureHandlerRootView: 'GestureHandlerRootView',
}));

import { ImageLightbox } from './image-lightbox';

function descendants(tree: ReactNode): ReactElement<Record<string, unknown>>[] {
  const matches: ReactElement<Record<string, unknown>>[] = [];
  for (const child of Children.toArray(tree)) {
    if (!isValidElement<Record<string, unknown>>(child)) continue;
    matches.push(child);
    matches.push(...descendants(child.props.children as ReactNode));
  }
  return matches;
}

describe('ImageLightbox', () => {
  it('keeps an accessible close target above the gesture surface', () => {
    const onClose = vi.fn();
    const tree = ImageLightbox({
      uri: 'https://example.com/event.jpg',
      visible: true,
      onClose,
    });
    const elements = descendants(tree);
    const gestureIndex = elements.findIndex(
      element => element.type === 'GestureDetector'
    );
    const closeIndex = elements.findIndex(
      element => element.props.accessibilityLabel === 'Close image viewer'
    );
    const closeButton = elements[closeIndex];

    expect(gestureIndex).toBeGreaterThanOrEqual(0);
    expect(closeIndex).toBeGreaterThan(gestureIndex);
    expect(
      elements.some(element => element.props.pointerEvents === 'box-none')
    ).toBe(true);
    expect(closeButton.props.hitSlop).toBe(8);

    (closeButton.props.onPress as () => void)();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
