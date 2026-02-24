import type { AddonContext, TrustedAddonContext } from './context';
import type { Id } from '../_generated/dataModel';

/**
 * Private brand symbol. Only handlers created via defineAddonHandler()
 * will carry this symbol, preventing forged handler objects.
 */
const HANDLER_BRAND = Symbol.for('groupi.addon.handler');

// ===== Handler definition types =====

/**
 * Lifecycle hooks for a standard (restricted) add-on handler.
 */
export interface StandardHandlerDef {
  type: string;
  trusted?: false;
  validateConfig: (config: unknown) => boolean;
  onEnabled?: (ctx: AddonContext, config: unknown) => Promise<void>;
  onDisabled?: (ctx: AddonContext) => Promise<void>;
  onConfigUpdated?: (
    ctx: AddonContext,
    oldConfig: unknown,
    newConfig: unknown
  ) => Promise<void>;
  onDateChosen?: (
    ctx: AddonContext,
    chosenDateTime: number,
    config: unknown
  ) => Promise<void>;
  onDateReset?: (ctx: AddonContext, config: unknown) => Promise<void>;
  onEventUpdated?: (ctx: AddonContext, config: unknown) => Promise<void>;
  onEventDeleted?: (ctx: AddonContext) => Promise<void>;
  onDataSubmitted?: (
    ctx: AddonContext,
    key: string,
    data: unknown,
    submitterId: Id<'persons'>
  ) => Promise<void>;
  onMemberJoined?: (
    ctx: AddonContext,
    personId: Id<'persons'>
  ) => Promise<void>;
  onMemberLeft?: (ctx: AddonContext, personId: Id<'persons'>) => Promise<void>;
}

/**
 * Lifecycle hooks for a trusted (first-party) add-on handler.
 */
export interface TrustedHandlerDef {
  type: string;
  trusted: true;
  validateConfig: (config: unknown) => boolean;
  onEnabled?: (ctx: TrustedAddonContext, config: unknown) => Promise<void>;
  onDisabled?: (ctx: TrustedAddonContext) => Promise<void>;
  onConfigUpdated?: (
    ctx: TrustedAddonContext,
    oldConfig: unknown,
    newConfig: unknown
  ) => Promise<void>;
  onDateChosen?: (
    ctx: TrustedAddonContext,
    chosenDateTime: number,
    config: unknown
  ) => Promise<void>;
  onDateReset?: (ctx: TrustedAddonContext, config: unknown) => Promise<void>;
  onEventUpdated?: (ctx: TrustedAddonContext, config: unknown) => Promise<void>;
  onEventDeleted?: (ctx: TrustedAddonContext) => Promise<void>;
  onDataSubmitted?: (
    ctx: TrustedAddonContext,
    key: string,
    data: unknown,
    submitterId: Id<'persons'>
  ) => Promise<void>;
  onMemberJoined?: (
    ctx: TrustedAddonContext,
    personId: Id<'persons'>
  ) => Promise<void>;
  onMemberLeft?: (
    ctx: TrustedAddonContext,
    personId: Id<'persons'>
  ) => Promise<void>;
}

// ===== Branded handler type (returned by defineAddonHandler) =====

export interface DefinedAddonHandler {
  readonly [HANDLER_BRAND]: true;
  readonly type: string;
  readonly trusted: boolean;
  readonly validateConfig: (config: unknown) => boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly onEnabled?: (ctx: any, config: unknown) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly onDisabled?: (ctx: any) => Promise<void>;
  readonly onConfigUpdated?: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx: any,
    oldConfig: unknown,
    newConfig: unknown
  ) => Promise<void>;
  readonly onDateChosen?: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx: any,
    chosenDateTime: number,
    config: unknown
  ) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly onDateReset?: (ctx: any, config: unknown) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly onEventUpdated?: (ctx: any, config: unknown) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly onEventDeleted?: (ctx: any) => Promise<void>;
  readonly onDataSubmitted?: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx: any,
    key: string,
    data: unknown,
    submitterId: Id<'persons'>
  ) => Promise<void>;

  readonly onMemberJoined?: (
    ctx: any,
    personId: Id<'persons'>
  ) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly onMemberLeft?: (ctx: any, personId: Id<'persons'>) => Promise<void>;
}

/**
 * Union type for any handler created via defineAddonHandler().
 */
export type AnyDefinedHandler = DefinedAddonHandler;

// ===== Builder function =====

/**
 * Define a new add-on handler with runtime validation.
 *
 * Standard handlers receive an `AddonContext` with scoped data access.
 * Trusted handlers receive a `TrustedAddonContext` with full DB/scheduler access.
 *
 * @example
 * ```ts
 * // Standard addon (restricted context)
 * export const myHandler = defineAddonHandler({
 *   type: 'my-addon',
 *   validateConfig: isValidMyConfig,
 *   onDisabled: async (ctx) => { await ctx.deleteAllAddonData(); },
 * });
 *
 * // Trusted addon (full access)
 * export const reminderHandler = defineAddonHandler({
 *   type: 'reminders',
 *   trusted: true,
 *   validateConfig: isValidReminderConfig,
 *   onEnabled: async (ctx, config) => {
 *     await ctx.rawCtx.scheduler.runAfter(...);
 *   },
 * });
 * ```
 */
export function defineAddonHandler(
  def: StandardHandlerDef | TrustedHandlerDef
): DefinedAddonHandler {
  // --- Runtime validation at definition time ---
  if (!def.type || typeof def.type !== 'string') {
    throw new Error(
      'defineAddonHandler: `type` is required and must be a non-empty string'
    );
  }
  if (typeof def.validateConfig !== 'function') {
    throw new Error(
      `defineAddonHandler(${def.type}): \`validateConfig\` is required and must be a function`
    );
  }

  const lifecycleKeys = [
    'onEnabled',
    'onDisabled',
    'onConfigUpdated',
    'onDateChosen',
    'onDateReset',
    'onEventUpdated',
    'onEventDeleted',
    'onDataSubmitted',
    'onMemberJoined',
    'onMemberLeft',
  ] as const;

  for (const key of lifecycleKeys) {
    const value = def[key];
    if (value !== undefined && typeof value !== 'function') {
      throw new Error(
        `defineAddonHandler(${def.type}): \`${key}\` must be a function if provided`
      );
    }
  }

  // --- Wrap validateConfig in try/catch ---
  const safeValidateConfig = (config: unknown): boolean => {
    try {
      return def.validateConfig(config);
    } catch (error) {
      console.error(
        `Addon ${def.type}: validateConfig threw an error, returning false`,
        error
      );
      return false;
    }
  };

  // Build the branded handler object
  const handler = {
    [HANDLER_BRAND]: true as const,
    type: def.type,
    trusted: !!def.trusted,
    validateConfig: safeValidateConfig,
    onEnabled: def.onEnabled,
    onDisabled: def.onDisabled,
    onConfigUpdated: def.onConfigUpdated,
    onDateChosen: def.onDateChosen,
    onDateReset: def.onDateReset,
    onEventUpdated: def.onEventUpdated,
    onEventDeleted: def.onEventDeleted,
    onDataSubmitted: def.onDataSubmitted,
    onMemberJoined: def.onMemberJoined,
    onMemberLeft: def.onMemberLeft,
  };

  return Object.freeze(handler) as DefinedAddonHandler;
}

/**
 * Check if an object is a handler created via defineAddonHandler().
 */
export function isDefinedHandler(value: unknown): value is AnyDefinedHandler {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<symbol, unknown>)[HANDLER_BRAND] === true
  );
}
