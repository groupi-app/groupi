import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import console from 'node:console';
const sdk = resolve(fileURLToPath(new URL('..', import.meta.url)));
const python = resolve(sdk, '../python-sdk');
const temp = mkdtempSync(join(tmpdir(), 'groupi-sdk-package-'));
const run = (cmd, args, options = {}) =>
  execFileSync(cmd, args, { stdio: 'inherit', ...options });
try {
  run('pnpm', ['pack', '--pack-destination', temp], { cwd: sdk });
  writeFileSync(
    join(temp, 'package.json'),
    JSON.stringify({ private: true, type: 'module' })
  );
  const tarball = readdirSync(temp).find(name => name.endsWith('.tgz'));
  run('pnpm', ['add', '--ignore-scripts', join(temp, tarball)], { cwd: temp });
  run(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "import {Groupi,DelegatedSession} from '@groupi/sdk'; const c=new Groupi({instance:'https://example.com',credential:{type:'apiKey',key:'test'}}); if(typeof c.createEvent !== 'function'||typeof c.listEventsItems !== 'function') throw Error('Missing installed operations'); const request=await DelegatedSession.authorizationRequest({instance:'https://example.com',issuer:'https://example.com/oauth',audience:'https://example.com/api/v2',clientId:'test',clientType:'native',actions:['events.read']},{redirectUri:'https://app.example/callback'}); if(new URL(request.url).searchParams.get('code_challenge_method')!=='S256') throw Error('Missing installed OAuth adapter');",
    ],
    { cwd: temp }
  );
  writeFileSync(
    join(temp, 'consumer.ts'),
    readFileSync(join(sdk, 'tests/consumer.ts'), 'utf8').replaceAll(
      '../src/index.js',
      '@groupi/sdk'
    )
  );
  writeFileSync(
    join(temp, 'tsconfig.json'),
    readFileSync(join(sdk, 'tests/tsconfig.json'))
  );
  run('pnpm', ['exec', 'tsc', '--project', join(temp, 'tsconfig.json')], {
    cwd: sdk,
  });
  run('python3', [
    '-m',
    'pip',
    'wheel',
    '--no-deps',
    python,
    '--wheel-dir',
    temp,
  ]);
  const wheel = readdirSync(temp).find(name => name.endsWith('.whl'));
  run('python3', [
    '-m',
    'pip',
    'install',
    '--no-deps',
    '--target',
    join(temp, 'python-install'),
    join(temp, wheel),
  ]);
  run(
    'python3',
    [
      '-c',
      "from groupi_sdk.client import CreateEventRequest,EventCreateResponse,EventSummary,InviteListDetail; from groupi_sdk import Groupi,AsyncGroupi,DelegatedSession; assert CreateEventRequest(title='Dinner')['title']=='Dinner'; c=Groupi(instance='https://example.com',api_key='test'); assert callable(c.create_event); assert callable(c.list_events_items)",
    ],
    {
      cwd: temp,
      env: { ...process.env, PYTHONPATH: join(temp, 'python-install') },
    }
  );
  if (!existsSync(join(temp, 'python-install/groupi_sdk/py.typed')))
    throw new Error('Missing Python typing marker');
  run('python3', [join(sdk, 'scripts/check-python-types.py')], {
    cwd: temp,
    env: {
      ...process.env,
      SDK_TYPECHECK_PACKAGE_PATH: join(temp, 'python-install'),
    },
  });
  console.log('Clean installed SDK imports passed:', process.version);
  run('python3', ['--version']);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
