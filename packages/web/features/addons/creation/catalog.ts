import type { AddonCreationState } from '../model/types';
import { getEventAddonDefinitions } from '../runtime/catalog';

export function getCreationAddons(state: AddonCreationState) {
  return getEventAddonDefinitions(
    Object.entries(state.addonConfigs ?? {}).map(([addonType, config]) => ({
      addonType,
      config,
      enabled: true,
    }))
  );
}

export function serializeAddonConfigs(state: AddonCreationState) {
  return getCreationAddons(state)
    .filter(addon => addon.isEnabled(state))
    .flatMap(addon => {
      const config = addon.getConfigFromFormState(state);
      return config ? [{ addonType: addon.id, config }] : [];
    });
}
