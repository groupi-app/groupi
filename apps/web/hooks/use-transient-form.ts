'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  useForm,
  type UseFormProps,
  type UseFormReturn,
  type FieldValues,
  type DefaultValues,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

/**
 * Configuration for useTransientForm hook
 */
interface UseTransientFormConfig<TFieldValues extends FieldValues> {
  /**
   * Zod schema for form validation
   */
  schema: z.ZodSchema<TFieldValues>;

  /**
   * Default values for the form (used on initial mount and reset)
   */
  defaultValues: DefaultValues<TFieldValues>;

  /**
   * Additional react-hook-form options
   */
  formOptions?: Omit<UseFormProps<TFieldValues>, 'resolver' | 'defaultValues'>;

  /**
   * Optional callback when form is reset due to navigation
   * Useful for resetting related state (e.g., TipTap editor)
   */
  onNavigationReset?: () => void;
}

/**
 * Return type for useTransientForm hook
 */
interface UseTransientFormReturn<TFieldValues extends FieldValues> {
  /**
   * The react-hook-form form instance
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TFieldValues, any, TFieldValues>;

  /**
   * Manually reset the form to default values
   */
  resetForm: () => void;
}

/**
 * A hook for forms that should reset their state on navigation.
 *
 * NOTE: For most cases, prefer the explicit reset pattern instead:
 * - Call resetForm() in onSuccess before router.push()
 * - Call resetForm() in handleLeave before router.push()
 *
 * This hook is useful when you need automatic navigation-based reset
 * (e.g., for search filters that should clear when leaving the page).
 *
 * @see docs/STATE_ARCHITECTURE.md for the full state management guide
 */
export function useTransientForm<TFieldValues extends FieldValues>({
  schema,
  defaultValues,
  formOptions,
  onNavigationReset,
}: UseTransientFormConfig<TFieldValues>): UseTransientFormReturn<TFieldValues> {
  const pathname = usePathname();

  // Track whether we've completed initial mount
  const hasInitializedRef = useRef(false);

  // Track the previous pathname for navigation detection
  const prevPathnameRef = useRef<string | null>(null);

  // Create the form with zod resolver
  const form = useForm<TFieldValues>({
    // @ts-expect-error - zodResolver generic inference is complex
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
    ...formOptions,
  });

  // Manual reset function
  const resetForm = useCallback(() => {
    form.reset(defaultValues);
    onNavigationReset?.();
  }, [form, defaultValues, onNavigationReset]);

  // Navigation detection and reset logic
  useEffect(() => {
    // First mount - just initialize refs, don't reset
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevPathnameRef.current = pathname;
      return;
    }

    // Check if pathname changed (navigation occurred)
    if (prevPathnameRef.current !== pathname) {
      // Navigation detected - reset the form
      form.reset(defaultValues);
      onNavigationReset?.();
      prevPathnameRef.current = pathname;
    }
  }, [pathname, form, defaultValues, onNavigationReset]);

  return {
    form,
    resetForm,
  } as unknown as UseTransientFormReturn<TFieldValues>;
}

/**
 * Hook for detecting navigation without form management.
 *
 * Use this when you need navigation detection for custom reset logic
 * but aren't using react-hook-form.
 */
export function useNavigationDetection({
  onNavigate,
}: {
  onNavigate?: () => void;
} = {}): {
  pathname: string;
} {
  const pathname = usePathname();
  const hasInitializedRef = useRef(false);
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevPathnameRef.current = pathname;
      return;
    }

    if (prevPathnameRef.current !== pathname) {
      onNavigate?.();
      prevPathnameRef.current = pathname;
    }
  }, [pathname, onNavigate]);

  return {
    pathname,
  };
}
