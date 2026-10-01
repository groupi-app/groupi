import { readFile } from 'node:fs/promises';
import { marked } from 'marked';
import { CliError } from './errors.js';
/** @param {string} text */
export function textToHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map(line => `<p>${line}</p>`)
    .join('');
}
/** @param {{content?:string,file?:string,stdin?:boolean,contentFormat?:string}} input @param {boolean} keyStdin */
export async function readContent(input, keyStdin) {
  const channels = [
    input.content !== undefined,
    input.file !== undefined,
    !!input.stdin,
  ].filter(Boolean).length;
  if (channels > 1)
    throw new CliError(
      'USAGE',
      'Choose exactly one of --content, --file, or --stdin.',
      2
    );
  if (!channels) return undefined;
  if (input.stdin && keyStdin)
    throw new CliError(
      'USAGE',
      'Content and API credentials cannot both consume stdin. Use a profile-bound environment key or --file.',
      2
    );
  let raw;
  try {
    if (input.content !== undefined) raw = input.content;
    else if (input.stdin) {
      raw = '';
      process.stdin.setEncoding('utf8');
      for await (const chunk of process.stdin) {
        raw += chunk.toString();
        if (Buffer.byteLength(raw) > 65536) throw Error();
      }
    } else raw = await readFile(/** @type {string} */ (input.file), 'utf8');
  } catch {
    throw new CliError('USAGE', 'Unable to read content input.', 2);
  }
  if (Buffer.byteLength(raw) > 65536)
    throw new CliError('USAGE', 'Content input exceeds 64 KiB.', 2);
  const format = input.contentFormat ?? 'text';
  if (format === 'html') return raw;
  if (format === 'text') return textToHtml(raw);
  if (format === 'markdown') return await marked.parse(raw, { async: false });
  throw new CliError(
    'USAGE',
    '--content-format must be text, markdown, or html.',
    2
  );
}
/** Terminal-only projection; edits always use original HTML, never this lossy view.
 * @param {string} html */
export function readableContent(html) {
  return (
    html
      .replace(/<\/(p|li|h[1-6]|pre|blockquote)>|<br\s*\/?\s*>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      // eslint-disable-next-line no-control-regex -- Remote content cannot control the terminal.
      .replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, '')
  );
}
