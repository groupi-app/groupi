import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { router } from 'expo-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FormState } from '@/context/create-event-context';

const mocks = vi.hoisted(() => ({
  formState: {} as FormState,
  createEvent: vi.fn(),
  uploadFile: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('react');
  return { ...actual, useState: <T,>(initial: T) => [initial, vi.fn()] };
});

vi.mock('../../../context/create-event-context', () => ({
  useCreateEventForm: () => ({ formState: mocks.formState }),
}));
vi.mock('../../../hooks/use-events', () => ({
  useCreateEvent: () => mocks.createEvent,
}));
vi.mock('../../../hooks/use-file-upload', () => ({
  useFileUpload: () => ({ uploadFile: mocks.uploadFile, isUploading: false }),
}));
vi.mock('../../ui/text', () => ({ Text: 'Text' }));
vi.mock('../../ui/button', () => ({ Button: 'Button' }));
vi.mock('uniwind', () => ({ useCSSVariable: () => '#123456' }));
vi.mock('@groupi/shared/platform', () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

import { ReviewStep } from '../review-step';

function createFormState(overrides: Partial<FormState> = {}): FormState {
  return {
    title: '  Launch Party  ',
    description: '  Bring a friend  ',
    location: '  Community Hall  ',
    visibility: 'FRIENDS',
    dateType: 'single',
    singleDate: new Date('2030-06-15T14:00:00Z'),
    singleEndDate: new Date('2030-06-15T16:00:00Z'),
    hasEndTime: true,
    dateOptions: [],
    imageUri: null,
    imageFile: null,
    addonConfigs: { reminders: { reminderOffset: '1_HOUR' } },
    permissions: {
      createPosts: 'EVERYONE',
      inviteMembers: 'MODERATOR',
      viewAttendeeList: 'EVERYONE',
    },
    ...overrides,
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

async function submitReview() {
  const tree = ReviewStep({ onBack: vi.fn() });
  const buttons = elements(tree).filter(element => element.type === 'Button');
  const createButton = buttons.at(-1);
  if (!createButton) throw new Error('Create Event button was not rendered');
  await (createButton.props.onPress as () => Promise<void>)();
}

describe('create event payload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(
      new Date('2029-06-15T14:00:00Z').getTime()
    );
    mocks.createEvent.mockResolvedValue({ eventId: 'event-456' });
    mocks.uploadFile.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes a single-date form into the create mutation payload', async () => {
    mocks.formState = createFormState();

    await submitReview();

    expect(mocks.createEvent).toHaveBeenCalledWith({
      title: 'Launch Party',
      description: 'Bring a friend',
      location: 'Community Hall',
      visibility: 'FRIENDS',
      imageStorageId: undefined,
      permissions: mocks.formState.permissions,
      addons: [
        { addonType: 'reminders', config: { reminderOffset: '1_HOUR' } },
      ],
      chosenDateTime: '2030-06-15T14:00:00.000Z',
      chosenEndDateTime: '2030-06-15T16:00:00.000Z',
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Event created!');
    expect(router.replace).toHaveBeenCalledWith('/event/event-456');
  });

  it('maps multi-date options and omits blank optional fields', async () => {
    mocks.formState = createFormState({
      description: '   ',
      location: '',
      dateType: 'multi',
      hasEndTime: false,
      addonConfigs: {},
      dateOptions: [
        {
          id: 'date-1',
          date: new Date('2030-07-01T18:00:00Z'),
          endDate: new Date('2030-07-01T20:00:00Z'),
        },
        { id: 'date-2', date: new Date('2030-07-02T18:00:00Z') },
      ],
    });

    await submitReview();

    expect(mocks.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        description: undefined,
        location: undefined,
        addons: [],
        potentialDateTimeOptions: [
          {
            start: '2030-07-01T18:00:00.000Z',
            end: '2030-07-01T20:00:00.000Z',
          },
          { start: '2030-07-02T18:00:00.000Z', end: undefined },
        ],
      })
    );
  });

  it('rejects a reminder that would be sent in the past', async () => {
    mocks.formState = createFormState({
      singleDate: new Date('2029-06-15T15:00:00Z'),
      addonConfigs: { reminders: { reminderOffset: '1_DAY' } },
    });

    await submitReview();

    expect(mocks.toastError).toHaveBeenCalledWith(
      'That reminder would be sent in the past. Choose a shorter reminder or update the event date.'
    );
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });
});
