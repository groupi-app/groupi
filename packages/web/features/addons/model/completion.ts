import type { CustomAddonTemplate } from './custom-addon-schema';

export const BUILTIN_COMPLETION = {
  reminders: { id: 'reminders', name: 'Reminders', requiresCompletion: false },
  questionnaire: {
    id: 'questionnaire',
    name: 'Questionnaire',
    requiresCompletion: true,
    completionRoute: '/addon/questionnaire',
  },
  'bring-list': {
    id: 'bring-list',
    name: 'Bring List',
    requiresCompletion: false,
  },
  discord: { id: 'discord', name: 'Discord Event', requiresCompletion: false },
} as const;

/** Read the saved event copy; never consult or cache source templates. */
export function getCustomTemplate(
  config?: Record<string, unknown> | null
): CustomAddonTemplate | undefined {
  const template = config?.template;
  if (!template || typeof template !== 'object') return undefined;
  const candidate = template as CustomAddonTemplate;
  if (
    typeof candidate.name !== 'string' ||
    typeof candidate.description !== 'string' ||
    !Array.isArray(candidate.sections)
  )
    return undefined;
  return candidate;
}

export function getAddonCompletion(
  id: string,
  config?: Record<string, unknown> | null
):
  | {
      id: string;
      name: string;
      requiresCompletion: boolean;
      completionRoute?: string;
    }
  | undefined {
  if (!id.startsWith('custom:'))
    return Object.hasOwn(BUILTIN_COMPLETION, id)
      ? BUILTIN_COMPLETION[id as keyof typeof BUILTIN_COMPLETION]
      : undefined;
  const template = getCustomTemplate(config);
  if (!template) return undefined;
  const requiresCompletion =
    !template.settings?.cardOnly &&
    Boolean(template.settings?.requiresCompletion);
  return {
    id,
    name: template.name,
    requiresCompletion,
    completionRoute: requiresCompletion ? `/addon/${id}` : undefined,
  };
}
