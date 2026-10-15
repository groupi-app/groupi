import process from 'node:process';
import { URL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const config = JSON.parse(
  await readFile(join(process.env.GROUPI_CONFIG_DIR, 'test.json'), 'utf8')
);
const args = process.argv.slice(2);
const index = args.indexOf('--format');
const code = `import json,os,re,sys
from groupi_sdk import Groupi,GroupiError
client=Groupi(instance=os.environ['SDK_ORIGIN'],api_key=os.environ['GROUPI_API_KEY'])
try:
 method=re.sub(r'(?<!^)(?=[A-Z])','_',sys.argv[1]).lower()
 input=json.loads(sys.argv[2])
 print(json.dumps(client.upload(input['content'].encode(),filename=input['metadata']['filename'],mime_type=input['metadata']['mimeType']) if method=='upload' else getattr(client,method)(**input)))
except GroupiError as error:
 print(json.dumps({'status':error.status,'code':error.code,'message':str(error)}));sys.exit(1)
`;
const child = spawn(
  'python3',
  ['-c', code, args[index + 2], args[index + 3] ?? '{}'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      SDK_ORIGIN: new URL(config.apiUrl).origin,
      PYTHONPATH: fileURLToPath(new URL('../../python-sdk/', import.meta.url)),
    },
  }
);
child.on('exit', code => {
  process.exitCode = code ?? 1;
});
