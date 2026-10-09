import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function origin(value) {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error(
      'Expected an HTTPS origin without credentials, path, or query'
    );
  }
  return url.origin;
}

export async function checkReadiness({ url, sha, backend }, fetcher = fetch) {
  const base = origin(url);
  if (!/^[a-f0-9]{40}$/.test(sha ?? ''))
    throw new Error('A full expected commit SHA is required');
  async function json(url) {
    const response = await fetcher(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      throw new Error(`Readiness endpoint returned HTTP ${response.status}`);
    return response.json();
  }
  const config = await json(`${base}/.well-known/e2e-config.json`);
  if (config.commit !== sha)
    throw new Error(
      'Deployment commit is missing or does not match expected commit'
    );
  if (config.environment !== 'preview')
    throw new Error('Only explicit preview deployments may run this check');
  const convex = origin(config.convexUrl);
  if (!/^https:\/\/[a-z0-9-]+\.convex\.cloud$/.test(convex))
    throw new Error('Invalid Convex deployment origin');
  if (backend && convex !== origin(backend))
    throw new Error('Deployment backend does not match expected backend');
  const health = await json(
    `${convex.replace('.convex.cloud', '.convex.site')}/api/v2/health`
  );
  if (health?.status !== 'ok')
    throw new Error('Backend health did not report ok');
  return {
    checkedAt: new Date().toISOString(),
    web: { status: 'verified', url: base, commit: sha, backend: convex },
    backend: {
      status: 'reachable',
      expectedOriginMatched: Boolean(backend),
      sourceCommit: 'unverified',
    },
    signedIn: {
      status: 'unverified',
      reason:
        'Requires an isolated authenticated browser check; public health is not authentication proof',
    },
    native: {
      status: 'unverified',
      reason:
        'Requires matching installed build, backend, device and guided VoiceOver evidence',
    },
  };
}

export function localRefs(run = execFileSync) {
  const refs = {};
  for (const ref of [
    'HEAD',
    'refs/remotes/origin/main',
    'refs/remotes/origin/test',
  ]) {
    try {
      refs[ref] = run('git', ['rev-parse', '--verify', ref], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      refs[ref] = null;
    }
  }
  return { status: 'local-cache-only', refs };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const [url, sha, backend] = process.argv.slice(2);
    const report = await checkReadiness({ url, sha, backend });
    report.git = localRefs();
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error(`Readiness blocked: ${error.message}`);
    process.exitCode = 1;
  }
}
