import { Buffer } from 'node:buffer';
import console from 'node:console';
import process from 'node:process';
import { URL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Groupi } from '../src/index.js';
const config = JSON.parse(
  await readFile(join(process.env.GROUPI_CONFIG_DIR, 'test.json'), 'utf8')
);
const client = new Groupi({
  instance: new URL(config.apiUrl).origin,
  credential: { type: 'apiKey', key: process.env.GROUPI_API_KEY },
});
const args = process.argv.slice(2);
const index = args.indexOf('--format');
const operation = args[index + 2];
const input = JSON.parse(args[index + 3] ?? '{}');
try {
  console.log(
    JSON.stringify(
      await (operation === 'upload'
        ? client.upload(Buffer.from(input.content), input.metadata)
        : client[operation](input))
    )
  );
} catch (error) {
  console.log(
    JSON.stringify({
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details,
    })
  );
  process.exitCode = 1;
}
