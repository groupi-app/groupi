import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { describe, expect, it, vi } from 'vitest';

import { EventScopeToggle } from './event-scope-toggle';

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [
    node,
    ...Children.toArray(node.props.children as ReactNode).flatMap(child =>
      elements(child)
    ),
  ];
}

describe('EventScopeToggle', () => {
  it('marks the current scope and changes it when pressed', () => {
    const onChange = vi.fn();
    const tree = elements(EventScopeToggle({ value: 'all', onChange }));
    const allEvents = tree.find(
      element => element.props.accessibilityLabel === 'All Events'
    );
    const myEvents = tree.find(
      element => element.props.accessibilityLabel === 'My Events'
    );

    expect(allEvents?.props.accessibilityState).toEqual({ checked: true });
    expect(myEvents?.props.accessibilityState).toEqual({ checked: false });

    const selectMyEvents = myEvents?.props.onPress as (() => void) | undefined;
    selectMyEvents?.();
    expect(onChange).toHaveBeenCalledWith('mine');
  });
});
