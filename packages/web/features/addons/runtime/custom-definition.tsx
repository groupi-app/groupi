import { Icons } from '@/components/icons';
import type {
  AddonDefinition,
  AddonConfigProps,
  EventCardProps,
  AddonPageProps,
} from '../model/types';
import { getCustomTemplate, getAddonCompletion } from '../model/completion';
import {
  CustomAddonCreateConfig,
  CustomAddonEventCard,
  CustomAddonManageConfig,
  CustomAddonPageComponent,
} from './organisms/custom-addon-renderer';

function CreateConfig(props: AddonConfigProps) {
  return props.addonId ? (
    <CustomAddonCreateConfig {...props} addonId={props.addonId} />
  ) : null;
}
function EventCard(props: EventCardProps) {
  return (
    <CustomAddonEventCard
      {...props}
      addonType={props.addonType ?? `custom:${props.config.templateId}`}
    />
  );
}
function Page(props: AddonPageProps) {
  return (
    <CustomAddonPageComponent
      {...props}
      addonType={props.addonType ?? `custom:${props.config?.templateId}`}
    />
  );
}

/** Definitions are resolved per configuration; component identities stay stable. */
export function resolveCustomAddon(
  id: string,
  config?: Record<string, unknown> | null
): AddonDefinition | undefined {
  const template = getCustomTemplate(config);
  if (!template) return undefined;
  const iconName =
    template.iconName && Object.hasOwn(Icons, template.iconName)
      ? (template.iconName as keyof typeof Icons)
      : 'info';
  return {
    id,
    name: template.name,
    description: template.description,
    iconName,
    CreateConfigComponent: CreateConfig,
    isEnabled: state => state.addonConfigs?.[id] !== undefined,
    onEnable: state => ({
      addonConfigs: {
        ...state.addonConfigs,
        [id]: {
          templateId: id.slice('custom:'.length),
          template: structuredClone(template),
        },
      },
    }),
    onDisable: state => {
      const addonConfigs = { ...state.addonConfigs };
      delete addonConfigs[id];
      return { addonConfigs };
    },
    getConfigFromFormState: state => state.addonConfigs?.[id] ?? null,
    EventCardComponent: EventCard,
    ManageConfigComponent: CustomAddonManageConfig,
    ...(template.settings?.cardOnly
      ? {}
      : { PageComponent: Page, pageTitle: template.name }),
    supportsOptOut: false,
    requiresCompletion: getAddonCompletion(id, config)?.requiresCompletion,
    completionRoute: getAddonCompletion(id, config)?.completionRoute,
  };
}
