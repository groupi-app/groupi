import { type AnyDefinedHandler, isDefinedHandler } from './define';
import { reminderHandler } from './handlers/reminders';
import { questionnaireHandler } from './handlers/questionnaire';
import { bringListHandler } from './handlers/bringList';
import { discordHandler } from './handlers/discord';
import { customAddonHandler } from './handlers/custom';

/**
 * Registry of all add-on handlers, keyed by addon type.
 *
 * Uses a Map instead of a plain object for safer key handling
 * and better iteration semantics.
 */
const handlers = new Map<string, AnyDefinedHandler>();

/**
 * Register a handler created via `defineAddonHandler()`.
 *
 * - Rejects handlers not created via `defineAddonHandler()` (brand check).
 * - Rejects duplicate registrations for the same addon type.
 */
export function registerAddonHandler(handler: AnyDefinedHandler): void {
  if (!isDefinedHandler(handler)) {
    throw new Error(
      'registerAddonHandler: handler must be created via defineAddonHandler()'
    );
  }

  if (handlers.has(handler.type)) {
    throw new Error(
      `registerAddonHandler: handler for type "${handler.type}" is already registered`
    );
  }

  handlers.set(handler.type, handler);
}

// ===== Register first-party handlers =====

registerAddonHandler(reminderHandler);
registerAddonHandler(questionnaireHandler);
registerAddonHandler(bringListHandler);
registerAddonHandler(discordHandler);
registerAddonHandler(customAddonHandler);

// ===== Public accessors =====

/**
 * Get the handler for a given add-on type.
 * Returns undefined if the type is not registered.
 *
 * Custom addons use the `custom:{templateId}` convention.
 * Any type starting with `custom:` falls back to the `__custom__` handler.
 */
export function getAddonHandler(type: string): AnyDefinedHandler | undefined {
  const exact = handlers.get(type);
  if (exact) return exact;
  if (type.startsWith('custom:')) return handlers.get('__custom__');
  return undefined;
}

/**
 * Get all registered add-on handlers.
 */
export function getAllAddonHandlers(): AnyDefinedHandler[] {
  return Array.from(handlers.values());
}
