import { Children, type ReactElement } from 'react';
import { router } from 'expo-router';
import { beforeEach, expect, it, vi } from 'vitest';
const { showActionMenu } = vi.hoisted(() => ({ showActionMenu: vi.fn() }));
vi.mock('../ui/action-menu', () => ({
  useActionMenu: () => ({ showActionMenu }),
}));
vi.mock('../ui/button', () => ({ Button: 'Button' }));
vi.unmock('@groupi/shared/hooks');
vi.unmock('convex/_generated/api');
import { NewContentButton } from './new-content-button';

beforeEach(() => vi.clearAllMocks());
it('opens the four creation choices and routes each Event choice to its composer', () => {
  const button = NewContentButton({
    base: '/event/event-123',
  }) as ReactElement<{
    onPress: () => void;
    accessibilityLabel: string;
    children: string;
  }>;
  expect(button.props.accessibilityLabel).toBe('Create new content');
  expect(Children.toArray(button.props.children).join('')).toBe('+ New');
  button.props.onPress();
  const menu = showActionMenu.mock.calls[0][0];
  expect(menu.options.map((option: { label: string }) => option.label)).toEqual(
    ['Post', 'Form', 'List', 'Poll']
  );
  for (const option of menu.options) option.onPress();
  expect(vi.mocked(router.push).mock.calls.map(args => args[0])).toEqual([
    '/event/event-123/new-post',
    '/event/event-123/forms/create',
    '/event/event-123/lists/create',
    '/event/event-123/polls/create',
  ]);
});
it('preserves Group routing and marks policy-denied choices disabled', () => {
  const button = NewContentButton({
    base: '/groups/group-123',
    allowed: { Form: false, List: false },
  });
  button.props.onPress();
  const menu = showActionMenu.mock.calls[0][0];
  expect(
    menu.options.map((option: { disabled: boolean }) => option.disabled)
  ).toEqual([false, true, true, false]);
  menu.options[0].onPress();
  expect(router.push).toHaveBeenCalledWith('/groups/group-123/posts/create');
});
