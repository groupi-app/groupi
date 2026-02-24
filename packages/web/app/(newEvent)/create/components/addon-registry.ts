import { type ComponentType } from 'react';
import { type Icons } from '@/components/icons';
import { type FormState } from './form-context';
import { type Id } from '@/convex/_generated/dataModel';

// ===== Create Wizard Props =====

export interface AddonConfigProps {
  formState: FormState;
  setFormState: (state: FormState) => void;
}

// ===== Event Page Props =====

export interface EventCardProps {
  eventId: Id<'events'>;
  config: Record<string, unknown>;
  chosenDateTime?: number;
}

// ===== Manage Page Props =====

export interface ManageConfigProps {
  eventId: Id<'events'>;
  config: Record<string, unknown> | null;
  chosenDateTime?: number;
  onSave: (config: Record<string, unknown>) => Promise<void>;
  onDisable: () => Promise<void>;
  isSaving: boolean;
}

// ===== Addon Page Props =====

export interface AddonPageProps {
  eventId: Id<'events'>;
  config: Record<string, unknown> | null;
}

// ===== Addon Definition =====

export interface AddonAuthor {
  name: string;
  url?: string;
}

export interface AddonDefinition {
  id: string;
  name: string;
  description: string;
  iconName: keyof typeof Icons;
  /** Author metadata — shown in the marketplace (Phase 2) */
  author?: AddonAuthor;

  // Create wizard — config component shown when addon is toggled on
  CreateConfigComponent: ComponentType<AddonConfigProps>;
  isEnabled: (formState: FormState) => boolean;
  onEnable: (formState: FormState) => Partial<FormState>;
  onDisable: (formState: FormState) => Partial<FormState>;
  getConfigFromFormState: (
    formState: FormState
  ) => Record<string, unknown> | null;

  // Event page display — card shown in the add-ons section
  EventCardComponent: ComponentType<EventCardProps>;

  // Manage page — config UI for editing the addon after creation
  ManageConfigComponent: ComponentType<ManageConfigProps>;

  // Dedicated addon page (optional — not all addons need one)
  PageComponent?: ComponentType<AddonPageProps>;
  pageTitle?: string;

  // Opt-out support
  supportsOptOut: boolean;
  optOutLabel?: string;

  // Gating — if true, members must complete this addon before accessing event content
  requiresCompletion?: boolean;
  /** Route to redirect to when incomplete (relative to /event/[eventId]) */
  completionRoute?: string;
}

/**
 * Backward-compatible alias for the create wizard subset.
 * Used by AddonToggleCard which only needs create-wizard fields.
 */
export type AddonConfig = AddonDefinition;

// Registry is populated after components are defined to avoid circular imports.
// Use getAddonRegistry() to access the list.
const registry: AddonDefinition[] = [];

const isDev = process.env.NODE_ENV === 'development';

/**
 * Validate and register a frontend addon definition.
 *
 * - Rejects duplicate registrations (same `id`).
 * - Validates required fields: id, name, description, iconName, components, functions.
 * - Validates gating consistency: `completionRoute` required when `requiresCompletion` is true.
 * - In development: throws on validation failure.
 * - In production: logs error and skips registration.
 */
export function registerAddon(addon: AddonDefinition) {
  // --- Duplicate detection ---
  if (registry.some(a => a.id === addon.id)) {
    if (isDev) {
      console.warn(
        `registerAddon: addon "${addon.id}" is already registered, skipping duplicate`
      );
    }
    return;
  }

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
    const message = `registerAddon("${addon.id || 'unknown'}"): validation failed:\n  - ${errors.join('\n  - ')}`;
    if (isDev) {
      throw new Error(message);
    } else {
      console.error(message);
      return;
    }
  }

  registry.push(addon);
}

export function getAddonRegistry(): readonly AddonDefinition[] {
  return registry;
}

export function getAddonById(id: string): AddonDefinition | undefined {
  return registry.find(a => a.id === id);
}
