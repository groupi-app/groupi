vi.mock('./group-discord-settings', () => ({
  GroupDiscordSettings: 'GroupDiscordSettings',
}));
vi.mock('./group-event-sharing-policy', () => ({
  GroupEventSharingPolicy: 'GroupEventSharingPolicy',
}));
vi.mock('./group-ownership-transfer', () => ({
  GroupOwnershipTransfer: () => null,
}));
vi.mock('./group-questionnaire', () => ({
  GroupJoiningQuestionnairePrompt: () => null,
}));
vi.mock('./group-application-settings', () => ({
  GroupApplicationSettings: 'GroupApplicationSettings',
}));
vi.mock('./group-announcement-composer', () => ({
  GroupAnnouncementComposer: () => null,
}));
vi.mock('./group-leave-control', () => ({ GroupLeaveControl: () => null }));
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  authenticated: false,
  group: {
    _id: 'group-123',
    name: 'Book club',
    ownerId: 'person-123',
    viewerRole: 'MEMBER',
    canManageIdentity: false,
    canManageMembers: false,
    canManageRoles: false,
    memberCount: 1,
  },
  push: vi.fn(),
  replace: vi.fn(),
  deleteGroup: vi.fn(),
  confirm: vi.fn(),
}));
vi.mock('react', async original => ({
  ...(await original<typeof import('react')>()),
  useState: <T,>(initial: T) => [initial, vi.fn()],
}));
vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ groupId: 'group-123' }),
  router: { push: mocks.push, replace: mocks.replace },
}));
vi.mock('../../hooks/use-groups', () => ({
  useGroup: () => mocks.group,
  useGroupLanding: () => ({
    groupId: 'group-123',
    name: 'Book club',
    description: 'Read together',
    image: null,
  }),
  useUpdateGroup: () => vi.fn(),
  useDeleteGroup: () => mocks.deleteGroup,
}));
vi.mock('../../context/global-user-context', () => ({
  useGlobalUser: () => ({ isAuthenticated: mocks.authenticated }),
}));
vi.mock('../ui/text', () => ({ Text: 'Text' }));
vi.mock('../ui/button', () => ({ Button: 'Button' }));
vi.mock('../ui/back-button', () => ({ BackButton: 'BackButton' }));
vi.mock('../ui/safe-area-view', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('../ui/confirm-dialog', () => ({ showConfirmDialog: mocks.confirm }));
vi.mock('./group-invitation-panels', () => ({
  GroupLandingInvitation: 'GroupLandingInvitation',
}));
vi.mock('./group-form', () => ({ GroupForm: 'GroupForm' }));
import { GroupDetailScreen, GroupLandingScreen } from './group-screen';
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [
    node,
    ...Children.toArray(node.props.children as ReactNode).flatMap(elements),
  ];
}
function button(tree: ReturnType<typeof elements>, label: string) {
  return tree.find(
    element => element.type === 'Button' && element.props.children === label
  );
}
describe('Native Group screens', () => {
  it('prioritizes member content and labels sections without exposing profile IDs', () => {
    const tree = elements(GroupDetailScreen());
    const texts = tree.map(element => element.props.children);
    expect(texts).toContain('Group tools');
    expect(texts).toContain('Your participation');
    expect(texts).toContain('Group member');
    expect(JSON.stringify(texts)).not.toContain('Owner ID:');
    expect(JSON.stringify(texts)).not.toContain('person-123');
    const events = tree.findIndex(
      element => element.props.accessibilityLabel === 'View Group shared Events'
    );
    const tools = texts.indexOf('Group tools');
    expect(events).toBeGreaterThan(-1);
    expect(events).toBeLessThan(tools);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated = false;
    mocks.group.canManageIdentity = false;
  });
  it('shows only landing identity and carries the stable link into sign-in', () => {
    const tree = elements(GroupLandingScreen());
    expect(tree.some(element => element.props.children === 'Book club')).toBe(
      true
    );
    expect(
      tree.some(element => element.props.children === 'Read together')
    ).toBe(true);
    expect(button(tree, 'Delete Group')).toBeUndefined();
    (button(tree, 'Sign in or sign up')?.props.onPress as () => void)();
    expect(mocks.push).toHaveBeenCalledWith({
      pathname: '/(auth)/sign-in',
      params: { returnTo: '/g/group-123' },
    });
  });
  it('keeps owner identity actions unavailable to members', () => {
    const tree = elements(GroupDetailScreen());
    expect(button(tree, 'Edit Group')).toBeUndefined();
    expect(button(tree, 'Delete Group')).toBeUndefined();
    expect(button(tree, 'Share Group link')).toBeDefined();
  });
  it('requires explicit confirmation before an owner deletes the Group', async () => {
    mocks.group.canManageIdentity = true;
    const tree = elements(GroupDetailScreen());
    expect(button(tree, 'Edit Group')).toBeDefined();
    (button(tree, 'Delete Group')?.props.onPress as () => void)();
    expect(mocks.deleteGroup).not.toHaveBeenCalled();
    await mocks.confirm.mock.calls[0][0].onConfirm();
    expect(mocks.deleteGroup).toHaveBeenCalledWith({ groupId: 'group-123' });
    expect(mocks.replace).toHaveBeenCalledWith('/g/group-123');
  });
});

it('shows native Discord settings to moderators without owner role controls', () => {
  mocks.group.viewerRole = 'MODERATOR';
  mocks.group.canManageMembers = true;
  mocks.group.canManageRoles = false;
  const tree = elements(GroupDetailScreen());
  expect(tree.some(element => element.type === 'GroupDiscordSettings')).toBe(
    true
  );
});
