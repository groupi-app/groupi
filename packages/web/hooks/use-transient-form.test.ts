/**
 * Tests for use-transient-form hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useTransientForm, useNavigationDetection } from './use-transient-form';

// Mock next/navigation
let mockPathname = '/initial-path';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

describe('useTransientForm', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
  });

  const defaultValues = {
    name: '',
    email: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/initial-path';
  });

  describe('initial state', () => {
    it('should return a form instance', () => {
      const { result } = renderHook(() =>
        useTransientForm({
          schema: testSchema,
          defaultValues,
        })
      );

      expect(result.current.form).toBeDefined();
      expect(result.current.form.register).toBeDefined();
      expect(result.current.form.handleSubmit).toBeDefined();
    });

    it('should return a resetForm function', () => {
      const { result } = renderHook(() =>
        useTransientForm({
          schema: testSchema,
          defaultValues,
        })
      );

      expect(typeof result.current.resetForm).toBe('function');
    });

    it('should initialize form with default values', () => {
      const { result } = renderHook(() =>
        useTransientForm({
          schema: testSchema,
          defaultValues: { name: 'John', email: 'john@example.com' },
        })
      );

      expect(result.current.form.getValues()).toEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });
  });

  describe('form operations', () => {
    it('should allow setting field values', async () => {
      const { result } = renderHook(() =>
        useTransientForm({
          schema: testSchema,
          defaultValues,
        })
      );

      await act(async () => {
        result.current.form.setValue('name', 'Test Name');
        result.current.form.setValue('email', 'test@example.com');
      });

      expect(result.current.form.getValues()).toEqual({
        name: 'Test Name',
        email: 'test@example.com',
      });
    });

    it('should validate using zod schema', async () => {
      const { result } = renderHook(() =>
        useTransientForm({
          schema: testSchema,
          defaultValues,
        })
      );

      await act(async () => {
        result.current.form.setValue('email', 'invalid-email');
      });

      // Trigger validation and check result
      let isValid: boolean = true;
      await act(async () => {
        isValid = await result.current.form.trigger('email');
      });

      // Validation should fail for invalid email
      expect(isValid).toBe(false);
    });
  });

  describe('resetForm', () => {
    it('should reset form to default values', async () => {
      const { result } = renderHook(() =>
        useTransientForm({
          schema: testSchema,
          defaultValues,
        })
      );

      await act(async () => {
        result.current.form.setValue('name', 'Modified Name');
        result.current.form.setValue('email', 'modified@example.com');
      });

      expect(result.current.form.getValues('name')).toBe('Modified Name');

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.form.getValues()).toEqual(defaultValues);
    });

    it('should call onNavigationReset callback when resetting', () => {
      const onNavigationReset = vi.fn();

      const { result } = renderHook(() =>
        useTransientForm({
          schema: testSchema,
          defaultValues,
          onNavigationReset,
        })
      );

      act(() => {
        result.current.resetForm();
      });

      expect(onNavigationReset).toHaveBeenCalled();
    });

    it('should work without onNavigationReset callback', () => {
      const { result } = renderHook(() =>
        useTransientForm({
          schema: testSchema,
          defaultValues,
        })
      );

      // Should not throw
      expect(() => {
        act(() => {
          result.current.resetForm();
        });
      }).not.toThrow();
    });
  });

  describe('navigation detection', () => {
    it('should reset form on pathname change', async () => {
      const { result, rerender } = renderHook(() =>
        useTransientForm({
          schema: testSchema,
          defaultValues,
        })
      );

      await act(async () => {
        result.current.form.setValue('name', 'Modified Name');
      });

      expect(result.current.form.getValues('name')).toBe('Modified Name');

      // Simulate navigation
      mockPathname = '/new-path';
      rerender();

      // Form should be reset
      expect(result.current.form.getValues('name')).toBe('');
    });

    it('should call onNavigationReset on pathname change', () => {
      const onNavigationReset = vi.fn();

      const { rerender } = renderHook(() =>
        useTransientForm({
          schema: testSchema,
          defaultValues,
          onNavigationReset,
        })
      );

      // Initial render doesn't trigger reset
      expect(onNavigationReset).not.toHaveBeenCalled();

      // Simulate navigation
      mockPathname = '/new-path';
      rerender();

      expect(onNavigationReset).toHaveBeenCalled();
    });

    it('should not reset on initial mount', () => {
      const onNavigationReset = vi.fn();

      renderHook(() =>
        useTransientForm({
          schema: testSchema,
          defaultValues: { name: 'Initial', email: 'initial@example.com' },
          onNavigationReset,
        })
      );

      expect(onNavigationReset).not.toHaveBeenCalled();
    });

    it('should not reset when pathname stays the same', () => {
      const onNavigationReset = vi.fn();

      const { rerender } = renderHook(() =>
        useTransientForm({
          schema: testSchema,
          defaultValues,
          onNavigationReset,
        })
      );

      rerender(); // Same pathname
      rerender(); // Same pathname again

      expect(onNavigationReset).not.toHaveBeenCalled();
    });
  });

  describe('formOptions', () => {
    it('should pass additional options to useForm', async () => {
      const { result } = renderHook(() =>
        useTransientForm({
          schema: testSchema,
          defaultValues,
          formOptions: {
            mode: 'onBlur',
          },
        })
      );

      // Form should still be created successfully with custom options
      expect(result.current.form).toBeDefined();
    });
  });
});

describe('useNavigationDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/initial-path';
  });

  describe('initial state', () => {
    it('should return current pathname', () => {
      const { result } = renderHook(() => useNavigationDetection());

      expect(result.current.pathname).toBe('/initial-path');
    });
  });

  describe('navigation callback', () => {
    it('should call onNavigate when pathname changes', () => {
      const onNavigate = vi.fn();

      const { rerender } = renderHook(() =>
        useNavigationDetection({ onNavigate })
      );

      expect(onNavigate).not.toHaveBeenCalled();

      mockPathname = '/new-path';
      rerender();

      expect(onNavigate).toHaveBeenCalledTimes(1);
    });

    it('should not call onNavigate on initial mount', () => {
      const onNavigate = vi.fn();

      renderHook(() => useNavigationDetection({ onNavigate }));

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('should not call onNavigate when pathname stays the same', () => {
      const onNavigate = vi.fn();

      const { rerender } = renderHook(() =>
        useNavigationDetection({ onNavigate })
      );

      rerender(); // Same pathname
      rerender(); // Same pathname

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('should work without onNavigate callback', () => {
      const { result, rerender } = renderHook(() => useNavigationDetection());

      mockPathname = '/new-path';

      // Should not throw
      expect(() => rerender()).not.toThrow();

      expect(result.current.pathname).toBe('/new-path');
    });

    it('should call onNavigate multiple times for multiple navigations', () => {
      const onNavigate = vi.fn();

      const { rerender } = renderHook(() =>
        useNavigationDetection({ onNavigate })
      );

      mockPathname = '/path-1';
      rerender();

      mockPathname = '/path-2';
      rerender();

      mockPathname = '/path-3';
      rerender();

      expect(onNavigate).toHaveBeenCalledTimes(3);
    });
  });

  describe('pathname updates', () => {
    it('should update returned pathname on navigation', () => {
      const { result, rerender } = renderHook(() => useNavigationDetection());

      expect(result.current.pathname).toBe('/initial-path');

      mockPathname = '/updated-path';
      rerender();

      expect(result.current.pathname).toBe('/updated-path');
    });
  });
});
