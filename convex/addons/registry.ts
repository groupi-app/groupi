import { type AddonHandler, type AddonType } from './types';
import { reminderHandler } from './handlers/reminders';
import { questionnaireHandler } from './handlers/questionnaire';

/**
 * Static registry of all add-on handlers.
 * First-party add-ons register here; future user add-ons will
 * use a config-driven lookup with webhook dispatch.
 */
const handlers: Record<string, AddonHandler> = {
  [reminderHandler.type]: reminderHandler,
  [questionnaireHandler.type]: questionnaireHandler,
};

/**
 * Get the handler for a given add-on type.
 * Returns undefined if the type is not registered.
 */
export function getAddonHandler(
  type: AddonType | string
): AddonHandler | undefined {
  return handlers[type];
}

/**
 * Get all registered add-on handlers.
 */
export function getAllAddonHandlers(): AddonHandler[] {
  return Object.values(handlers);
}
