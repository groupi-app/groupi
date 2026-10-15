import type { AddonDefinition } from '../model/types';
import { BUILTIN_COMPLETION } from '../model/completion';
import { validateAddon } from '../model/validate-definition';
import { reminderAddon } from './organisms/reminder-addon';
import { questionnaireAddon } from './organisms/questionnaire-addon';
import { bringListAddon } from './organisms/bring-list-addon';
import { discordAddon } from './organisms/discord-addon';
import { resolveCustomAddon } from './custom-definition';

// Metadata determines display order; this exhaustive map supplies the UI.
const implementations = {
  reminders: reminderAddon,
  questionnaire: questionnaireAddon,
  'bring-list': bringListAddon,
  discord: discordAddon,
} satisfies Record<keyof typeof BUILTIN_COMPLETION, AddonDefinition>;
const builtins: readonly AddonDefinition[] = Object.freeze(
  (Object.keys(BUILTIN_COMPLETION) as Array<keyof typeof BUILTIN_COMPLETION>)
    .map(id => implementations[id])
    .filter(validateAddon)
);

export function getAddonRegistry(): readonly AddonDefinition[] {
  return builtins;
}
export function getAddonById(
  id: string,
  config?: Record<string, unknown> | null
): AddonDefinition | undefined {
  return id.startsWith('custom:')
    ? resolveCustomAddon(id, config)
    : builtins.find(addon => addon.id === id);
}

/** Management shows built-ins in catalog order, then this event's custom copies. */
export function getEventAddonDefinitions(
  configs: readonly {
    addonType: string;
    config: unknown;
    enabled: boolean;
  }[] = []
): readonly AddonDefinition[] {
  const custom = configs
    .filter(row => row.enabled && row.addonType.startsWith('custom:'))
    .flatMap(row => {
      const definition = getAddonById(
        row.addonType,
        row.config as Record<string, unknown>
      );
      return definition ? [definition] : [];
    });
  return [...builtins, ...custom];
}
