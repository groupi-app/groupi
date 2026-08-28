import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { router } from 'expo-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (options: Record<string, unknown>) =>
      options.ios ?? options.default,
  },
  Pressable: 'Pressable',
  View: 'View',
}));
vi.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
vi.mock('uniwind', () => ({
  useCSSVariable: (name: string) => name,
}));
vi.mock('../ui/text', () => ({ Text: 'Text' }));

import { NotificationButton } from './notification-button';

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [
    node,
    ...Children.toArray(node.props.children as ReactNode).flatMap(child =>
      elements(child)
    ),
  ];
}

describe('NotificationButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens notifications and announces the unread count', () => {
    const tree = elements(NotificationButton({ unreadCount: 7 }));
    const button = tree.find(
      element => element.props.testID === 'home-notifications-button'
    );

    expect(button?.props.accessibilityLabel).toBe('Notifications, 7 unread');
    const onPress = button?.props.onPress as (() => void) | undefined;
    onPress?.();
    expect(router.push).toHaveBeenCalledWith('/notifications');
  });

  it('does not render a badge when everything is read', () => {
    const tree = elements(NotificationButton({ unreadCount: 0 }));
    const button = tree.find(
      element => element.props.testID === 'home-notifications-button'
    );
    const badgeText = tree.find(element => element.props.children === '0');

    expect(button?.props.accessibilityLabel).toBe('Notifications');
    expect(badgeText).toBeUndefined();
  });

  it('caps the visible badge at 99+', () => {
    const tree = elements(NotificationButton({ unreadCount: 120 }));
    const badgeText = tree.find(element => element.props.children === '99+');

    expect(badgeText).toBeDefined();
  });
});
