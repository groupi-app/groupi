/**
 * Comprehensive tests for keyboard utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setKeyboardState,
  getKeyboardState,
  subscribeToKeyboard,
  isKeyboardVisible,
  getKeyboardHeight,
  setKeyboardOptions,
  getKeyboardOptions,
  setDismissKeyboardFunction,
  dismissKeyboard,
  calculateKeyboardAvoidingOffset,
  wouldBeHiddenByKeyboard,
  subscribeToKeyboardEvents,
  triggerKeyboardEvent,
  type KeyboardState,
  type KeyboardOptions,
  type KeyboardEvent,
} from '../keyboard';
import { TestSetup } from '../../test-helpers';

describe('Keyboard Utils', () => {
  beforeEach(() => {
    TestSetup.beforeEach();
    // Reset keyboard state for each test
    setKeyboardState({ isVisible: false, height: 0 });
    setKeyboardOptions({});
    setDismissKeyboardFunction(null as unknown as () => void);
  });

  afterEach(() => {
    TestSetup.afterEach();
  });

  describe('Keyboard State Management', () => {
    describe('setKeyboardState and getKeyboardState', () => {
      it('should set and retrieve keyboard state', () => {
        const state: KeyboardState = { isVisible: true, height: 300 };

        setKeyboardState(state);
        const retrieved = getKeyboardState();

        expect(retrieved).toEqual(state);
      });

      it('should update keyboard visibility', () => {
        setKeyboardState({ isVisible: true, height: 300 });

        expect(getKeyboardState().isVisible).toBe(true);

        setKeyboardState({ isVisible: false, height: 0 });

        expect(getKeyboardState().isVisible).toBe(false);
      });

      it('should handle different keyboard heights', () => {
        setKeyboardState({ isVisible: true, height: 250 });
        expect(getKeyboardState().height).toBe(250);

        setKeyboardState({ isVisible: true, height: 346 });
        expect(getKeyboardState().height).toBe(346);
      });
    });

    describe('subscribeToKeyboard', () => {
      it('should call listener when keyboard state changes', () => {
        const listener = vi.fn();
        subscribeToKeyboard(listener);

        const newState: KeyboardState = { isVisible: true, height: 300 };
        setKeyboardState(newState);

        expect(listener).toHaveBeenCalledWith(newState);
      });

      it('should support multiple listeners', () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        subscribeToKeyboard(listener1);
        subscribeToKeyboard(listener2);

        const newState: KeyboardState = { isVisible: true, height: 300 };
        setKeyboardState(newState);

        expect(listener1).toHaveBeenCalledWith(newState);
        expect(listener2).toHaveBeenCalledWith(newState);
      });

      it('should return unsubscribe function', () => {
        const listener = vi.fn();
        const unsubscribe = subscribeToKeyboard(listener);

        // First update should trigger listener
        setKeyboardState({ isVisible: true, height: 300 });
        expect(listener).toHaveBeenCalledTimes(1);

        // Unsubscribe
        unsubscribe();

        // Second update should not trigger listener
        setKeyboardState({ isVisible: false, height: 0 });
        expect(listener).toHaveBeenCalledTimes(1);
      });

      it('should only unsubscribe the correct listener', () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        const unsubscribe1 = subscribeToKeyboard(listener1);
        subscribeToKeyboard(listener2);

        // Unsubscribe first listener
        unsubscribe1();

        // Update should only trigger second listener
        setKeyboardState({ isVisible: true, height: 300 });

        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).toHaveBeenCalled();
      });
    });

    describe('isKeyboardVisible', () => {
      it('should return true when keyboard is visible', () => {
        setKeyboardState({ isVisible: true, height: 300 });

        expect(isKeyboardVisible()).toBe(true);
      });

      it('should return false when keyboard is hidden', () => {
        setKeyboardState({ isVisible: false, height: 0 });

        expect(isKeyboardVisible()).toBe(false);
      });
    });

    describe('getKeyboardHeight', () => {
      it('should return current keyboard height', () => {
        setKeyboardState({ isVisible: true, height: 300 });

        expect(getKeyboardHeight()).toBe(300);
      });

      it('should return 0 when keyboard is hidden', () => {
        setKeyboardState({ isVisible: false, height: 0 });

        expect(getKeyboardHeight()).toBe(0);
      });
    });
  });

  describe('Keyboard Options', () => {
    describe('setKeyboardOptions and getKeyboardOptions', () => {
      it('should set and retrieve keyboard options', () => {
        const options: KeyboardOptions = {
          dismissOnTap: true,
          adjustResize: true,
        };

        setKeyboardOptions(options);
        const retrieved = getKeyboardOptions();

        expect(retrieved).toEqual(options);
      });

      it('should merge options with existing', () => {
        setKeyboardOptions({ dismissOnTap: true });
        setKeyboardOptions({ adjustResize: true });

        const options = getKeyboardOptions();

        expect(options.dismissOnTap).toBe(true);
        expect(options.adjustResize).toBe(true);
      });

      it('should handle android soft input mode', () => {
        setKeyboardOptions({ androidSoftInputMode: 'adjustPan' });

        expect(getKeyboardOptions().androidSoftInputMode).toBe('adjustPan');
      });

      it('should override existing options', () => {
        setKeyboardOptions({ dismissOnTap: true });
        setKeyboardOptions({ dismissOnTap: false });

        expect(getKeyboardOptions().dismissOnTap).toBe(false);
      });
    });
  });

  describe('Dismiss Keyboard', () => {
    describe('setDismissKeyboardFunction and dismissKeyboard', () => {
      it('should call the dismiss function when set', () => {
        const dismissFn = vi.fn();
        setDismissKeyboardFunction(dismissFn);

        dismissKeyboard();

        expect(dismissFn).toHaveBeenCalled();
      });

      it('should not throw when dismiss function not set', () => {
        expect(() => dismissKeyboard()).not.toThrow();
      });

      it('should replace previous dismiss function', () => {
        const dismissFn1 = vi.fn();
        const dismissFn2 = vi.fn();

        setDismissKeyboardFunction(dismissFn1);
        setDismissKeyboardFunction(dismissFn2);
        dismissKeyboard();

        expect(dismissFn1).not.toHaveBeenCalled();
        expect(dismissFn2).toHaveBeenCalled();
      });
    });
  });

  describe('Keyboard Avoiding Utilities', () => {
    describe('calculateKeyboardAvoidingOffset', () => {
      it('should return 0 when keyboard is hidden', () => {
        setKeyboardState({ isVisible: false, height: 0 });

        const offset = calculateKeyboardAvoidingOffset(500, 50, 800);

        expect(offset).toBe(0);
      });

      it('should calculate offset when input would be hidden', () => {
        setKeyboardState({ isVisible: true, height: 300 });

        // Screen height: 800, keyboard top: 500
        // Input Y: 450, Input height: 100
        // Input bottom: 550, required offset: 550 - 500 + 20 = 70
        const offset = calculateKeyboardAvoidingOffset(450, 100, 800);

        expect(offset).toBe(70);
      });

      it('should return 0 when input is above keyboard', () => {
        setKeyboardState({ isVisible: true, height: 300 });

        // Screen height: 800, keyboard top: 500
        // Input Y: 100, Input height: 50
        // Input bottom: 150, which is above keyboard top (500)
        const offset = calculateKeyboardAvoidingOffset(100, 50, 800);

        expect(offset).toBe(0);
      });

      it('should use custom additional padding', () => {
        setKeyboardState({ isVisible: true, height: 300 });

        // With 50 padding instead of default 20
        const offset = calculateKeyboardAvoidingOffset(450, 100, 800, 50);

        expect(offset).toBe(100);
      });

      it('should never return negative offset', () => {
        setKeyboardState({ isVisible: true, height: 300 });

        const offset = calculateKeyboardAvoidingOffset(0, 50, 800, 20);

        expect(offset).toBeGreaterThanOrEqual(0);
      });
    });

    describe('wouldBeHiddenByKeyboard', () => {
      it('should return false when keyboard is hidden', () => {
        setKeyboardState({ isVisible: false, height: 0 });

        const hidden = wouldBeHiddenByKeyboard(600, 50, 800);

        expect(hidden).toBe(false);
      });

      it('should return true when input would be hidden', () => {
        setKeyboardState({ isVisible: true, height: 300 });

        // Screen height: 800, keyboard top: 500
        // Input Y: 480, Input height: 50
        // Input bottom: 530 > 500
        const hidden = wouldBeHiddenByKeyboard(480, 50, 800);

        expect(hidden).toBe(true);
      });

      it('should return false when input is above keyboard', () => {
        setKeyboardState({ isVisible: true, height: 300 });

        // Screen height: 800, keyboard top: 500
        // Input Y: 100, Input height: 50
        // Input bottom: 150 < 500
        const hidden = wouldBeHiddenByKeyboard(100, 50, 800);

        expect(hidden).toBe(false);
      });

      it('should return true when input bottom exactly at keyboard top', () => {
        setKeyboardState({ isVisible: true, height: 300 });

        // Screen height: 800, keyboard top: 500
        // Input Y: 450, Input height: 51
        // Input bottom: 501 > 500
        const hidden = wouldBeHiddenByKeyboard(450, 51, 800);

        expect(hidden).toBe(true);
      });
    });
  });

  describe('Keyboard Events', () => {
    describe('subscribeToKeyboardEvents', () => {
      it('should call listener on keyboard event', () => {
        const listener = vi.fn();
        subscribeToKeyboardEvents(listener);

        const event: KeyboardEvent = {
          type: 'show',
          height: 300,
          duration: 250,
        };
        triggerKeyboardEvent(event);

        expect(listener).toHaveBeenCalledWith(event);
      });

      it('should handle show event', () => {
        const listener = vi.fn();
        subscribeToKeyboardEvents(listener);

        triggerKeyboardEvent({ type: 'show', height: 300 });

        expect(listener).toHaveBeenCalledWith({
          type: 'show',
          height: 300,
        });
      });

      it('should handle hide event', () => {
        const listener = vi.fn();
        subscribeToKeyboardEvents(listener);

        triggerKeyboardEvent({ type: 'hide', height: 0 });

        expect(listener).toHaveBeenCalledWith({
          type: 'hide',
          height: 0,
        });
      });

      it('should support multiple listeners', () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        subscribeToKeyboardEvents(listener1);
        subscribeToKeyboardEvents(listener2);

        const event: KeyboardEvent = { type: 'show', height: 300 };
        triggerKeyboardEvent(event);

        expect(listener1).toHaveBeenCalledWith(event);
        expect(listener2).toHaveBeenCalledWith(event);
      });

      it('should return unsubscribe function', () => {
        const listener = vi.fn();
        const unsubscribe = subscribeToKeyboardEvents(listener);

        // First event should trigger listener
        triggerKeyboardEvent({ type: 'show', height: 300 });
        expect(listener).toHaveBeenCalledTimes(1);

        // Unsubscribe
        unsubscribe();

        // Second event should not trigger listener
        triggerKeyboardEvent({ type: 'hide', height: 0 });
        expect(listener).toHaveBeenCalledTimes(1);
      });

      it('should include duration when provided', () => {
        const listener = vi.fn();
        subscribeToKeyboardEvents(listener);

        const event: KeyboardEvent = {
          type: 'show',
          height: 300,
          duration: 250,
        };
        triggerKeyboardEvent(event);

        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            duration: 250,
          })
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid keyboard state changes', () => {
      const listener = vi.fn();
      subscribeToKeyboard(listener);

      // Simulate rapid show/hide
      setKeyboardState({ isVisible: true, height: 300 });
      setKeyboardState({ isVisible: false, height: 0 });
      setKeyboardState({ isVisible: true, height: 346 });

      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('should handle keyboard with zero height when visible', () => {
      setKeyboardState({ isVisible: true, height: 0 });

      expect(isKeyboardVisible()).toBe(true);
      expect(getKeyboardHeight()).toBe(0);
    });

    it('should handle very large keyboard heights', () => {
      setKeyboardState({ isVisible: true, height: 1000 });

      const hidden = wouldBeHiddenByKeyboard(0, 50, 800);

      expect(hidden).toBe(true);
    });
  });
});
