import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  GDL_DAYS,
  GDL_EXAMPLES,
  GDL_SYMBOLS,
  GdlReferenceGuide,
} from './gdl-reference-guide';

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [
    node,
    ...Children.toArray(node.props.children as ReactNode).flatMap(child =>
      elements(child)
    ),
  ];
}

describe('GdlReferenceGuide', () => {
  it('covers the essential syntax from the web reference', () => {
    expect(GDL_DAYS.map(([day]) => day)).toEqual([
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa',
      'Su',
    ]);
    expect(GDL_SYMBOLS.map(([symbol]) => symbol)).toEqual([
      '@',
      '-',
      '^',
      '[ ]',
      '( )',
      '*',
      '+',
      '" "',
    ]);
  });

  it('lets an example populate the Smart Date field', () => {
    const onSelectExample = vi.fn();
    const tree = elements(
      GdlReferenceGuide({
        onClose: vi.fn(),
        onOpenFullGuide: vi.fn(),
        onSelectExample,
      })
    );
    const example = GDL_EXAMPLES[1];
    const exampleButton = tree.find(
      element =>
        element.props.accessibilityLabel ===
        `Use ${example.expression}: ${example.result}`
    );

    const selectExample = exampleButton?.props.onPress as
      | (() => void)
      | undefined;
    selectExample?.();

    expect(onSelectExample).toHaveBeenCalledWith(example.expression);
  });

  it('provides an accessible close action', () => {
    const onClose = vi.fn();
    const tree = elements(
      GdlReferenceGuide({
        onClose,
        onOpenFullGuide: vi.fn(),
        onSelectExample: vi.fn(),
      })
    );
    const closeButton = tree.find(
      element => element.props.accessibilityLabel === 'Close GDL reference'
    );

    const close = closeButton?.props.onPress as (() => void) | undefined;
    close?.();

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('opens the full web reference from the footer link', () => {
    const onOpenFullGuide = vi.fn();
    const tree = elements(
      GdlReferenceGuide({
        onClose: vi.fn(),
        onOpenFullGuide,
        onSelectExample: vi.fn(),
      })
    );
    const fullGuideLink = tree.find(
      element =>
        element.props.accessibilityLabel ===
        'Open the full GDL guide in a web browser'
    );

    const openFullGuide = fullGuideLink?.props.onPress as
      | (() => void)
      | undefined;
    openFullGuide?.();

    expect(onOpenFullGuide).toHaveBeenCalledOnce();
  });
});
