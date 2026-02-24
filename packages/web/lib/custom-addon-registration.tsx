import {
  getAddonById,
  registerAddon,
} from '@/app/(newEvent)/create/components/addon-registry';
import type {
  CustomAddonConfig,
  CustomAddonTemplate,
} from './custom-addon-schema';
import type { Icons } from '@/components/icons';

/**
 * Dynamically register a custom addon in the frontend registry.
 *
 * This is called in the 4 rendering entry points when we encounter
 * an addon with a `custom:` prefix type. It creates an AddonDefinition
 * backed by the generic renderer components.
 *
 * Registration is idempotent — calling with the same addonType is a no-op.
 */
export function ensureCustomAddonRegistered(
  addonType: string,
  template: CustomAddonTemplate
): void {
  if (getAddonById(addonType)) return;

  // Dynamic imports to avoid circular deps — these are eagerly loaded
  // in the same bundle anyway since the addon renderer is already imported
  /* eslint-disable @typescript-eslint/no-require-imports */
  const {
    CustomAddonCreateConfig,
    CustomAddonEventCard,
    CustomAddonManageConfig,
    CustomAddonPageComponent,
  } = require('@/app/(newEvent)/create/components/addons/custom-addon-renderer');
  /* eslint-enable @typescript-eslint/no-require-imports */

  const iconName = (template.iconName ?? 'info') as keyof typeof Icons;

  registerAddon({
    id: addonType,
    name: template.name,
    description: template.description,
    iconName,

    CreateConfigComponent: props => (
      <CustomAddonCreateConfig {...props} addonId={addonType} />
    ),
    isEnabled: formState => formState.addonConfigs?.[addonType] !== undefined,
    onEnable: formState => ({
      addonConfigs: {
        ...formState.addonConfigs,
        [addonType]: {
          templateId: addonType.replace('custom:', ''),
          template: structuredClone(template),
        },
      },
    }),
    onDisable: formState => {
      const configs = { ...formState.addonConfigs };
      delete configs[addonType];
      return { addonConfigs: configs };
    },
    getConfigFromFormState: formState => {
      const addonConfig = formState.addonConfigs?.[addonType];
      if (!addonConfig) return null;
      // Ensure the config has the template structure for custom addons
      if (addonConfig.template) return addonConfig;
      return {
        templateId: addonType.replace('custom:', ''),
        template: structuredClone(template),
        ...addonConfig,
      };
    },

    EventCardComponent: props => (
      <CustomAddonEventCard {...props} addonType={addonType} />
    ),

    ManageConfigComponent: props => <CustomAddonManageConfig {...props} />,

    ...(template.settings?.cardOnly
      ? {}
      : {
          PageComponent: (props: {
            eventId: string;
            config: Record<string, unknown> | null;
          }) => <CustomAddonPageComponent {...props} addonType={addonType} />,
          pageTitle: template.name,
        }),

    supportsOptOut: false,
    requiresCompletion:
      !template.settings?.cardOnly &&
      (template.settings?.requiresCompletion ?? false),
    completionRoute:
      !template.settings?.cardOnly && template.settings?.requiresCompletion
        ? `/addon/${addonType}`
        : undefined,
  });
}

/**
 * Given a list of addon configs, register any custom addons that aren't
 * already in the frontend registry.
 */
export function registerCustomAddonsFromConfigs(
  addons: Array<{
    addonType: string;
    config: unknown;
    enabled: boolean;
  }>
): void {
  for (const addon of addons) {
    if (!addon.addonType.startsWith('custom:')) continue;
    if (!addon.enabled) continue;

    const config = addon.config as CustomAddonConfig | null;
    if (!config?.template) continue;

    ensureCustomAddonRegistered(addon.addonType, config.template);
  }
}
