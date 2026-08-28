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
}));

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('react');
  return { ...actual, useState: <T,>(initial: T) => [initial, vi.fn()] };
});

vi.mock('expo-router', () => ({
  router: { back: mocks.back },
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

import ManageAddonsScreen from '../../app/event/[eventId]/addons/manage';

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
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
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Add-ons updated');
    expect(mocks.back).toHaveBeenCalledOnce();
  });

  it('reports a failed transaction and stays on the form', async () => {
    mocks.replaceBuiltInAddonConfigs.mockRejectedValueOnce(
      new Error('Update failed')
    );
    const form = createManageForm();

    await (form.props.onNext as () => Promise<void>)();

    expect(mocks.toastError).toHaveBeenCalledWith('Update failed');
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.back).not.toHaveBeenCalled();
    expect(mocks.replaceBuiltInAddonConfigs).toHaveBeenCalledOnce();
  });
});
