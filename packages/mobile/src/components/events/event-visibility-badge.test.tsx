import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { describe, expect, it } from 'vitest';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';

import { EventVisibilityBadge } from './event-visibility-badge';

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [
    node,
    ...Children.toArray(node.props.children as ReactNode).flatMap(child =>
      elements(child)
    ),
  ];
}

describe('EventVisibilityBadge', () => {
  it('renders its label inside a native Text component', () => {
    const tree = elements(EventVisibilityBadge({ visibility: 'PUBLIC' }));
    const badge = tree.find(element => element.type === Badge);
    const label = tree.find(element => element.type === Text);

    expect(badge?.props.className).toBe('self-start');
    expect(label?.props.children).toBe('Public');
  });

  it.each([
    ['FRIENDS', 'Friends'],
    ['PRIVATE', 'Private'],
  ])('labels %s visibility as %s', (visibility, expected) => {
    const tree = elements(EventVisibilityBadge({ visibility }));
    const label = tree.find(element => element.type === Text);

    expect(label?.props.children).toBe(expected);
  });

  it('renders nothing when visibility is absent', () => {
    expect(EventVisibilityBadge({ visibility: undefined })).toBeNull();
  });
});
