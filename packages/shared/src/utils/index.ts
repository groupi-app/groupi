/**
 * Cross-platform utility functions for Groupi
 * These utilities work identically on web and mobile platforms
 */

import type { ValidationResult, FormField, AsyncState } from '../types';

// Re-export specialized utility modules
export * from './device';
export * from './keyboard';
export * from './accessibility';

// Date and time utilities
export function formatDate(date: Date | number): string {
  if (date === null || date === undefined) return 'Invalid Date';
  const d = typeof date === 'number' ? new Date(date) : date;
  if (!isValidDate(d)) return 'Invalid Date';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: Date | number): string {
  if (date === null || date === undefined) return 'Invalid Date';
  const d = typeof date === 'number' ? new Date(date) : date;
  if (!isValidDate(d)) return 'Invalid Date';
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(date: Date | number): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Check if two dates are on the same calendar day
 */
export function isSameDay(date1: Date | number, date2: Date | number): boolean {
  const d1 = typeof date1 === 'number' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'number' ? new Date(date2) : date2;

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Format a date range for display
 * Same day: "Monday, January 16, 2026, 8:00 PM - 9:00 PM"
 * Different day: "Monday, January 16, 2026, 8:00 PM - Tuesday, January 17, 2026, 9:00 AM"
 * No end date: Falls back to just the start date/time
 */
export function formatDateTimeRange(
  startDate: Date | number,
  endDate?: Date | number | null
): string {
  if (startDate === null || startDate === undefined) return 'Invalid Date';

  const start = typeof startDate === 'number' ? new Date(startDate) : startDate;
  if (!isValidDate(start)) return 'Invalid Date';

  // If no end date, just return the start date/time
  if (endDate === null || endDate === undefined) {
    return start.toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  const end = typeof endDate === 'number' ? new Date(endDate) : endDate;
  if (!isValidDate(end)) {
    // Fall back to just start if end is invalid
    return start.toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (isSameDay(start, end)) {
    // Same day: show full date once, then time range
    const dateStr = start.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const startTime = start.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    const endTime = end.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${dateStr}, ${startTime} - ${endTime}`;
  } else {
    // Different days: show both full date/times
    const startStr = start.toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const endStr = end.toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${startStr} - ${endStr}`;
  }
}

/**
 * Format a shorter date range for card displays
 * Same day: "Mon, Jan 16, 8:00 PM - 9:00 PM"
 * Different day: "Mon, Jan 16, 8:00 PM - Tue, Jan 17, 9:00 AM"
 */
export function formatDateTimeRangeShort(
  startDate: Date | number,
  endDate?: Date | number | null
): string {
  if (startDate === null || startDate === undefined) return 'Invalid Date';

  const start = typeof startDate === 'number' ? new Date(startDate) : startDate;
  if (!isValidDate(start)) return 'Invalid Date';

  // If no end date, just return the short start date/time
  if (endDate === null || endDate === undefined) {
    return start.toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  }

  const end = typeof endDate === 'number' ? new Date(endDate) : endDate;
  if (!isValidDate(end)) {
    return start.toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  }

  if (isSameDay(start, end)) {
    // Same day: show date once, then time range
    const dateStr = start.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const startTime = start.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    const endTime = end.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${dateStr}, ${startTime} - ${endTime}`;
  } else {
    // Different days: show both
    const startStr = start.toLocaleString(undefined, {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    const endStr = end.toLocaleString(undefined, {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    return `${startStr} - ${endStr}`;
  }
}

/**
 * Check if an event is in the past
 * Past = end time is in the past OR (no end time AND start date is yesterday or before)
 */
export function isEventPast(
  startDateTime: number | null | undefined,
  endDateTime?: number | null | undefined
): boolean {
  // If no start date, event is TBD - not past
  if (startDateTime === null || startDateTime === undefined) {
    return false;
  }

  const now = Date.now();

  // If there's an end time, use that for comparison
  if (endDateTime !== null && endDateTime !== undefined) {
    return endDateTime < now;
  }

  // No end time: check if start date is before today (yesterday or earlier)
  const startDate = new Date(startDateTime);
  const today = new Date();

  // Set to start of today
  today.setHours(0, 0, 0, 0);

  // Event is past if start date is before today
  return startDate.getTime() < today.getTime();
}

export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

// String utilities
export function truncateText(
  text: string,
  maxLength: number,
  suffix = '...'
): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function generateInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function validateMinLength(value: string, minLength: number): boolean {
  return value.trim().length >= minLength;
}

export function validateMaxLength(value: string, maxLength: number): boolean {
  return value.trim().length <= maxLength;
}

export function createValidator(
  rules: Array<(value: string) => string | null>
): (value: string) => string | null {
  return (value: string) => {
    for (const rule of rules) {
      const error = rule(value);
      if (error) return error;
    }
    return null;
  };
}

// Form utilities
export function createFormField(value = ''): FormField {
  return {
    value,
    error: undefined,
    touched: false,
  };
}

export function validateForm(
  fields: Record<string, FormField>,
  validators: Record<string, (value: string) => string | null>
): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [fieldName, field] of Object.entries(fields)) {
    const validator = validators[fieldName];
    if (validator) {
      const error = validator(field.value);
      if (error) {
        errors[fieldName] = error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
}

// Array utilities
export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<K, T[]>
  );
}

export function uniqueBy<T, K>(array: T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function sortBy<T>(
  array: T[],
  keyFn: (item: T) => string | number
): T[] {
  return [...array].sort((a, b) => {
    const aKey = keyFn(a);
    const bKey = keyFn(b);
    if (aKey < bKey) return -1;
    if (aKey > bKey) return 1;
    return 0;
  });
}

// Async state utilities
export function createAsyncState<T>(data?: T): AsyncState<T> {
  return {
    data,
    loading: false,
    error: undefined,
  };
}

export function setLoading<T>(state: AsyncState<T>): AsyncState<T> {
  return {
    ...state,
    loading: true,
    error: undefined,
  };
}

export function setSuccess<T>(_state: AsyncState<T>, data: T): AsyncState<T> {
  return {
    data,
    loading: false,
    error: undefined,
  };
}

export function setError<T>(
  state: AsyncState<T>,
  error: string
): AsyncState<T> {
  return {
    ...state,
    loading: false,
    error,
  };
}

// Debounce utility (useful for search inputs)
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Parameters<T> | undefined;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), wait);
  };

  debounced.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    lastArgs = undefined;
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      func(...lastArgs);
      lastArgs = undefined;
    }
  };

  return debounced as T & { cancel: () => void; flush: () => void };
}

// Retry utility for network requests
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise<void>(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

// Platform detection helpers
export function getPlatform(): 'web' | 'mobile' {
  // This will need to be set by the platform adapter during initialization
  // Use globalThis which is available in both browser and Node environments
  if (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as { window?: unknown }).window !== 'undefined'
  ) {
    // Web environment
    return 'web';
  }
  // Assume mobile if no window object (React Native)
  return 'mobile';
}

export function isWeb(): boolean {
  return getPlatform() === 'web';
}

export function isMobile(): boolean {
  return getPlatform() === 'mobile';
}

// Error handling utilities
export function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

export function createErrorMessage(operation: string, error: unknown): string {
  const message = serializeError(error);
  return `Failed ${operation}: ${message}`;
}
