import { CliError } from './errors.js';

/** @param {string} message @returns {never} */
function invalid(message) {
  throw new CliError('USAGE', message, 2);
}

/** @param {unknown} value @returns {number} */
function date(value) {
  if (typeof value !== 'string')
    return invalid(
      'Dates must be ISO strings with an explicit UTC offset or Z.'
    );
  const parts =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(
      value
    );
  if (!parts)
    return invalid(
      'Use ISO dates with seconds and an explicit offset, for example 2027-03-05T18:00:00-05:00.'
    );
  const [, y, m, d, h, minute, second] = parts;
  const year = Number(y),
    month = Number(m),
    day = Number(d);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const timestamp = Date.parse(value);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > days[month - 1] ||
    Number(h) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59 ||
    !Number.isFinite(timestamp)
  )
    return invalid(
      'Provide a valid calendar date and time with an explicit UTC offset.'
    );
  return timestamp;
}

/** @param {Record<string, unknown>} body @param {boolean} creating */
export function validateEventInput(body, creating) {
  if (!creating && Object.keys(body).length === 0)
    invalid(
      'Provide at least one edit: --title, --description, --location, or --date-options.'
    );
  if (creating && typeof body.title !== 'string')
    invalid('Provide --title for the new event.');
  for (const [name, limit] of /** @type {[string,number][]} */ ([
    ['title', 200],
    ['description', 5000],
    ['location', 500],
  ])) {
    const value = body[name];
    if (
      value !== undefined &&
      (typeof value !== 'string' ||
        value.trim().length > limit ||
        (name === 'title' && !value.trim()))
    )
      invalid(
        `${name} must be ${name === 'title' ? 'nonempty and ' : ''}at most ${limit} characters.`
      );
  }
  const start =
    body.chosenDateTime === undefined ? undefined : date(body.chosenDateTime);
  if (body.chosenEndDateTime !== undefined) {
    if (start === undefined) invalid('--end requires --start.');
    if (date(body.chosenEndDateTime) <= /** @type {number} */ (start))
      invalid('The end time must be after the start time.');
  }
  if (body.potentialDateTimeOptions !== undefined) {
    if (start !== undefined || body.chosenEndDateTime !== undefined)
      invalid('Use either --date-options or --start/--end, not both.');
    if (!Array.isArray(body.potentialDateTimeOptions))
      invalid(
        '--date-options must be a JSON array of {start,end?,note?} objects.'
      );
    for (const option of /** @type {unknown[]} */ (
      body.potentialDateTimeOptions
    )) {
      if (
        !option ||
        typeof option !== 'object' ||
        Array.isArray(option) ||
        !('start' in option) ||
        Object.keys(option).some(key => !['start', 'end', 'note'].includes(key))
      )
        invalid(
          'Each date option must contain start and may contain end and note only.'
        );
      const item = /** @type {{start:unknown,end?:unknown,note?:unknown}} */ (
        option
      );
      const optionStart = date(item.start);
      if (item.end !== undefined && date(item.end) <= optionStart)
        invalid('Every proposed end time must be after its start time.');
      if (
        item.note !== undefined &&
        (typeof item.note !== 'string' || item.note.length > 200)
      )
        invalid('Date option notes must be text of at most 200 characters.');
    }
  }
}

/** @param {string} value */
export function validateRequestId(value) {
  if (
    !/^\d{13}\.[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  )
    invalid(
      'Use a request ID returned by a prior attempt: <13-digit Unix milliseconds>.<UUID v4>.'
    );
}

/** Convert command flags to the same input accepted by the shared event service.
 * @param {{title?:string,description?:string,location?:string,start?:string,end?:string,dateOptions?:string}} input
 * @param {boolean} creating */
export function eventInput(input, creating) {
  let dates;
  if (input.dateOptions !== undefined) {
    try {
      dates = JSON.parse(input.dateOptions);
    } catch {
      invalid(
        '--date-options must be valid JSON, for example [{"start":"2027-03-05T18:00:00Z"}].'
      );
    }
  }
  const body = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.location !== undefined ? { location: input.location } : {}),
    ...(input.start !== undefined ? { chosenDateTime: input.start } : {}),
    ...(input.end !== undefined ? { chosenEndDateTime: input.end } : {}),
    ...(dates !== undefined ? { potentialDateTimeOptions: dates } : {}),
  };
  validateEventInput(body, creating);
  return body;
}
