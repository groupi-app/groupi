import type { AddonDefinition } from './types';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Validate a built-in definition before including it in the explicit catalog.
 *
 * - Validates required fields: id, name, description, iconName, components, functions.
 * - Validates gating consistency: `completionRoute` required when `requiresCompletion` is true.
 * - In development: throws on validation failure.
 * - In production: logs error and skips the invalid definition.
 */
export function validateAddon(addon: AddonDefinition): boolean {
  // --- Required field checks ---
  const errors: string[] = [];

  if (!addon.id || typeof addon.id !== 'string') {
    errors.push('`id` is required and must be a non-empty string');
  }
  if (!addon.name || typeof addon.name !== 'string') {
    errors.push('`name` is required and must be a non-empty string');
  }
  if (!addon.description || typeof addon.description !== 'string') {
    errors.push('`description` is required and must be a non-empty string');
  }
  if (!addon.iconName) {
    errors.push('`iconName` is required');
  }
  if (!addon.CreateConfigComponent) {
    errors.push('`CreateConfigComponent` is required');
  }
  if (!addon.EventCardComponent) {
    errors.push('`EventCardComponent` is required');
  }
  if (!addon.ManageConfigComponent) {
    errors.push('`ManageConfigComponent` is required');
  }
  if (typeof addon.isEnabled !== 'function') {
    errors.push('`isEnabled` must be a function');
  }
  if (typeof addon.onEnable !== 'function') {
    errors.push('`onEnable` must be a function');
  }
  if (typeof addon.onDisable !== 'function') {
    errors.push('`onDisable` must be a function');
  }
  if (typeof addon.getConfigFromFormState !== 'function') {
    errors.push('`getConfigFromFormState` must be a function');
  }

  // --- Gating consistency ---
  if (addon.requiresCompletion && !addon.completionRoute) {
    errors.push(
      '`completionRoute` is required when `requiresCompletion` is true'
    );
  }

  if (errors.length > 0) {
    const message = `validateAddon("${addon.id || 'unknown'}"): validation failed:\n  - ${errors.join('\n  - ')}`;
    if (isDev) {
      throw new Error(message);
    } else {
      console.error(message);
      return false;
    }
  }

  return true;
}
