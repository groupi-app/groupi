import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { CliError } from './errors.js';
import { webUrl } from './profiles.js';
import {
  checkCredentialStore,
  readCredential,
  saveCredential,
  deleteCredential,
} from './credential-store.js';

/** @param {{apiUrl:string}} profile @param {string} path @param {unknown} body @param {string} [key] @param {AbortSignal} [signal] */
export async function authRequest(profile, path, body, key, signal) {
  let response;
  try {
    response = await fetch(profile.apiUrl + path, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(key ? { 'x-api-key': key } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.any([
        AbortSignal.timeout(10000),
        ...(signal ? [signal] : []),
      ]),
    });
  } catch {
    throw new CliError(
      'AUTH_NETWORK_ERROR',
      'The authentication request could not complete. It was not retried; explicitly restart login or inspect API keys in the browser.',
      3
    );
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new CliError(
      response.status >= 300 && response.status < 400
        ? 'UNSAFE_REDIRECT'
        : 'AUTH_REJECTED',
      'The server rejected authentication. Check the selected profile and explicitly restart login. Authentication requests never follow redirects.',
      3
    );
  }
  if (response.status === 204) return {};
  try {
    return await response.json();
  } catch {
    throw new CliError(
      'INVALID_RESPONSE',
      'The authentication server returned an invalid response.',
      5
    );
  }
}

/** @param {string} url */
export async function openBrowser(url) {
  const executable =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'powershell.exe'
        : 'xdg-open';
  const args =
    process.platform === 'win32'
      ? [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          '$u=[Console]::In.ReadToEnd(); Start-Process -FilePath $u',
        ]
      : [url];
  await new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      stdio: ['pipe', 'ignore', 'ignore'],
      windowsHide: true,
    });
    const timer = setTimeout(() => {
      child.kill();
      reject(
        new CliError(
          'BROWSER_OPEN_FAILED',
          'Open the displayed authorization URL manually, or restart with --no-browser.',
          3
        )
      );
    }, 5000);
    child.on('error', () => {
      clearTimeout(timer);
      reject(
        new CliError(
          'BROWSER_OPEN_FAILED',
          'Could not open the browser. Restart login with --no-browser and open the displayed URL.',
          3
        )
      );
    });
    child.on('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve(undefined);
      else
        reject(
          new CliError(
            'BROWSER_OPEN_FAILED',
            'Could not open the browser. Restart login with --no-browser.',
            3
          )
        );
    });
    child.stdin.on('error', () => {});
    child.stdin.end(process.platform === 'win32' ? url : undefined);
  });
}

/** @param {{name:string,apiUrl:string,webUrl?:string}} profile @param {{browser:boolean,timeout:number,webUrl?:string}} options */
export async function login(profile, options) {
  const website = options.webUrl ?? profile.webUrl;
  if (!website)
    throw new CliError(
      'WEB_URL_REQUIRED',
      'This profile needs an authorization website. Use auth login --web-url <origin>, or create a profile with --web-url.',
      2
    );
  const origin = webUrl(website);
  await checkCredentialStore(profile);
  const previous = await readCredential(profile);
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const controller = new AbortController();
  let busy = false;
  let settled = false;
  /** @type {ReturnType<typeof setTimeout>|undefined} */ let timer;
  /** @type {CliError|undefined} */ let cancellation;
  /** @type {(value: {id:string,name:string,email:string}) => void} */ let succeed;
  /** @type {(reason:unknown)=>void} */ let fail;
  const completion = new Promise((resolve, reject) => {
    succeed = resolve;
    fail = reject;
  });
  // Attach before browser startup so an immediate cancellation is always observed.
  completion.catch(() => {});
  const server = createServer((req, res) => {
    void handle(req, res).catch(() => {
      if (!res.headersSent)
        reply(res, 500, 'Login could not complete. Return to the terminal.');
      finishFailure(
        new CliError(
          'AUTH_FAILED',
          'Login could not complete. Explicitly restart login.',
          3
        )
      );
    });
  });
  /** @type {Set<import('node:net').Socket>} */ const sockets = new Set();
  server.on('connection', socket => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });
  const stop = () => {
    if (timer) clearTimeout(timer);
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', interrupt);
    server.close();
    server.closeIdleConnections();
    for (const socket of sockets) socket.destroy();
  };
  /** @param {unknown} error */
  const finishFailure = error => {
    if (settled) return;
    settled = true;
    stop();
    fail(error);
  };
  /** @param {CliError} error */
  const cancel = error => {
    if (settled) return;
    cancellation = error;
    controller.abort();
    if (!busy) finishFailure(error);
  };
  const interrupt = () =>
    cancel(
      new CliError(
        'AUTH_CANCELLED',
        'Login cancelled. No new credential was retained.',
        3
      )
    );
  /** @type {number} */ let port;
  /** @param {import('node:http').ServerResponse} res @param {number} status @param {string} message */
  const reply = (res, status, message) =>
    new Promise(resolve => {
      if (res.destroyed || res.writableEnded) {
        resolve(false);
        return;
      }
      res.once('finish', () => resolve(true));
      res.once('close', () => resolve(res.writableFinished));
      res.writeHead(status, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
        'x-content-type-options': 'nosniff',
        connection: 'close',
      });
      res.end(`<!doctype html><title>Groupi CLI</title><p>${message}</p>`);
    });
  /** @param {import('node:http').IncomingMessage} req @param {import('node:http').ServerResponse} res */
  async function handle(req, res) {
    if (settled || busy) {
      reply(res, 409, 'This login request is already being handled.');
      return;
    }
    if (
      req.method !== 'GET' ||
      req.headers.host !== `127.0.0.1:${port}` ||
      !req.url ||
      req.url.length > 2048
    ) {
      reply(res, 400, 'Invalid login callback.');
      return;
    }
    let url;
    try {
      url = new URL(req.url, `http://127.0.0.1:${port}`);
    } catch {
      reply(res, 400, 'Invalid login callback.');
      return;
    }
    if (
      url.origin !== `http://127.0.0.1:${port}` ||
      url.pathname !== '/callback' ||
      url.searchParams.getAll('state').length !== 1 ||
      url.searchParams.get('state') !== state ||
      url.searchParams.getAll('error').length > 1 ||
      (url.searchParams.has('error') &&
        (url.searchParams.has('code') ||
          url.searchParams.get('error') !== 'access_denied')) ||
      [...url.searchParams.keys()].some(
        key => !['state', 'code', 'error'].includes(key)
      )
    ) {
      reply(res, 400, 'Invalid login session.');
      return;
    }
    if (
      url.searchParams.get('error') === 'access_denied' &&
      !url.searchParams.has('code')
    ) {
      await reply(res, 200, 'Login cancelled. Return to your terminal.');
      interrupt();
      return;
    }
    const code = url.searchParams.get('code');
    if (
      url.searchParams.getAll('code').length !== 1 ||
      !code ||
      !/^[A-Za-z0-9_-]{43}$/.test(code)
    ) {
      reply(res, 400, 'Invalid authorization code.');
      return;
    }
    busy = true;
    /** @type {string|undefined} */ let issued;
    let saved = false;
    try {
      const result = await authRequest(
        profile,
        '/auth/cli/exchange',
        { code, state, verifier, callbackPort: port },
        undefined,
        controller.signal
      );
      if (
        typeof result?.apiKey === 'string' &&
        result.apiKey.length <= 8192 &&
        /^[\x21-\x7e]+$/.test(result.apiKey)
      )
        issued = result.apiKey;
      if (
        !issued ||
        !Number.isFinite(result.expiresAt) ||
        result.expiresAt <= Date.now() ||
        !result.account ||
        typeof result.account.id !== 'string' ||
        !result.account.id ||
        typeof result.account.name !== 'string' ||
        typeof result.account.email !== 'string'
      )
        throw new CliError(
          'INVALID_RESPONSE',
          'The authentication server returned incomplete credential data.',
          5
        );
      if (cancellation) throw cancellation;
      await saveCredential(profile, result);
      saved = true;
      if (cancellation) throw cancellation;
      const acknowledged = await reply(
        res,
        200,
        'Connected. Your credential is saved securely. You may close this tab.'
      );
      if (!acknowledged)
        throw new CliError(
          'AUTH_DELIVERY_FAILED',
          'The browser disconnected before login was acknowledged. Explicitly restart login.',
          3
        );
      settled = true;
      stop();
      succeed(result.account);
    } catch (error) {
      let cleanupFailed = false;
      if (saved)
        try {
          if (previous) await saveCredential(profile, previous);
          else await deleteCredential(profile);
        } catch {
          cleanupFailed = true;
        }
      if (issued)
        try {
          await authRequest(profile, '/auth/cli/revoke', {}, issued);
        } catch {
          cleanupFailed = true;
        }
      await reply(
        res,
        500,
        'Login did not complete. Return to the terminal for details.'
      );
      finishFailure(
        cleanupFailed
          ? new CliError(
              'AUTH_CLEANUP_REQUIRED',
              'Login failed and credential cleanup could not be confirmed. Inspect this profile’s saved credential and revoke the newly issued CLI key in browser API-key settings.',
              3
            )
          : (cancellation ?? error)
      );
    }
  }
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => resolve(undefined));
    });
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new CliError(
        'LISTENER_FAILED',
        'Could not start the local login listener.',
        3
      );
    port = address.port;
    process.once('SIGINT', interrupt);
    process.once('SIGTERM', interrupt);
    timer = setTimeout(
      () =>
        cancel(
          new CliError(
            'AUTH_TIMEOUT',
            'Login timed out. Explicitly run auth login to try again.',
            3
          )
        ),
      options.timeout * 1000
    );
    const url = new URL('/cli-auth', origin);
    url.searchParams.set('callbackPort', String(port));
    url.searchParams.set('state', state);
    url.searchParams.set('challenge', challenge);
    process.stderr.write(
      `Authorize profile ${profile.name} (${profile.apiUrl}) as the intended account:\n${url.href}\n`
    );
    if (options.browser) await openBrowser(url.href);
    return await completion;
  } catch (error) {
    cancel(
      error instanceof CliError
        ? error
        : new CliError(
            'LISTENER_FAILED',
            'Could not start browser login. Check local networking and try again.',
            3
          )
    );
    return await completion;
  } finally {
    stop();
  }
}
