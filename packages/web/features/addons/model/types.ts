import { type ComponentType } from 'react';
import { type Icons } from '@/components/icons';
import { type Id } from '@/convex/_generated/dataModel';

export interface AddonCreationState {
  addonConfigs?: Record<string, Record<string, unknown>>;
  dateType?: 'single' | 'multi';
  singleDateTime?: { startDateTime: string; endDateTime?: string };
  multiDateTimeOptions?: Array<{ start: string; end?: string }>;
}

// ===== Create Wizard Props =====

export interface AddonConfigProps {
  addonId?: string;
  formState: AddonCreationState;
  setFormState: (state: AddonCreationState) => void;
}

// ===== Event Page Props =====

export interface EventCardProps {
  addonType?: string;
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
  addonType?: string;
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
  isEnabled: (formState: AddonCreationState) => boolean;
  onEnable: (formState: AddonCreationState) => Partial<AddonCreationState>;
  onDisable: (formState: AddonCreationState) => Partial<AddonCreationState>;
  getConfigFromFormState: (
    formState: AddonCreationState
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
 * Create surfaces only require creation behavior and display metadata.
 */
export type AddonConfig = Pick<
  AddonDefinition,
  'id' | 'name' | 'description' | 'iconName' | 'CreateConfigComponent'
>;
