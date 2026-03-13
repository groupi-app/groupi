import type { AutomationCondition, VariableContext } from './types';

/**
 * Evaluate all conditions (AND logic). Returns true if all conditions pass.
 * An empty conditions array always passes.
 */
export function evaluateConditions(
  conditions: AutomationCondition[],
  ctx: VariableContext
): boolean {
  if (conditions.length === 0) return true;

  for (const condition of conditions) {
    if (!evaluateSingleCondition(condition, ctx)) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate a single condition against the variable context.
 */
function evaluateSingleCondition(
  condition: AutomationCondition,
  ctx: VariableContext
): boolean {
  const fieldValue = resolveFieldPath(ctx, condition.field);
  const compareValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return looseEquals(fieldValue, compareValue);

    case 'not_equals':
      return !looseEquals(fieldValue, compareValue);

    case 'contains':
      return containsValue(fieldValue, compareValue);

    case 'not_contains':
      return !containsValue(fieldValue, compareValue);

    case 'greater_than':
      return toNumber(fieldValue) > toNumber(compareValue);

    case 'less_than':
      return toNumber(fieldValue) < toNumber(compareValue);

    case 'greater_or_equal':
      return toNumber(fieldValue) >= toNumber(compareValue);

    case 'less_or_equal':
      return toNumber(fieldValue) <= toNumber(compareValue);

    case 'is_empty':
      return isEmpty(fieldValue);

    case 'is_not_empty':
      return !isEmpty(fieldValue);

    case 'in_list':
      return inList(fieldValue, compareValue);

    case 'not_in_list':
      return !inList(fieldValue, compareValue);

    default:
      return false;
  }
}

/**
 * Resolve a dot-path against the VariableContext.
 */
function resolveFieldPath(ctx: VariableContext, path: string): unknown {
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = ctx;

  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    if (typeof current !== 'object') return undefined;
    current = current[part];
  }

  return current;
}

/**
 * Loose equality comparison — coerces strings and numbers.
 */
function looseEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;

  // String comparison (case-insensitive)
  if (typeof a === 'string' && typeof b === 'string') {
    return a.toLowerCase() === b.toLowerCase();
  }

  // Number comparison with coercion
  if (typeof a === 'number' || typeof b === 'number') {
    return toNumber(a) === toNumber(b);
  }

  // Boolean
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b;
  }

  // String to boolean coercion
  if (typeof a === 'boolean' && typeof b === 'string') {
    return a === (b.toLowerCase() === 'true');
  }
  if (typeof b === 'boolean' && typeof a === 'string') {
    return b === (a.toLowerCase() === 'true');
  }

  return String(a) === String(b);
}

/**
 * Check if fieldValue contains compareValue.
 */
function containsValue(fieldValue: unknown, compareValue: unknown): boolean {
  if (typeof fieldValue === 'string' && typeof compareValue === 'string') {
    return fieldValue.toLowerCase().includes(compareValue.toLowerCase());
  }

  if (Array.isArray(fieldValue)) {
    return fieldValue.some(item => looseEquals(item, compareValue));
  }

  return false;
}

/**
 * Safely convert to number.
 */
function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

/**
 * Check if a value is considered "empty".
 */
function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object')
    return Object.keys(value as object).length === 0;
  return false;
}

/**
 * Check if fieldValue is in a list (compareValue should be an array).
 */
function inList(fieldValue: unknown, compareValue: unknown): boolean {
  if (!Array.isArray(compareValue)) return false;
  return compareValue.some(item => looseEquals(fieldValue, item));
}
