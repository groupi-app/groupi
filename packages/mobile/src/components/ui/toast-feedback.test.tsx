import { useWindowDimensions } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
vi.mock('lucide-react-native', () => ({
  CheckCircle2: 'Check',
  CircleAlert: 'Error',
  Info: 'Info',
  TriangleAlert: 'Warning',
}));
vi.mock('./icon', () => ({ Icon: 'Icon' }));
import { ToastFeedback, toastConfig } from './toast-feedback';

describe('native outcome feedback', () => {
  for (const [outcome, label] of [
    ['success', 'Success'],
    ['error', 'Error'],
    ['warning', 'Warning'],
    ['info', 'Information'],
  ] as const) {
    it(`announces ${outcome} with the complete message`, () => {
      const render = toastConfig[outcome];
      expect(render).toBeTypeOf('function');
      const toast = ToastFeedback({
        outcome,
        text1: 'Saved',
        text2: 'Your changes are ready',
      });
      expect(toast.props.accessibilityLabel).toBe(
        `${label}. Saved. Your changes are ready`
      );
      expect(toast.props.accessibilityLiveRegion).toBe('polite');
    });
  }
  it('bounds long feedback to the viewport so icon and text share available width', () => {
    vi.mocked(useWindowDimensions).mockReturnValueOnce({
      width: 320,
      height: 640,
      scale: 1,
      fontScale: 2,
    });
    const message =
      'Your changes were saved. This deliberately long message must wrap without disappearing beside the outcome icon.';
    const toast = ToastFeedback({
      outcome: 'success',
      text1: 'Saved',
      text2: message,
    });
    expect(toast.props.style.width).toBe(288);
    const textColumn = toast.props.children[1];
    expect(textColumn.props.children[1].props.children).toBe(message);
    expect(textColumn.props.children[1].props.numberOfLines).toBeUndefined();
  });
  it('preserves the supplied toast action', () => {
    const onPress = vi.fn();
    const toast = ToastFeedback({
      outcome: 'success',
      text1: 'Saved',
      onPress,
    });
    toast.props.onPress();
    expect(onPress).toHaveBeenCalledOnce();
  });
});
