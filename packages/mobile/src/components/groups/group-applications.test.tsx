import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement, type ReactNode } from 'react';
import { getFunctionName } from 'convex/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire(import.meta.url);
interface Node {
  type: unknown;
  props: Record<string, unknown>;
}
interface Mounted {
  root: { findAll: (test: (node: Node) => boolean) => Node[] };
  update: (element: ReactNode) => void;
  unmount: () => void;
}
const renderer = require(
  require.resolve('react-test-renderer', {
    paths: [
      dirname(require.resolve('@testing-library/react-native/package.json')),
    ],
  })
) as { create: (element: ReactNode) => Mounted };
const external = vi.hoisted(() => ({
  canApply: true,
  canReview: false,
  enabled: true,
  pending: null as Record<string, unknown> | null,
  questions: [] as Record<string, unknown>[],
  history: [] as Record<string, unknown>[],
  queue: [] as Record<string, unknown>[],
  watches: vi.fn(),
  mutation: vi.fn(),
  push: vi.fn(),
  subscribers: new Set<() => void>(),
}));
vi.unmock('react');
vi.unmock('convex/react');
vi.unmock('convex/_generated/api');
vi.unmock('@groupi/shared/hooks');
vi.unmock('@convex-dev/better-auth/react');
vi.unmock('../../providers/convex-provider');
vi.mock('uniwind', () => ({
  withUniwind: (component: unknown) => component,
  useCSSVariable: () => 'transparent',
}));
vi.mock('expo-router', () => ({
  router: { push: external.push, back: vi.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ groupId: 'group-123' }),
}));
vi.mock('../../lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: { user: { id: 'user-123' }, session: { id: 'session-123' } },
      isPending: false,
    }),
    convex: { token: async () => ({ data: null }) },
  },
}));
vi.mock('../../lib/convex', () => ({
  convex: {
    watchQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
      const name = getFunctionName(ref);
      external.watches(name, args);
      return {
        localQueryResult: () =>
          name.endsWith(':getGroupApplicationForm')
            ? {
                applicationsEnabled: external.enabled,
                questions: external.questions,
                pending: external.pending,
                canApply: external.canApply,
                canReview: external.canReview,
              }
            : name.endsWith(':listMyGroupApplications')
              ? {
                  page: external.history,
                  isDone: false,
                  continueCursor: 'next',
                }
              : name.endsWith(':listGroupApplications')
                ? {
                    page: external.queue,
                    isDone: false,
                    continueCursor: 'next',
                  }
                : null,
        onUpdate: (listener: () => void) => {
          external.subscribers.add(listener);
          return () => external.subscribers.delete(listener);
        },
        journal: () => undefined,
      };
    },
    mutation: (ref: Parameters<typeof getFunctionName>[0], args: unknown) =>
      external.mutation(getFunctionName(ref), args),
    setAuth: (_fetch: unknown, changed: (value: boolean) => void) =>
      changed(true),
    clearAuth: vi.fn(),
  },
}));
import { ConvexClientProvider } from '../../providers/convex-provider';
import { GroupApplicationScreen } from './group-application-screen';
import { GroupApplicationReviewScreen } from './group-application-review-screen';
import { GroupApplicationSettings } from './group-application-settings';
const question = {
  id: 'why',
  label: 'Why join?',
  type: 'SHORT_ANSWER',
  required: true,
};
function screen(component: () => ReactNode) {
  return createElement(ConvexClientProvider, null, createElement(component));
}
function control(m: Mounted, label: string) {
  return m.root.findAll(
    n => n.type === 'Pressable' && n.props.accessibilityLabel === label
  )[0];
}
function input(m: Mounted, label: string) {
  return m.root.findAll(
    n => n.type === 'TextInput' && n.props.accessibilityLabel === label
  )[0];
}
async function press(m: Mounted, label: string) {
  await act(async () => {
    await (control(m, label).props.onPress as () => Promise<void>)();
  });
}
async function type(m: Mounted, label: string, value: string) {
  await act(async () => {
    (input(m, label).props.onChangeText as (value: string) => void)(value);
  });
}
function texts(m: Mounted) {
  return m.root.findAll(n => n.type === 'Text').map(n => n.props.children);
}
describe('native Group application production provider screens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    external.canApply = true;
    external.canReview = false;
    external.enabled = true;
    external.pending = null;
    external.questions = [question];
    external.history = [];
    external.queue = [];
    external.mutation.mockResolvedValue({
      applicationId: 'application-1',
      status: 'PENDING',
    });
  });
  it('submits voluntary admission without invite preferences, roster, or Event queries and pages private history', async () => {
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(GroupApplicationScreen));
    });
    await type(m!, 'Why join?', 'Meet neighbors');
    await press(m!, 'Submit Group application');
    expect(external.mutation).toHaveBeenCalledWith(
      'groupApplications/mutations:submitGroupApplication',
      { groupId: 'group-123', answers: { why: 'Meet neighbors' } }
    );
    await press(m!, 'Next Group application history page');
    expect(external.watches).toHaveBeenCalledWith(
      'groupApplications/queries:listMyGroupApplications',
      { groupId: 'group-123', paginationOpts: { cursor: 'next', numItems: 10 } }
    );
    expect(
      external.watches.mock.calls
        .map(([name]) => name)
        .every(name => name.startsWith('groupApplications/'))
    ).toBe(true);
    await act(async () => m!.unmount());
  });
  it('edits retained pending definitions and withdraws after applying becomes unavailable', async () => {
    external.canApply = true;
    external.pending = {
      _id: 'application-1',
      questions: [{ ...question, id: 'old', label: 'Original question' }],
      answers: { old: 'Original answer' },
    };
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(GroupApplicationScreen));
    });
    expect(input(m!, 'Original question').props.value).toBe('Original answer');
    expect(input(m!, 'Why join?')).toBeUndefined();
    await type(m!, 'Original question', 'Updated answer');
    await press(m!, 'Update Group application');
    expect(external.mutation).toHaveBeenCalledWith(
      'groupApplications/mutations:editGroupApplication',
      { applicationId: 'application-1', answers: { old: 'Updated answer' } }
    );
    external.canApply = false;
    await act(async () => {
      for (const listener of external.subscribers) listener();
    });
    expect(control(m!, 'Update Group application').props.disabled).toBe(true);
    await press(m!, 'Withdraw Group application');
    expect(external.mutation).toHaveBeenCalledWith(
      'groupApplications/mutations:withdrawGroupApplication',
      { applicationId: 'application-1' }
    );
    await act(async () => m!.unmount());
  });
  it('handles all seven question types using accessible native controls', async () => {
    external.questions = [
      { id: 'short', label: 'Short', type: 'SHORT_ANSWER', required: true },
      { id: 'long', label: 'Long', type: 'LONG_ANSWER', required: false },
      { id: 'number', label: 'Number', type: 'NUMBER', required: false },
      {
        id: 'choice',
        label: 'Choice',
        type: 'MULTIPLE_CHOICE',
        options: ['A', 'B'],
        required: false,
      },
      {
        id: 'checks',
        label: 'Checks',
        type: 'CHECKBOXES',
        options: ['A', 'B'],
        required: false,
      },
      {
        id: 'drop',
        label: 'Dropdown',
        type: 'DROPDOWN',
        options: ['A', 'B'],
        required: false,
      },
      { id: 'yes', label: 'Yes no', type: 'YES_NO', required: false },
    ];
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(GroupApplicationScreen));
    });
    await type(m!, 'Short', 'Hello');
    await type(m!, 'Long', 'Long answer');
    expect(input(m!, 'Long').props.multiline).toBe(true);
    await type(m!, 'Number', '7');
    await press(m!, 'Choice: B');
    await press(m!, 'Checks: A');
    await press(m!, 'Checks: B');
    await press(m!, 'Checks: A');
    await press(m!, 'Dropdown: A');
    await press(m!, 'Yes no: No');
    expect(control(m!, 'Yes no: No').props.accessibilityState).toMatchObject({
      checked: true,
    });
    await press(m!, 'Submit Group application');
    expect(external.mutation).toHaveBeenCalledWith(
      'groupApplications/mutations:submitGroupApplication',
      {
        groupId: 'group-123',
        answers: {
          short: 'Hello',
          long: 'Long answer',
          number: 7,
          choice: 'B',
          checks: ['B'],
          drop: 'A',
          yes: false,
        },
      }
    );
    await act(async () => m!.unmount());
  });
  it('keeps former applicants private history accessible without an apply action', async () => {
    external.canApply = false;
    external.history = [
      {
        _id: 'application-old',
        status: 'DECLINED',
        questions: [question],
        answers: { why: 'Retained' },
        decisions: [{ status: 'DECLINED' }],
      },
    ];
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(GroupApplicationScreen));
    });
    expect(control(m!, 'Submit Group application')).toBeUndefined();
    expect(texts(m!)).toContain('DECLINED');
    expect(external.watches).toHaveBeenCalledWith(
      'groupApplications/queries:listMyGroupApplications',
      { groupId: 'group-123', paginationOpts: { cursor: null, numItems: 10 } }
    );
    await act(async () => m!.unmount());
  });
  it('never reads the reviewer queue without current server authority', async () => {
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(GroupApplicationReviewScreen));
    });
    expect(external.watches.mock.calls.map(([name]) => name)).not.toContain(
      'groupApplications/queries:listGroupApplications'
    );
    expect(texts(m!)).toContain('Application review unavailable.');
    await act(async () => m!.unmount());
  });
  it('approves immediately and exposes reviewed immutable snapshots with paged queue', async () => {
    external.canReview = true;
    external.queue = [
      {
        _id: 'application-1',
        status: 'PENDING',
        questions: [question],
        answers: { why: 'Retained' },
        decisions: [],
        applicant: { name: 'Alex' },
      },
    ];
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(GroupApplicationReviewScreen));
    });
    await press(m!, 'Approve Group application application-1');
    expect(external.mutation).toHaveBeenCalledWith(
      'groupApplications/mutations:reviewGroupApplication',
      { applicationId: 'application-1', decision: 'APPROVED' }
    );
    expect(texts(m!)).toContain(
      'Applicant admitted to the Group. No Event participation was added.'
    );
    await press(m!, 'Next Group review page');
    expect(external.watches).toHaveBeenCalledWith(
      'groupApplications/queries:listGroupApplications',
      { groupId: 'group-123', paginationOpts: { cursor: 'next', numItems: 10 } }
    );
    await act(async () => m!.unmount());
  });
  it('uses generic privacy-safe messages when review authority changes', async () => {
    external.canReview = true;
    external.queue = [
      {
        _id: 'application-1',
        status: 'PENDING',
        questions: [],
        answers: {},
        decisions: [],
        applicant: { name: 'Alex' },
      },
    ];
    external.mutation.mockRejectedValue(new Error('Private ban reason'));
    let m: Mounted;
    await act(async () => {
      m = renderer.create(screen(GroupApplicationReviewScreen));
    });
    await press(m!, 'Decline Group application application-1');
    expect(texts(m!)).toContain(
      'Review unavailable. Your authority or the application status may have changed.'
    );
    expect(texts(m!)).not.toContain('Private ban reason');
    await act(async () => m!.unmount());
  });
  it('configures admission through ordinary owner field controls without questionnaire resets', async () => {
    let m: Mounted;
    await act(async () => {
      m = renderer.create(
        screen(() =>
          createElement(GroupApplicationSettings, {
            groupId: 'group-123' as never,
            applicationsEnabled: false,
            questions: [question as never],
          })
        )
      );
    });
    await press(m!, 'Enable Group applications');
    await type(m!, 'Group question 1 label', 'Your motivation');
    await press(m!, 'Group question 1 type DROPDOWN');
    await type(m!, 'Group question 1 options, one per line', 'Read\nDiscuss');
    await press(m!, 'Save Group application settings');
    expect(external.mutation).toHaveBeenCalledWith(
      'groupApplications/mutations:configureGroupApplications',
      {
        groupId: 'group-123',
        applicationsEnabled: true,
        questions: [
          {
            id: 'why',
            label: 'Your motivation',
            type: 'DROPDOWN',
            required: true,
            options: ['Read', 'Discuss'],
          },
        ],
      }
    );
    await act(async () => m!.unmount());
  });
});
