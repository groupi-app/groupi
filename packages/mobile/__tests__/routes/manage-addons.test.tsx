import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  formState: { addonConfigs: {} } as {
    addonConfigs: Record<string, Record<string, unknown>>;
  },
  queryResult: [] as Array<{
    addonType: string;
    enabled: boolean;
    config: Record<string, unknown>;
  }>,
  replaceBuiltInAddonConfigs: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  back: vi.fn(),
  confirm: vi.fn(),
  role: 'ORGANIZER',
  allowNavigation: vi.fn(),
}));

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('react');
  return { ...actual, useState: <T,>(initial: T) => [initial, vi.fn()] };
});

vi.mock('expo-router', () => ({
  router: { back: mocks.back },
  Redirect: 'Redirect',
  useLocalSearchParams: () => ({ eventId: 'event-123' }),
}));

vi.mock('convex/_generated/api', () => ({
  api: {
    addons: {
      queries: { getEventAddons: 'getEventAddons' },
    },
  },
}));

vi.mock('convex/react', () => ({
  useQuery: () => mocks.queryResult,
}));

vi.mock('../../src/hooks/use-addons', () => ({
  useReplaceBuiltInAddonConfigs: () => mocks.replaceBuiltInAddonConfigs,
}));

vi.mock('../../src/context/create-event-context', () => ({
  CreateEventProvider: 'CreateEventProvider',
  useCreateEventForm: () => ({ formState: mocks.formState }),
}));
vi.mock('../../src/components/create-event/addons-step', () => ({
  AddonsStep: 'AddonsStep',
}));
vi.mock('../../src/components/templates', () => ({
  DetailScreenTemplate: 'DetailScreenTemplate',
}));
vi.mock('../../src/components/molecules', () => ({
  LoadingState: 'LoadingState',
}));
vi.mock('@groupi/shared/platform', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

vi.mock('../../src/hooks/use-events', () => ({
  useEventHeader: () => ({ userMembership: { role: mocks.role } }),
}));
vi.mock('../../src/hooks/use-unsaved-changes', () => ({
  useUnsavedChanges: () => mocks.allowNavigation,
}));
vi.mock('../../src/components/ui/confirm-dialog', () => ({
  showConfirmDialog: mocks.confirm,
}));
import ManageAddonsScreen from '../../app/event/[eventId]/settings/addons';
import LegacyManageAddons from '../../app/event/[eventId]/addons/manage';

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (
    node === null ||
    node === undefined ||
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean'
  )
    return [];
  if (!isValidElement<Record<string, unknown>>(node)) {
    return Children.toArray(node).flatMap(elements);
  }
  return [node, ...elements(node.props.children as ReactNode)];
}

function createManageForm() {
  const screen = ManageAddonsScreen();
  const formElement = elements(screen).find(
    element => typeof element.type === 'function'
  );
  if (!formElement || typeof formElement.type !== 'function') {
    throw new Error('Manage add-ons form was not rendered');
  }
  const FormComponent = formElement.type as (
    props: Record<string, unknown>
  ) => ReactElement<Record<string, unknown>>;
  return FormComponent(formElement.props);
}

describe('manage add-ons transaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role = 'ORGANIZER';
    mocks.replaceBuiltInAddonConfigs.mockResolvedValue(undefined);
    mocks.queryResult = [
      {
        addonType: 'reminders',
        enabled: true,
        config: { reminderOffset: '1_DAY' },
      },
      {
        addonType: 'bring-list',
        enabled: true,
        config: { items: [{ id: 'old', name: 'Ice', quantity: 1 }] },
      },
      {
        addonType: 'discord',
        enabled: true,
        config: { guildId: 'guild-1', guildName: 'Community' },
      },
    ];
    mocks.formState = {
      addonConfigs: {
        reminders: { reminderOffset: '1_DAY' },
        'bring-list': {
          items: [{ id: 'new', name: 'Ice', quantity: 2 }],
        },
        questionnaire: { questions: [] },
      },
    };
  });

  it('sends the complete desired built-in set in one mutation', async () => {
    const form = createManageForm();

    await (form.props.onNext as () => Promise<void>)();
    expect(mocks.replaceBuiltInAddonConfigs).not.toHaveBeenCalled();
    await mocks.confirm.mock.calls[0][0].onConfirm();

    expect(mocks.replaceBuiltInAddonConfigs).toHaveBeenCalledOnce();
    expect(mocks.replaceBuiltInAddonConfigs).toHaveBeenCalledWith({
      eventId: 'event-123',
      addons: [
        {
          addonType: 'reminders',
          config: { reminderOffset: '1_DAY' },
        },
        {
          addonType: 'bring-list',
          config: mocks.formState.addonConfigs['bring-list'],
        },
        {
          addonType: 'questionnaire',
          config: { questions: [] },
        },
      ],
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Event features updated');
    expect(mocks.back).toHaveBeenCalledOnce();
  });

  it('reports a failed transaction and stays on the form', async () => {
    mocks.replaceBuiltInAddonConfigs.mockRejectedValueOnce(
      new Error('Update failed')
    );
    const form = createManageForm();

    await (form.props.onNext as () => Promise<void>)();
    expect(mocks.replaceBuiltInAddonConfigs).not.toHaveBeenCalled();
    await mocks.confirm.mock.calls[0][0].onConfirm();

    expect(mocks.toastError).toHaveBeenCalledWith('Update failed');
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.back).not.toHaveBeenCalled();
    expect(mocks.replaceBuiltInAddonConfigs).toHaveBeenCalledOnce();
  });

  it('cancelling a destructive reset keeps the draft and never writes', async () => {
    const form = createManageForm();
    const draft = mocks.formState;
    await (form.props.onNext as () => Promise<void>)();
    expect(mocks.confirm.mock.calls[0][0].message).toContain(
      'Bring List claims'
    );
    mocks.confirm.mock.calls[0][0].onCancel();
    expect(mocks.replaceBuiltInAddonConfigs).not.toHaveBeenCalled();
    expect(mocks.formState).toBe(draft);
    expect(mocks.back).not.toHaveBeenCalled();
  });
  it('requires current manager authority and retains the legacy settings link', () => {
    mocks.role = 'ATTENDEE';
    const tree = elements(ManageAddonsScreen());
    expect(tree.some(item => item.type === 'CreateEventProvider')).toBe(false);
    expect(LegacyManageAddons().props.href).toBe(
      '/event/event-123/settings/addons'
    );
  });
  it('saves a reminder-only change without a destructive reset prompt', async () => {
    mocks.formState = {
      addonConfigs: Object.fromEntries(
        mocks.queryResult
          .filter(addon => addon.enabled)
          .map(addon => [addon.addonType, addon.config])
      ),
    };
    mocks.formState.addonConfigs.reminders = { reminderOffset: '1_WEEK' };
    const form = createManageForm();
    await (form.props.onNext as () => Promise<void>)();
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.replaceBuiltInAddonConfigs).toHaveBeenCalledOnce();
  });
  it('preserves malformed saved configurations and does not render their raw values', () => {
    mocks.queryResult = [
      {
        addonType: 'bring-list',
        enabled: true,
        config: { items: 'DO_NOT_RENDER' },
      },
    ];
    const tree = elements(ManageAddonsScreen());
    expect(tree.some(item => item.type === 'CreateEventProvider')).toBe(false);
    const text = tree
      .filter(item => typeof item.props.children === 'string')
      .map(item => item.props.children)
      .join(' ');
    expect(text).toContain('configuration and participant data are preserved');
    expect(text).not.toContain('DO_NOT_RENDER');
  });
});
