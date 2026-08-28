import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addListener: vi.fn(),
  dispatch: vi.fn(),
  alert: vi.fn(),
}));

vi.mock('react', () => ({
  useCallback: <T extends (...args: never[]) => unknown>(callback: T) =>
    callback,
  useEffect: (effect: () => void | (() => void)) => effect(),
  useRef: <T>(initialValue: T) => ({ current: initialValue }),
}));

vi.mock('expo-router', () => ({
  useNavigation: () => ({
    addListener: mocks.addListener,
    dispatch: mocks.dispatch,
  }),
}));

vi.mock('react-native', () => ({
  Alert: { alert: mocks.alert },
}));

import { useUnsavedChanges } from './use-unsaved-changes';

type BeforeRemoveEvent = {
  preventDefault: ReturnType<typeof vi.fn>;
  data: { action: { type: string } };
};

function useGuardTestSetup() {
  let beforeRemove: ((event: BeforeRemoveEvent) => void) | undefined;
  mocks.addListener.mockImplementation(
    (_eventName: string, listener: (event: BeforeRemoveEvent) => void) => {
      beforeRemove = listener;
      return vi.fn();
    }
  );

  const allowNextNavigation = useUnsavedChanges(true);
  const event: BeforeRemoveEvent = {
    preventDefault: vi.fn(),
    data: { action: { type: 'GO_BACK' } },
  };

  return {
    allowNextNavigation,
    event,
    navigate: () => beforeRemove?.(event),
  };
}

describe('useUnsavedChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks navigation while changes are unsaved', () => {
    const { event, navigate } = useGuardTestSetup();

    navigate();

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(mocks.alert).toHaveBeenCalledWith(
      'Discard changes?',
      'You have unsaved changes. Are you sure you want to leave?',
      expect.any(Array)
    );
  });

  it('allows exactly one navigation after a successful save', () => {
    const { allowNextNavigation, event, navigate } = useGuardTestSetup();

    allowNextNavigation();
    navigate();

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(mocks.alert).not.toHaveBeenCalled();

    navigate();
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it('allows the confirmed discard action through the guard', () => {
    const { event, navigate } = useGuardTestSetup();

    navigate();
    const buttons = mocks.alert.mock.calls[0]?.[2] as Array<{
      text: string;
      onPress?: () => void;
    }>;
    buttons.find(button => button.text === 'Discard')?.onPress?.();

    expect(mocks.dispatch).toHaveBeenCalledWith(event.data.action);

    event.preventDefault.mockClear();
    navigate();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
