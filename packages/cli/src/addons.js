import { CliError } from './errors.js';
import { readApi } from './transport.js';
import { readPaginated } from './pagination.js';
import { mutateApi } from './mutations.js';

/** @typedef {{name:string,apiUrl:string}} Profile */
/** @param {string} id @param {string} label */
function identifier(id, label) {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id))
    throw new CliError('USAGE', `Provide a valid ${label}.`, 2);
}
/** @param {string} type */
function addonType(type) {
  if (
    !['reminders', 'questionnaire', 'bring-list', 'discord'].includes(type) &&
    !/^custom:[a-zA-Z0-9_-]+$/.test(type)
  )
    throw new CliError(
      'USAGE',
      'Choose reminders, questionnaire, bring-list, discord, or custom:<template-id>.',
      2
    );
}
/** @param {unknown} value @returns {Record<string,unknown>} */
function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new CliError('USAGE', 'Configuration must be a JSON object.', 2);
  return /** @type {Record<string,unknown>} */ (value);
}
/** Local field guidance supplements the authoritative server handler validators.
 * @param {string} type @param {unknown} value */
export function configurationInput(type, value) {
  addonType(type);
  const config = record(value);
  const fail = (/** @type {string} */ message) => {
    throw new CliError('USAGE', message, 2);
  };
  const fields = /** @type {Record<string,string[]>} */ ({
    reminders: ['reminderOffset'],
    questionnaire: ['questions'],
    'bring-list': ['items'],
    discord: ['guildId', 'guildName'],
  });
  const allowed = type.startsWith('custom:')
    ? ['templateId', 'template']
    : fields[type];
  if (Object.keys(config).some(key => !allowed.includes(key)))
    fail(
      `config accepts only ${allowed.join(', ')}; server and secret fields are protected.`
    );
  if (JSON.stringify(config).length > 64 * 1024)
    fail('config exceeds the 64 KiB JSON limit.');
  if (
    type === 'reminders' &&
    ![
      '30_MINUTES',
      '1_HOUR',
      '2_HOURS',
      '4_HOURS',
      '1_DAY',
      '2_DAYS',
      '3_DAYS',
      '1_WEEK',
      '2_WEEKS',
      '4_WEEKS',
    ].includes(String(config.reminderOffset))
  )
    fail(
      'config.reminderOffset: choose 30_MINUTES, 1_HOUR, 2_HOURS, 4_HOURS, 1_DAY, 2_DAYS, 3_DAYS, 1_WEEK, 2_WEEKS, or 4_WEEKS.'
    );
  if (
    type === 'discord' &&
    ['guildId', 'guildName'].some(
      key => typeof config[key] !== 'string' || !config[key]
    )
  )
    fail(
      'config.guildId and config.guildName: both must be nonempty strings from an authorized Discord server.'
    );
  if (type === 'bring-list') {
    if (!Array.isArray(config.items) || !config.items.length)
      fail('config.items: provide a nonempty array of {id,name,quantity}.');
    /** @type {unknown[]} */ (config.items).forEach((value, i) => {
      const item = record(value);
      if (
        typeof item.id !== 'string' ||
        !item.id ||
        typeof item.name !== 'string' ||
        !item.name ||
        typeof item.quantity !== 'number' ||
        !Number.isFinite(item.quantity) ||
        item.quantity < 1
      )
        fail(
          `config.items[${i}]: id/name must be nonempty strings; quantity must be a finite number >= 1.`
        );
    });
  }
  if (type === 'questionnaire') {
    if (!Array.isArray(config.questions) || !config.questions.length)
      fail(
        'config.questions: provide a nonempty array of {id,label,type,required,options?}.'
      );
    /** @type {unknown[]} */ (config.questions).forEach((value, i) => {
      const question = record(value);
      if (
        typeof question.id !== 'string' ||
        !question.id ||
        typeof question.label !== 'string' ||
        !question.label ||
        typeof question.required !== 'boolean' ||
        ![
          'SHORT_ANSWER',
          'LONG_ANSWER',
          'MULTIPLE_CHOICE',
          'CHECKBOXES',
          'NUMBER',
          'DROPDOWN',
          'YES_NO',
        ].includes(String(question.type))
      )
        fail(
          `config.questions[${i}]: requires id, label, supported uppercase type, and required:boolean.`
        );
      if (
        ['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(
          String(question.type)
        ) &&
        (!Array.isArray(question.options) ||
          !question.options.length ||
          question.options.some(item => typeof item !== 'string'))
      )
        fail(
          `config.questions[${i}].options: choice questions need a nonempty array of strings.`
        );
    });
  }
  if (type.startsWith('custom:')) {
    if (config.templateId !== undefined && config.templateId !== type.slice(7))
      fail('config.templateId: must match custom:<template-id>.');
    if (config.template !== undefined) record(config.template);
  }
  return config;
}
/** @param {unknown} value */
function configResult(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !('addonType' in value) ||
    typeof value.addonType !== 'string' ||
    !('enabled' in value) ||
    typeof value.enabled !== 'boolean' ||
    !('config' in value) ||
    !value.config ||
    typeof value.config !== 'object' ||
    !('createdAt' in value) ||
    !Number.isFinite(value.createdAt) ||
    !('updatedAt' in value) ||
    !Number.isFinite(value.updatedAt)
  )
    throw new CliError(
      'INVALID_RESPONSE',
      'Expected a complete add-on configuration.',
      5
    );
  return {
    id: value.id,
    addonType: value.addonType,
    enabled: value.enabled,
    config: value.config,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}
/** @param {Profile} profile @param {string} key */
async function requireWrites(profile, key) {
  const health = record(await readApi(profile, key, '/health'));
  const capabilities = record(health.capabilities ?? {});
  const support = capabilities.addonConfiguration;
  if (
    !support ||
    typeof support !== 'object' ||
    !('version' in support) ||
    support.version !== 1
  )
    throw new CliError(
      'UNSUPPORTED_SERVER',
      'The server must advertise addonConfiguration version 1; no write was sent.',
      5
    );
}
/** @param {Profile} profile @param {string} key @param {string|null} eventId @param {{limit:number,cursor?:string,all?:boolean}} options */
export async function listAddons(profile, key, eventId, options) {
  if (eventId !== null) identifier(eventId, 'event ID');
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 100
  )
    throw new CliError('USAGE', '--limit must be an integer from 1 to 100.', 2);
  return readPaginated({
    ...options,
    fetchPage: ({ cursor, limit }) => {
      const query = new URLSearchParams({
        pagination: 'cursor',
        limit: String(limit),
      });
      if (cursor) query.set('cursor', cursor);
      return readApi(
        profile,
        key,
        `${eventId === null ? '/addon-templates' : `/events/${eventId}/addons`}?${query}`
      );
    },
    projectItem: value => {
      if (eventId !== null) return configResult(value);
      const template = record(value);
      if (
        typeof template.id !== 'string' ||
        typeof template.addonType !== 'string' ||
        typeof template.name !== 'string' ||
        typeof template.description !== 'string' ||
        !Number.isFinite(template.version) ||
        !template.template ||
        typeof template.template !== 'object'
      )
        throw new CliError(
          'INVALID_RESPONSE',
          'Expected an existing custom template.',
          5
        );
      return {
        id: template.id,
        addonType: template.addonType,
        name: template.name,
        description: template.description,
        version: template.version,
        template: template.template,
      };
    },
  });
}
/** @param {Profile} profile @param {string} key @param {string} eventId @param {string} type */
export async function getAddon(profile, key, eventId, type) {
  addonType(type);
  const page = await listAddons(profile, key, eventId, {
    limit: 100,
    all: true,
  });
  const config = page.items.find(item => item.addonType === type);
  if (!config)
    throw new CliError(
      'NOT_FOUND',
      'This add-on has no configuration on this event.',
      4
    );
  return config;
}
/** @param {Profile} profile @param {string} key @param {string} eventId @param {string} type @param {'enable'|'configure'|'disable'} operation @param {unknown} config @param {{yes?:boolean,json?:boolean}} options */
export async function changeAddon(
  profile,
  key,
  eventId,
  type,
  operation,
  config,
  options
) {
  identifier(eventId, 'event ID');
  addonType(type);
  const body =
    operation === 'disable' ? {} : { config: configurationInput(type, config) };
  await requireWrites(profile, key);
  const recovery = `Inspect addons get ${eventId} ${type} --profile ${profile.name} before repeating this write; it was not retried.`;
  const value = await mutateApi(
    profile,
    key,
    `/events/${eventId}/addons/${encodeURIComponent(type)}/${operation === 'configure' ? 'config' : operation}`,
    {
      method: operation === 'configure' ? 'PATCH' : 'POST',
      body,
      recovery,
      validationGuidance: type.startsWith('custom:')
        ? 'config.template: use addons get to inspect the existing template. Only configurable fields (maxLength, min/max, options, items) and configurable section fields may change; templateId must match. Existing published templates must be owned by this identity.'
        : type === 'discord'
          ? 'config.guildId/config.guildName require a fresh Discord server authorization. Run discord guilds refresh, then discord guilds list before retrying; linking a missing Discord account requires the app browser flow.'
          : `The server rejected ${type} configuration. Check this command’s --help, inspect addons get, and supply the documented config fields.`,
      confirmation: {
        target: `${operation} ${type} on event ${eventId} in profile ${profile.name} (${profile.apiUrl}); configuration changes may clear participant responses`,
        ...options,
      },
    }
  );
  try {
    if (operation === 'configure') {
      const result = configResult(value);
      if (result.addonType !== type || !result.enabled)
        throw Error('Wrong add-on');
      return result;
    }
    if (
      !value ||
      typeof value !== 'object' ||
      !('message' in value) ||
      typeof value.message !== 'string'
    )
      throw Error('Missing result');
    return { message: value.message };
  } catch {
    throw new CliError(
      'UNCERTAIN_OUTCOME',
      `The add-on response was incomplete. ${recovery}`,
      5
    );
  }
}
