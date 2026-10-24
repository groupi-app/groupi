import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';
vi.mock('@rn-primitives/progress', () => ({
  Root: 'Progress',
  Indicator: 'Indicator',
}));
import { Progress } from './progress';

describe('native control semantics', () => {
  it('keeps loading disabled even when the caller explicitly supplies disabled false', () => {
    const element = Button({
      children: 'Save',
      isLoading: true,
      disabled: false,
    });
    const control = element.props.children;
    expect(control.props.disabled).toBe(true);
    expect(control.props.accessibilityState).toMatchObject({
      disabled: true,
      busy: true,
    });
  });
  it('forwards native pressed state to functional children', () => {
    const renderChild = vi.fn(({ pressed }: { pressed: boolean }) =>
      pressed ? 'Pressed' : 'Save'
    );
    const control = Button({ children: renderChild }).props.children;
    control.props.children({ pressed: true });
    expect(renderChild).toHaveBeenCalledWith({ pressed: true });
  });
  it('preserves selected state while adding truthful busy and disabled states', () => {
    const control = Button({
      children: 'Save',
      accessibilityState: { selected: true },
    }).props.children;
    expect(control.props.accessibilityState).toEqual({
      selected: true,
      disabled: false,
      busy: false,
    });
  });
  it('uses the same bounded value and custom maximum for accessible and visible progress', () => {
    const control = Progress({ value: 30, max: 60 });
    expect(control.props.value).toBe(30);
    expect(control.props.max).toBe(60);
    expect(control.props.children.props.value).toBe(50);
    expect(Progress({ value: 0 }).props.children.props.value).toBe(0);
    expect(Progress({ value: 120 }).props.value).toBe(100);
  });
});
