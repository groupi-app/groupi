/**
 * Comprehensive tests for shared utility functions
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  isValidDate,
  truncateText,
  capitalizeFirst,
  generateInitials,
  sanitizeInput,
  validateEmail,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  createValidator,
  createFormField,
  validateForm,
  groupBy,
  uniqueBy,
  sortBy,
  createAsyncState,
  setLoading,
  setSuccess,
  setError,
  debounce,
  retry,
  getPlatform,
  isWeb,
  isMobile,
  serializeError,
  createErrorMessage,
} from '../index';
import {
  TestSetup,
  DateTestHelpers,
  ValidationTestHelpers,
  AsyncTestHelpers,
} from '../../test-helpers';

describe('Shared Utils', () => {
  beforeEach(() => {
    TestSetup.beforeEach();
  });

  afterEach(() => {
    TestSetup.afterEach();
  });

  describe('Date/Time Functions', () => {
    const testDates = DateTestHelpers.createTestDates();

    describe('formatDate', () => {
      it('should format date as locale string', () => {
        const result = formatDate(testDates.present);
        // Accept any reasonable date format (MM/DD/YYYY, Mon DD, YYYY, etc.)
        expect(result).toMatch(/\d+/); // Should contain at least one number
        expect(result.length).toBeGreaterThan(8); // Should be a reasonable date string
        expect(result).not.toBe('Invalid Date');
      });

      it('should handle invalid date', () => {
        const result = formatDate(new Date('invalid'));
        expect(result).toBe('Invalid Date');
      });

      it('should handle null/undefined', () => {
        expect(formatDate(null as any)).toBe('Invalid Date');
        expect(formatDate(undefined as any)).toBe('Invalid Date');
      });
    });

    describe('formatTime', () => {
      it('should format time with hour12 format', () => {
        const result = formatTime(testDates.present);
        expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
      });

      it('should handle invalid date', () => {
        const result = formatTime(new Date('invalid'));
        expect(result).toBe('Invalid Date');
      });
    });

    describe('formatDateTime', () => {
      it('should combine date and time', () => {
        const result = formatDateTime(testDates.present);
        expect(result).toContain('at');
        // More flexible regex that handles different locale formats
        expect(result).toMatch(/.+\s+at\s+\d{1,2}:\d{2}\s?(AM|PM)/i);
      });

      it('should handle invalid date', () => {
        const result = formatDateTime(new Date('invalid'));
        expect(result).toBe('Invalid Date at Invalid Date');
      });
    });

    describe('isValidDate', () => {
      it('should return true for valid dates', () => {
        expect(isValidDate(testDates.present)).toBe(true);
        expect(isValidDate(new Date())).toBe(true);
      });

      it('should return false for invalid dates', () => {
        expect(isValidDate(new Date('invalid'))).toBe(false);
        expect(isValidDate(null as any)).toBe(false);
        expect(isValidDate(undefined as any)).toBe(false);
        expect(isValidDate('string' as any)).toBe(false);
      });
    });
  });

  describe('String Functions', () => {
    describe('truncateText', () => {
      it('should truncate long text with default suffix', () => {
        const text = 'This is a very long text that needs to be truncated';
        const result = truncateText(text, 20);
        expect(result).toBe('This is a very lo...');
        expect(result.length).toBe(20); // Exactly maxLength
      });

      it('should return original text if shorter than maxLength', () => {
        const text = 'Short text';
        const result = truncateText(text, 20);
        expect(result).toBe(text);
      });

      it('should use custom suffix', () => {
        const text = 'This is a long text';
        const result = truncateText(text, 10, ' [more]');
        expect(result).toBe('Thi [more]'); // 3 chars + 7 char suffix = 10 total
      });

      it('should handle empty string', () => {
        expect(truncateText('', 10)).toBe('');
      });
    });

    describe('capitalizeFirst', () => {
      it('should capitalize first letter', () => {
        expect(capitalizeFirst('hello')).toBe('Hello');
        expect(capitalizeFirst('HELLO')).toBe('Hello');
        expect(capitalizeFirst('hELLO')).toBe('Hello');
      });

      it('should handle empty string', () => {
        expect(capitalizeFirst('')).toBe('');
      });

      it('should handle single character', () => {
        expect(capitalizeFirst('a')).toBe('A');
      });
    });

    describe('generateInitials', () => {
      it('should generate initials from first and last name', () => {
        expect(generateInitials('John', 'Doe')).toBe('JD');
        expect(generateInitials('jane', 'smith')).toBe('JS');
      });

      it('should handle empty names', () => {
        expect(generateInitials('', 'Doe')).toBe('D');
        expect(generateInitials('John', '')).toBe('J');
        expect(generateInitials('', '')).toBe('');
      });

      it('should use first character of each name', () => {
        expect(generateInitials('John-Paul', 'Van Der Berg')).toBe('JV');
      });
    });

    describe('sanitizeInput', () => {
      it('should trim whitespace', () => {
        expect(sanitizeInput('  hello world  ')).toBe('hello world');
      });

      it('should normalize internal whitespace', () => {
        expect(sanitizeInput('hello    world')).toBe('hello world');
        expect(sanitizeInput('hello\n\tworld')).toBe('hello world');
      });

      it('should handle empty string', () => {
        expect(sanitizeInput('')).toBe('');
        expect(sanitizeInput('   ')).toBe('');
      });
    });
  });

  describe('Validation Functions', () => {
    describe('validateEmail', () => {
      it('should validate correct email addresses', () => {
        ValidationTestHelpers.emailTestCases.valid.forEach(email => {
          expect(validateEmail(email)).toBe(true);
        });
      });

      it('should reject invalid email addresses', () => {
        ValidationTestHelpers.emailTestCases.invalid.forEach(email => {
          expect(validateEmail(email)).toBe(false);
        });
      });
    });

    describe('validateRequired', () => {
      it('should pass for non-empty values', () => {
        ValidationTestHelpers.requiredFieldTestCases.valid.forEach(value => {
          expect(validateRequired(value)).toBe(true);
        });
      });

      it('should fail for empty values', () => {
        ValidationTestHelpers.requiredFieldTestCases.invalid.forEach(value => {
          expect(validateRequired(value)).toBe(false);
        });
      });
    });

    describe('validateMinLength', () => {
      it('should pass for strings meeting minimum length', () => {
        expect(validateMinLength('hello', 3)).toBe(true);
        expect(validateMinLength('hello', 5)).toBe(true);
      });

      it('should fail for strings below minimum length', () => {
        expect(validateMinLength('hi', 3)).toBe(false);
        expect(validateMinLength('', 1)).toBe(false);
      });
    });

    describe('validateMaxLength', () => {
      it('should pass for strings within maximum length', () => {
        expect(validateMaxLength('hello', 10)).toBe(true);
        expect(validateMaxLength('hello', 5)).toBe(true);
      });

      it('should fail for strings exceeding maximum length', () => {
        expect(validateMaxLength('hello world', 5)).toBe(false);
      });
    });

    describe('createValidator', () => {
      it('should combine multiple validation rules', () => {
        const validator = createValidator([
          value => (validateRequired(value) ? null : 'Field is required'),
          value => (validateEmail(value) ? null : 'Invalid email format'),
        ]);

        expect(validator('test@example.com')).toBe(null);
        expect(validator('')).toBe('Field is required');
        expect(validator('invalid-email')).toBe('Invalid email format');
      });

      it('should return first failing validation message', () => {
        const validator = createValidator([
          value => (validateRequired(value) ? null : 'Required'),
          value => (validateMinLength(value, 5) ? null : 'Too short'),
        ]);

        expect(validator('')).toBe('Required');
        expect(validator('hi')).toBe('Too short');
      });
    });
  });

  describe('Form Functions', () => {
    describe('createFormField', () => {
      it('should create form field with initial value', () => {
        const field = createFormField('test value');
        expect(field).toEqual({
          value: 'test value',
          error: undefined,
          touched: false,
        });
      });

      it('should handle empty value', () => {
        const field = createFormField('');
        expect(field.value).toBe('');
      });
    });

    describe('validateForm', () => {
      it('should validate all form fields', () => {
        const fields = ValidationTestHelpers.createFormTestData();
        const validators = {
          email: createValidator([
            v => (validateEmail(v) ? null : 'Invalid email'),
          ]),
          password: createValidator([
            v => (validateMinLength(v, 6) ? null : 'Too short'),
          ]),
        };

        const result = validateForm(fields, validators);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('should return validation errors', () => {
        const fields = ValidationTestHelpers.createFormTestData({
          email: { value: 'invalid-email', error: undefined, touched: true },
          password: { value: '123', error: undefined, touched: true },
        });
        const validators = {
          email: createValidator([
            v => (validateEmail(v) ? null : 'Invalid email'),
          ]),
          password: createValidator([
            v => (validateMinLength(v, 6) ? null : 'Too short'),
          ]),
        };

        const result = validateForm(fields, validators);
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual({
          email: 'Invalid email',
          password: 'Too short',
        });
      });
    });
  });

  describe('Array Functions', () => {
    const testArray = [
      { id: 1, name: 'John', age: 25, category: 'A' },
      { id: 2, name: 'Jane', age: 30, category: 'B' },
      { id: 3, name: 'Bob', age: 25, category: 'A' },
      { id: 4, name: 'Alice', age: 35, category: 'B' },
    ];

    describe('groupBy', () => {
      it('should group array by key function', () => {
        const result = groupBy(testArray, item => item.category);
        expect(result).toEqual({
          A: [
            { id: 1, name: 'John', age: 25, category: 'A' },
            { id: 3, name: 'Bob', age: 25, category: 'A' },
          ],
          B: [
            { id: 2, name: 'Jane', age: 30, category: 'B' },
            { id: 4, name: 'Alice', age: 35, category: 'B' },
          ],
        });
      });

      it('should handle empty array', () => {
        const result = groupBy([], item => item.category);
        expect(result).toEqual({});
      });
    });

    describe('uniqueBy', () => {
      it('should remove duplicates by key function', () => {
        const arrayWithDuplicates = [
          ...testArray,
          { id: 5, name: 'John', age: 28, category: 'C' }, // duplicate name
        ];

        const result = uniqueBy(arrayWithDuplicates, item => item.name);
        expect(result).toHaveLength(4);
        expect(result.map(item => item.name)).toEqual([
          'John',
          'Jane',
          'Bob',
          'Alice',
        ]);
      });

      it('should handle empty array', () => {
        const result = uniqueBy([], item => item.id);
        expect(result).toEqual([]);
      });
    });

    describe('sortBy', () => {
      it('should sort array by key function', () => {
        const result = sortBy(testArray, item => item.age);
        expect(result.map(item => item.age)).toEqual([25, 25, 30, 35]);
      });

      it('should handle string sorting', () => {
        const result = sortBy(testArray, item => item.name);
        expect(result.map(item => item.name)).toEqual([
          'Alice',
          'Bob',
          'Jane',
          'John',
        ]);
      });

      it('should handle empty array', () => {
        const result = sortBy([], item => item.id);
        expect(result).toEqual([]);
      });
    });
  });

  describe('Async State Functions', () => {
    const testCases = AsyncTestHelpers.createAsyncStateTestCases();

    describe('createAsyncState', () => {
      it('should create initial async state', () => {
        const state = createAsyncState();
        expect(state).toEqual(testCases.initial);
      });

      it('should create async state with initial data', () => {
        const data = { id: 123 };
        const state = createAsyncState(data);
        expect(state).toEqual({
          data,
          loading: false,
          error: undefined,
        });
      });
    });

    describe('setLoading', () => {
      it('should set loading state', () => {
        const state = testCases.initial;
        const loadingState = setLoading(state);
        expect(loadingState).toEqual(testCases.loading);
      });
    });

    describe('setSuccess', () => {
      it('should set success state', () => {
        const state = testCases.loading;
        const data = { id: 123 };
        const successState = setSuccess(state, data);
        expect(successState).toEqual(testCases.success);
      });
    });

    describe('setError', () => {
      it('should set error state', () => {
        const state = testCases.loading;
        const errorMessage = 'Test error';
        const errorState = setError(state, errorMessage);
        expect(errorState).toEqual(testCases.error);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('debounce', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should debounce function calls', () => {
        const mockFn = vi.fn();
        const debouncedFn = debounce(mockFn, 100);

        debouncedFn('arg1');
        debouncedFn('arg2');
        debouncedFn('arg3');

        expect(mockFn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(100);
        expect(mockFn).toHaveBeenCalledOnce();
        expect(mockFn).toHaveBeenCalledWith('arg3');
      });

      it('should support cancellation', () => {
        const mockFn = vi.fn();
        const debouncedFn = debounce(mockFn, 100);

        debouncedFn('arg1');
        debouncedFn.cancel();

        vi.advanceTimersByTime(200);
        expect(mockFn).not.toHaveBeenCalled();
      });

      it('should support immediate flush', () => {
        const mockFn = vi.fn();
        const debouncedFn = debounce(mockFn, 100);

        debouncedFn('arg1');
        debouncedFn.flush();

        expect(mockFn).toHaveBeenCalledWith('arg1');
      });
    });

    describe('retry', () => {
      it('should retry failed function', async () => {
        let attempts = 0;
        const mockFn = vi.fn().mockImplementation(() => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary failure');
          }
          return 'success';
        });

        const result = await retry(mockFn, 3, 10);
        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(3);
      });

      it('should throw after max attempts', async () => {
        const mockFn = vi
          .fn()
          .mockRejectedValue(new Error('Persistent failure'));

        await expect(retry(mockFn, 2, 10)).rejects.toThrow(
          'Persistent failure'
        );
        expect(mockFn).toHaveBeenCalledTimes(2);
      });
    });

    describe('getPlatform', () => {
      it('should detect web platform', () => {
        // Mock window object
        Object.defineProperty(global, 'window', {
          value: {},
          writable: true,
        });

        expect(getPlatform()).toBe('web');
      });

      it('should detect mobile platform when window is undefined', () => {
        Object.defineProperty(global, 'window', {
          value: undefined,
          writable: true,
        });

        expect(getPlatform()).toBe('mobile');
      });
    });

    describe('isWeb and isMobile', () => {
      it('should correctly identify web platform', () => {
        Object.defineProperty(global, 'window', {
          value: {},
          writable: true,
        });

        expect(isWeb()).toBe(true);
        expect(isMobile()).toBe(false);
      });

      it('should correctly identify mobile platform', () => {
        Object.defineProperty(global, 'window', {
          value: undefined,
          writable: true,
        });

        expect(isWeb()).toBe(false);
        expect(isMobile()).toBe(true);
      });
    });

    describe('serializeError', () => {
      it('should serialize Error objects', () => {
        const error = new Error('Test error');
        expect(serializeError(error)).toBe('Test error');
      });

      it('should handle string errors', () => {
        expect(serializeError('String error')).toBe('String error');
      });

      it('should handle unknown errors', () => {
        expect(serializeError(null)).toBe('Unknown error');
        expect(serializeError(undefined)).toBe('Unknown error');
        expect(serializeError({})).toBe('Unknown error');
      });
    });

    describe('createErrorMessage', () => {
      it('should create formatted error message', () => {
        const error = new Error('Network timeout');
        const message = createErrorMessage('saving post', error);
        expect(message).toBe('Failed saving post: Network timeout');
      });

      it('should handle string errors', () => {
        const message = createErrorMessage('loading data', 'Connection failed');
        expect(message).toBe('Failed loading data: Connection failed');
      });

      it('should handle unknown errors', () => {
        const message = createErrorMessage('updating profile', null);
        expect(message).toBe('Failed updating profile: Unknown error');
      });
    });
  });
});
