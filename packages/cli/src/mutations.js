import { setTimeout as delay } from 'node:timers/promises';
import { createInterface } from 'node:readline/promises';
import { CliError } from './errors.js';

/** Common policy for later destructive commands; ordinary edits do not prompt.
 * @param {{target:string, yes?:boolean, json?:boolean}} confirmation */
async function confirm(confirmation) {
  if (confirmation.yes) return;
  if (confirmation.json || !process.stdin.isTTY || !process.stderr.isTTY)
    throw new CliError(
      'CONFIRMATION_REQUIRED',
      'This destructive operation requires explicit --yes in JSON/headless mode.',
      2
    );
  const terminal = createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  const controller = new AbortController();
  const cancel = () => controller.abort();
  terminal.once('close', cancel);
  terminal.once('SIGINT', cancel);
  process.once('SIGINT', cancel);
  try {
    // Strip terminal controls from server-provided names before displaying a target.
    // eslint-disable-next-line no-control-regex -- Remote strings cannot control the terminal.
    const target = confirmation.target.replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
    const answer = await terminal.question(
      `Confirm ${target}? Type yes to continue: `,
      { signal: controller.signal }
    );
    if (answer.trim().toLowerCase() !== 'yes')
      throw new CliError('CANCELLED', 'No write was submitted.', 2);
  } catch (error) {
    if (controller.signal.aborted)
      throw new CliError('CANCELLED', 'No write was submitted.', 2);
    throw error;
  } finally {
    terminal.removeListener('close', cancel);
    terminal.removeListener('SIGINT', cancel);
    process.removeListener('SIGINT', cancel);
    terminal.close();
  }
}

/** Mutation transport never follows redirects; retries require server-side deduplication.
 * @param {{apiUrl:string}} profile @param {string} key @param {string} path
 * @param {{method:'POST'|'PUT'|'PATCH'|'DELETE', body:unknown, requestId?:string, validationGuidance?:string, validationIssues?:boolean, recovery:string, expiredRecovery?:string, confirmation?:{target:string,yes?:boolean,json?:boolean}}} options */
export async function mutateApi(profile, key, path, options) {
  if (options.confirmation) await confirm(options.confirmation);
  const body = JSON.stringify(options.body);
  const attempts = options.requestId ? 3 : 1;
  let uncertain = false;
  const unknown = () =>
    new CliError(
      'UNCERTAIN_OUTCOME',
      `The write may have succeeded. ${options.recovery}`,
      5
    );
  for (let attempt = 0; attempt < attempts; attempt++) {
    let response;
    try {
      response = await fetch(profile.apiUrl + path, {
        method: options.method,
        redirect: 'manual',
        headers: {
          'x-api-key': key,
          accept: 'application/json',
          'content-type': 'application/json',
          ...(options.requestId
            ? { 'idempotency-key': options.requestId }
            : {}),
        },
        ...(options.method !== 'DELETE' ? { body } : {}),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      uncertain = true;
      if (attempt + 1 < attempts) {
        await delay(250 * 2 ** attempt);
        continue;
      }
      throw unknown();
    }
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel();
      throw new CliError(
        'UNCERTAIN_OUTCOME',
        `The write returned a redirect, which was refused. ${options.recovery}`,
        5
      );
    }
    if (response.ok) {
      if (response.status === 204) return null;
      try {
        return await response.json();
      } catch {
        uncertain = true;
        if (attempt + 1 < attempts) {
          await delay(250 * 2 ** attempt);
          continue;
        }
        throw unknown();
      }
    }
    if (response.status >= 500 || response.status === 429) {
      uncertain ||= response.status >= 500;
      const retryAfter = response.headers.get('retry-after');
      const wait =
        retryAfter === null
          ? 250 * 2 ** attempt
          : /^\d+(\.\d+)?$/.test(retryAfter)
            ? Number(retryAfter) * 1000
            : Date.parse(retryAfter) - Date.now();
      await response.body?.cancel();
      if (attempt + 1 < attempts && Number.isFinite(wait) && wait <= 2000) {
        await delay(Math.max(0, wait));
        continue;
      }
      if (uncertain) throw unknown();
      throw new CliError(
        'RATE_LIMITED',
        `The server rate limit was reached. Wait before trying again. ${options.recovery}`,
        5
      );
    }
    let code;
    let details = '';
    try {
      const remote = (await response.json())?.error;
      code = remote?.code;
      if (
        options.validationIssues &&
        code === 'VALIDATION_ERROR' &&
        Array.isArray(remote?.issues)
      ) {
        details = remote.issues
          .slice(0, 10)
          .filter(
            (/** @type {{path?:unknown,message?:unknown}|null} */ issue) =>
              issue &&
              typeof issue.path === 'string' &&
              /^[a-zA-Z0-9_.]{1,200}$/.test(issue.path) &&
              typeof issue.message === 'string'
          )
          .map((/** @type {{path:string,message:string}} */ issue) => {
            // Only bounded structured schema diagnostics are displayed. Never echo a credential or terminal control.
            const redact = (/** @type {string} */ text) =>
              text.replaceAll(key, '[redacted]').replace(/[^\x20-\x7e]/g, ' ');
            return `${redact(issue.path)}: ${redact(issue.message).slice(0, 240)}`;
          })
          .join('; ');
      }
    } catch {
      /* The status still describes an explicit rejection. */
    }
    if (uncertain) throw unknown();
    if (response.status === 409) {
      if (code === 'DATE_RESET_REQUIRED')
        throw new CliError(
          'DATE_RESET_REQUIRED',
          'Reset the confirmed date with events dates reset <event-id> before replacing proposed dates. The reset requires confirmation; no edit was applied.',
          2
        );
      if (code === 'IDEMPOTENCY_EXPIRED')
        throw new CliError(
          'IDEMPOTENCY_EXPIRED',
          `Request ID ${options.requestId} has expired and must not be retried. ${options.expiredRecovery ?? 'Inspect prior creations on the selected profile before deliberately starting a new creation with a new identifier.'}`,
          2
        );
      if (code === 'IDEMPOTENCY_CONFLICT')
        throw new CliError(
          'IDEMPOTENCY_CONFLICT',
          `Request ID ${options.requestId} was used with different inputs. Inspect the previous creation, or reuse this identifier only with its original inputs.`,
          2
        );
      throw new CliError(
        'CONFLICT',
        'The write conflicts with current server state. Inspect the target before deciding whether another write is needed.',
        2
      );
    }
    if (response.status === 400 || response.status === 422)
      throw new CliError(
        'USAGE',
        `${details ? details + ' ' : ''}${options.validationGuidance ?? 'The server rejected the write inputs. Use this command’s --help to check the supported inputs, then inspect the target and its current state.'}`,
        2
      );
    if (response.status === 401 || response.status === 403)
      throw new CliError(
        response.status === 401 ? 'AUTH_REQUIRED' : 'FORBIDDEN',
        'This identity or API key cannot perform the write. Check the selected profile, key, and event role.',
        3
      );
    if (response.status === 404)
      throw new CliError(
        'NOT_FOUND',
        'The target or API endpoint was not found. Check its ID and the selected profile.',
        4
      );
    throw new CliError(
      'REMOTE_ERROR',
      `The server rejected the write (HTTP ${response.status}).`,
      5
    );
  }
  throw unknown();
}
