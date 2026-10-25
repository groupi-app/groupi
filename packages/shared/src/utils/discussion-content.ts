import { Parser } from 'htmlparser2';

export const DISCUSSION_LIMITS = {
  title: 100,
  post: 3000,
  reply: 5000,
  payload: 65536,
} as const;
export function escapeContent(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
/** Strict allowlist: reject lossy/unsafe edits rather than silently dropping markup. */
export function safeDiscussionContent(input: string): {
  html: string;
  text: string;
  mentions: string[];
} {
  if (new TextEncoder().encode(input).length > DISCUSSION_LIMITS.payload)
    throw new Error('Content payload exceeds 64 KiB');
  let html = '',
    text = '';
  const mentions: string[] = [];
  const stack: string[] = [];
  const allowed = new Set([
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'del',
    'strike',
    'blockquote',
    'ul',
    'ol',
    'li',
    'pre',
    'code',
    'a',
    'span',
    'h1',
    'h2',
    'h3',
    'hr',
    'div',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'td',
    'th',
    'caption',
    'colgroup',
    'col',
    'input',
  ]);
  let failure = '';
  const parser = new Parser(
    {
      onopentag(name, attrs) {
        if (!allowed.has(name)) {
          failure = `Unsupported HTML element ${name}. Use supported HTML or explicitly replace with text/Markdown.`;
          return;
        }
        const permitted = [
          'style',
          'class',
          ...(name === 'a' ? ['href', 'target', 'rel'] : []),
          ...(name === 'span' || name === 'code' ? ['class'] : []),
          ...(name === 'ol' ? ['start'] : []),
          ...(['td', 'th'].includes(name) ? ['colspan', 'rowspan'] : []),
          ...(name === 'input' ? ['type', 'checked', 'disabled'] : []),
          ...(name === 'col' ? ['span'] : []),
        ];
        if (
          Object.keys(attrs).some(
            key => !permitted.includes(key) && !/^data-[a-z0-9-]+$/.test(key)
          )
        )
          failure =
            'Unsupported HTML attribute; remove it explicitly before editing.';
        let output = '';
        for (const [key, value] of Object.entries(attrs)) {
          if (key === 'style') {
            try {
              output += ` style="${escapeContent(safeStyle(value))}"`;
            } catch {
              failure = 'Unsupported or unsafe formatting style.';
            }
          } else if (/^data-[a-z0-9-]+$/.test(key))
            output += ` ${key}="${escapeContent(value)}"`;
        }
        if (name === 'a') {
          if (attrs.href && !/^(https?:\/\/|mailto:|#)/i.test(attrs.href))
            failure = 'Only HTTP(S), mailto, and fragment links are supported.';
          if (attrs.href)
            output += ` href="${escapeContent(attrs.href)}" rel="noopener noreferrer"`;
        }
        if (attrs.class) {
          if (
            (name === 'p' && attrs.class === 'bn-inline-content') ||
            (name === 'span' && attrs.class === 'mention') ||
            (name === 'code' && /^language-[a-z0-9_-]+$/i.test(attrs.class))
          )
            output += ` class="${attrs.class}"`;
          else failure = 'Unsupported HTML class.';
        }
        if (attrs['data-id']) {
          if (
            name !== 'span' ||
            !/^[a-zA-Z0-9_;-]+$/.test(attrs['data-id']) ||
            !(attrs.class === 'mention' || attrs['data-type'] === 'mention')
          )
            failure = 'Malformed person mention';
          mentions.push(attrs['data-id']);
        } else if (
          attrs.class === 'mention' ||
          attrs['data-type'] === 'mention'
        )
          failure = 'Mention spans require a valid person ID.';
        for (const field of ['start', 'colspan', 'rowspan', 'span'])
          if (attrs[field]) {
            if (!/^\d{1,4}$/.test(attrs[field]))
              failure = 'Invalid list/table dimension';
            else output += ` ${field}="${attrs[field]}"`;
          }
        if (name === 'input') {
          if (attrs.type !== 'checkbox')
            failure = 'Only inert checklist checkboxes are supported';
          output += ' type="checkbox" disabled';
          if ('checked' in attrs) output += ' checked';
        }
        html += `<${name}${output}>`;
        if (!['br', 'hr', 'col', 'input'].includes(name)) stack.push(name);
        else text += '\n';
      },
      ontext(value) {
        html += escapeContent(value);
        text += value;
      },
      onclosetag(name) {
        if (!allowed.has(name) || ['br', 'hr', 'col', 'input'].includes(name))
          return;
        const open = stack.pop();
        if (open !== name)
          failure = 'Malformed HTML; use balanced supported elements.';
        html += `</${name}>`;
        if (['p', 'li', 'blockquote', 'pre', 'h1', 'h2', 'h3'].includes(name))
          text += '\n';
      },
      oncomment() {
        failure = 'HTML comments are not supported.';
      },
      onprocessinginstruction() {
        failure = 'HTML declarations are not supported.';
      },
    },
    { decodeEntities: true }
  );
  parser.write(input);
  parser.end();
  if (failure) throw new Error(failure);
  return { html, text: text.trim(), mentions: [...new Set(mentions)] };
}
export function visibleDiscussionLength(input: string) {
  return Array.from(safeDiscussionContent(input).text).length;
}
export function validateDiscussionLength(
  input: string,
  limit: number,
  previous?: string
) {
  if (input === previous) return;
  const length = visibleDiscussionLength(input);
  const oldLength = previous === undefined ? 0 : legacyVisibleLength(previous);
  if (length > limit && !(oldLength > limit && length < oldLength))
    throw new Error(
      `Content exceeds ${limit} visible characters; oversized legacy content must strictly decrease in length.`
    );
}

/** Pure UI validation shares the server's visible-length/legacy rule. */
export function discussionLengthAllowed(
  input: string,
  limit: number,
  previous?: string
): boolean {
  try {
    validateDiscussionLength(input, limit, previous);
    return true;
  } catch {
    return false;
  }
}
export function titleLengthAllowed(input: string, previous?: string): boolean {
  const n = Array.from(input.trim()).length,
    old = Array.from(previous ?? '').length;
  return input === previous || n <= 100 || (old > 100 && n < old);
}

/** Counting old content must not require it to pass the new sanitizer. */
function legacyVisibleLength(input: string) {
  let text = '';
  const parser = new Parser(
    {
      ontext: value => {
        text += value;
      },
      onclosetag: name => {
        if (['p', 'li', 'blockquote', 'pre', 'h1', 'h2', 'h3'].includes(name))
          text += '\n';
      },
      onopentag: name => {
        if (['br', 'hr', 'col', 'input'].includes(name)) text += '\n';
      },
    },
    { decodeEntities: true }
  );
  parser.end(input);
  return Array.from(text.trim()).length;
}

function safeStyle(input: string): string {
  return input
    .split(';')
    .filter(part => part.trim())
    .map(part => {
      const split = part.indexOf(':');
      const property = part.slice(0, split).trim().toLowerCase(),
        value = part.slice(split + 1).trim();
      const choices: Record<string, RegExp> = {
        'text-align': /^(left|right|center|justify|start|end)$/,
        'font-weight': /^(normal|bold|[1-9]00)$/,
        'font-style': /^(normal|italic)$/,
        'text-decoration':
          /^(none|underline|line-through)( (underline|line-through))?$/,
        'text-decoration-line':
          /^(none|underline|line-through)( (underline|line-through))?$/,
        'white-space': /^(pre|pre-wrap|normal)$/,
        color:
          /^(#[0-9a-f]{3,8}|[a-z]+|(rgb|rgba|hsl|hsla)\([0-9.,% /-]+\)|var\(--bn-[a-z-]+\))$/i,
        'background-color':
          /^(#[0-9a-f]{3,8}|[a-z]+|(rgb|rgba|hsl|hsla)\([0-9.,% /-]+\)|var\(--bn-[a-z-]+\))$/i,
      };
      if (!choices[property]?.test(value)) throw Error('Unsupported style');
      return `${property}: ${value}`;
    })
    .join('; ');
}

export function hasDiscussionText(input: string): boolean {
  return legacyVisibleLength(input) > 0;
}
