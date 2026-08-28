import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FormState } from '@/context/create-event-context';

const mocks = vi.hoisted(() => ({
  formState: {} as FormState,
  updateFormState: vi.fn(),
  onNext: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('react');
  return {
    ...actual,
    useCallback: <T extends (...args: never[]) => unknown>(callback: T) =>
      callback,
  };
});

vi.mock('../../../context/create-event-context', () => ({
  useCreateEventForm: () => ({
    formState: mocks.formState,
    updateFormState: mocks.updateFormState,
  }),
}));

vi.mock('../../ui/text', () => ({ Text: 'Text' }));
vi.mock('../../ui/button', () => ({ Button: 'Button' }));
vi.mock('../../ui/switch', () => ({ Switch: 'Switch' }));
vi.mock('../../ui/input', () => ({ Input: 'Input' }));
vi.mock('../../ui/badge', () => ({ Badge: 'Badge' }));
vi.mock('uniwind', () => ({ useCSSVariable: () => '#123456' }));
vi.mock('@groupi/shared/platform', () => ({
  toast: { error: mocks.toastError },
}));

import { AddonsStep } from '../addons-step';

function createFormState(addonConfigs: FormState['addonConfigs']): FormState {
  return {
    title: 'Launch Party',
    description: '',
    location: '',
    visibility: 'PRIVATE',
    dateType: 'single',
    singleDate: new Date('2030-06-15T14:00:00Z'),
    hasEndTime: false,
    dateOptions: [],
    imageUri: null,
    imageFile: null,
    imageFocalPoint: null,
    addonConfigs,
  };
}

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (
    node === null ||
    node === undefined ||
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean'
  ) {
    return [];
  }
  if (!isValidElement<Record<string, unknown>>(node)) {
    return Children.toArray(node).flatMap(elements);
  }
  return [node, ...elements(node.props.children as ReactNode)];
}

function submitAddons() {
  const tree = AddonsStep({ onNext: mocks.onNext, onBack: vi.fn() });
  const nextButton = elements(tree)
    .filter(element => element.type === 'Button')
    .at(-1);
  if (!nextButton) throw new Error('Next button was not rendered');
  (nextButton.props.onPress as () => void)();
}

describe('add-on configuration validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [
      'empty bring list',
      { 'bring-list': { items: [] } },
      'Add at least one item or turn off the Bring List add-on.',
    ],
    [
      'empty questionnaire',
      { questionnaire: { questions: [] } },
      'Add at least one question or turn off the Questionnaire add-on.',
    ],
    [
      'choice question without options',
      {
        questionnaire: {
          questions: [
            {
              id: 'question-1',
              label: 'Pick one',
              type: 'MULTIPLE_CHOICE',
              required: true,
              options: [],
            },
          ],
        },
      },
      'Add at least one option to every choice question.',
    ],
    [
      'incomplete Discord setup',
      { discord: { guildId: 'guild-1', guildName: '' } },
      'Choose a Discord server or turn off the Discord add-on.',
    ],
  ])('blocks %s', (_name, addonConfigs, expectedMessage) => {
    mocks.formState = createFormState(addonConfigs);

    submitAddons();

    expect(mocks.toastError).toHaveBeenCalledWith(expectedMessage);
    expect(mocks.onNext).not.toHaveBeenCalled();
  });

  it('advances when every enabled add-on has a valid configuration', () => {
    mocks.formState = createFormState({
      'bring-list': {
        items: [{ id: 'item-1', name: 'Ice', quantity: 2 }],
      },
      questionnaire: {
        questions: [
          {
            id: 'question-1',
            label: 'Pick one',
            type: 'MULTIPLE_CHOICE',
            required: true,
            options: ['A'],
          },
        ],
      },
      discord: { guildId: 'guild-1', guildName: 'Community' },
    });

    submitAddons();

    expect(mocks.toastError).not.toHaveBeenCalled();
    expect(mocks.onNext).toHaveBeenCalledOnce();
  });
});
