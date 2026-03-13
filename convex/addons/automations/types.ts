/**
 * Automation types for the IFTTT-style addon automation engine.
 *
 * Automations are pure data — JSON arrays interpreted by trusted backend code.
 * No user code is executed; only declarative trigger → condition → action chains.
 */

// ===== Triggers =====

export const TRIGGER_TYPES = [
  'form_submitted',
  'list_item_claimed',
  'list_item_full',
  'vote_cast',
  'vote_threshold',
  'toggle_changed',
  'all_responses_in',
  'member_joined',
  'member_left',
  'date_chosen',
  'addon_enabled',
] as const;

export type TriggerType = (typeof TRIGGER_TYPES)[number];

export interface AutomationTrigger {
  type: TriggerType;
  /** Required for list_item_full — which list field */
  fieldId?: string;
  /** Required for vote_threshold — vote count to trigger */
  threshold?: number;
}

// ===== Conditions =====

export const CONDITION_OPERATORS = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'greater_than',
  'less_than',
  'greater_or_equal',
  'less_or_equal',
  'is_empty',
  'is_not_empty',
  'in_list',
  'not_in_list',
] as const;

export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

export interface AutomationCondition {
  /** Variable path, e.g. "fields.dietary" or "member.role" */
  field: string;
  operator: ConditionOperator;
  /** Value to compare against. Unused for is_empty/is_not_empty. */
  value?: unknown;
}

// ===== Actions =====

export const ACTION_TYPES = [
  'notify_members',
  'notify_organizers',
  'notify_submitter',
  'create_post',
  'update_event_description',
  'send_webhook',
  'set_addon_data',
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

export interface AutomationAction {
  type: ActionType;
  /** Template message — supports {{variable}} interpolation */
  message?: string;
  /** For create_post */
  title?: string;
  /** For send_webhook */
  webhookUrl?: string;
  webhookHeaders?: Record<string, string>;
  /** For set_addon_data */
  key?: string;
  data?: unknown;
  /** Only send to recipients whose toggle field is enabled */
  recipientToggleField?: string;
}

// ===== Automation =====

export interface Automation {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
}

// ===== Variable context (built at runtime) =====

export interface VariableContext {
  member: {
    name: string;
    role: string;
  };
  event: {
    title: string;
    location: string;
    date: string;
  };
  fields: Record<string, unknown>;
  vote: {
    top_option: string;
  };
  addon: {
    name: string;
  };
}

// ===== Validation helpers =====

export function isValidTriggerType(type: unknown): type is TriggerType {
  return (
    typeof type === 'string' && TRIGGER_TYPES.includes(type as TriggerType)
  );
}

export function isValidConditionOperator(op: unknown): op is ConditionOperator {
  return (
    typeof op === 'string' &&
    CONDITION_OPERATORS.includes(op as ConditionOperator)
  );
}

export function isValidActionType(type: unknown): type is ActionType {
  return typeof type === 'string' && ACTION_TYPES.includes(type as ActionType);
}

export function isValidCondition(c: unknown): c is AutomationCondition {
  if (typeof c !== 'object' || c === null) return false;
  const cond = c as Record<string, unknown>;
  if (typeof cond.field !== 'string' || cond.field.length === 0) return false;
  if (!isValidConditionOperator(cond.operator)) return false;
  return true;
}

export function isValidAction(a: unknown): a is AutomationAction {
  if (typeof a !== 'object' || a === null) return false;
  const act = a as Record<string, unknown>;
  if (!isValidActionType(act.type)) return false;

  switch (act.type) {
    case 'notify_members':
    case 'notify_organizers':
    case 'notify_submitter':
      if (typeof act.message !== 'string' || act.message.length === 0)
        return false;
      break;
    case 'create_post':
      if (typeof act.title !== 'string' || act.title.length === 0) return false;
      if (typeof act.message !== 'string' || act.message.length === 0)
        return false;
      break;
    case 'update_event_description':
      if (typeof act.message !== 'string' || act.message.length === 0)
        return false;
      break;
    case 'send_webhook':
      if (typeof act.webhookUrl !== 'string' || act.webhookUrl.length === 0)
        return false;
      break;
    case 'set_addon_data':
      if (typeof act.key !== 'string' || act.key.length === 0) return false;
      break;
  }

  // Validate recipientToggleField if present
  if (
    act.recipientToggleField !== undefined &&
    typeof act.recipientToggleField !== 'string'
  )
    return false;

  return true;
}

export function isValidTrigger(t: unknown): t is AutomationTrigger {
  if (typeof t !== 'object' || t === null) return false;
  const trigger = t as Record<string, unknown>;
  if (!isValidTriggerType(trigger.type)) return false;

  // list_item_full requires fieldId
  if (trigger.type === 'list_item_full') {
    if (typeof trigger.fieldId !== 'string' || trigger.fieldId.length === 0)
      return false;
  }

  // vote_threshold requires threshold
  if (trigger.type === 'vote_threshold') {
    if (typeof trigger.threshold !== 'number' || trigger.threshold < 1)
      return false;
  }

  return true;
}

export function isValidAutomation(a: unknown): a is Automation {
  if (typeof a !== 'object' || a === null) return false;
  const auto = a as Record<string, unknown>;

  if (typeof auto.id !== 'string' || auto.id.length === 0) return false;
  if (typeof auto.name !== 'string' || auto.name.length === 0) return false;
  if (typeof auto.enabled !== 'boolean') return false;

  if (!isValidTrigger(auto.trigger)) return false;

  if (!Array.isArray(auto.conditions)) return false;
  for (const c of auto.conditions) {
    if (!isValidCondition(c)) return false;
  }

  if (!Array.isArray(auto.actions) || auto.actions.length === 0) return false;
  for (const act of auto.actions) {
    if (!isValidAction(act)) return false;
  }

  return true;
}

/** Validate an array of automations. Returns true if all are valid. */
export function isValidAutomations(arr: unknown): arr is Automation[] {
  if (!Array.isArray(arr)) return false;
  return arr.every(isValidAutomation);
}
