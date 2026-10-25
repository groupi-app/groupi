import { readFile, stat } from 'node:fs/promises';
import { CliError } from './errors.js';

/** @param {{file?:string,stdin?:boolean}} input @param {boolean} keyStdin */
export async function readDefinition(input, keyStdin) {
  if (Number(input.file !== undefined) + Number(!!input.stdin) !== 1)
    throw new CliError(
      'USAGE',
      'Choose exactly one definition source: --file or --stdin.',
      2
    );
  if (input.stdin && keyStdin)
    throw new CliError(
      'USAGE',
      'Definition and API credentials cannot both consume stdin. Use --file or a profile-bound environment key.',
      2
    );
  if (input.stdin && process.stdin.isTTY)
    throw new CliError(
      'USAGE',
      'Pipe JSON into --stdin or use --file; interactive input is unsupported.',
      2
    );
  let raw = '';
  try {
    if (input.file !== undefined) {
      const info = await stat(input.file);
      if (!info.isFile() || info.size > 65536) throw Error();
      raw = await readFile(input.file, 'utf8');
    } else {
      process.stdin.setEncoding('utf8');
      for await (const chunk of process.stdin) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 65536) throw Error();
      }
    }
    if (Buffer.byteLength(raw) > 65536) throw Error();
  } catch {
    throw new CliError(
      'USAGE',
      'Definition input must be a readable JSON file or stream of at most 64 KiB.',
      2
    );
  }
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new CliError('USAGE', 'Definition input must contain valid JSON.', 2);
  }
  return value;
}
