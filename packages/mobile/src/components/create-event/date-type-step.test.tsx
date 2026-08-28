import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DateTypeStep } from './date-type-step';

vi.mock('uniwind', () => ({
  useCSSVariable: (name: string) =>
    name === '--color-primary' ? '#8200ad' : '#64748b',
}));
vi.mock('../atoms/organizer-icon', () => ({
  OrganizerIcon: 'OrganizerIcon',
}));
vi.mock('../atoms/group-icon', () => ({
  GroupIcon: 'GroupIcon',
}));

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [
    node,
    ...Children.toArray(node.props.children as ReactNode).flatMap(child =>
      elements(child)
    ),
  ];
}

describe('DateTypeStep', () => {
  it('uses the matching web organizer and group icons', () => {
    const tree = elements(
      DateTypeStep({
        onSelectSingle: vi.fn(),
        onSelectMulti: vi.fn(),
        onBack: vi.fn(),
      })
    );
    const organizerIcon = tree.find(
      element => element.type === 'OrganizerIcon'
    );
    const groupIcon = tree.find(element => element.type === 'GroupIcon');

    expect(organizerIcon?.props).toEqual(
      expect.objectContaining({ size: 64, color: '#8200ad' })
    );
    expect(groupIcon?.props).toEqual(
      expect.objectContaining({
        size: 64,
        color: '#8200ad',
        secondaryColor: '#64748b',
      })
    );
  });
});
