import type { VariableContext } from './types';

/**
 * Resolve template variables in a string.
 * Variables use the {{path}} format, e.g. {{member.name}}, {{fields.dietary}}.
 *
 * Unknown variables are replaced with an empty string.
 */
export function resolveTemplate(
  template: string,
  ctx: VariableContext
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_match, path: string) => {
    const trimmed = path.trim();
    const value = resolveVariablePath(ctx, trimmed);
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  });
}

/**
 * Resolve a dot-path variable against the context object.
 * Supports paths like "member.name", "fields.dietary", "event.title".
 */
function resolveVariablePath(ctx: VariableContext, path: string): unknown {
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = ctx;

  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    if (typeof current !== 'object') return undefined;
    current = current[part];
  }

  return current;
}

/**
 * Build a VariableContext from runtime data.
 */
export function buildVariableContext(opts: {
  memberName?: string;
  memberRole?: string;
  eventTitle?: string;
  eventLocation?: string;
  eventDate?: string;
  fieldValues?: Record<string, unknown>;
  topVoteOption?: string;
  addonName?: string;
}): VariableContext {
  return {
    member: {
      name: opts.memberName ?? '',
      role: opts.memberRole ?? '',
    },
    event: {
      title: opts.eventTitle ?? '',
      location: opts.eventLocation ?? '',
      date: opts.eventDate ?? '',
    },
    fields: opts.fieldValues ?? {},
    vote: {
      top_option: opts.topVoteOption ?? '',
    },
    addon: {
      name: opts.addonName ?? '',
    },
  };
}
