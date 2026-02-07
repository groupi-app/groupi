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

export function registerAddon(addon: AddonDefinition) {
  registry.push(addon);
}

export function getAddonRegistry(): readonly AddonDefinition[] {
  return registry;
}

export function getAddonById(id: string): AddonDefinition | undefined {
  return registry.find(a => a.id === id);
}
