import type { Token, TokenType } from './types';
const DAY_ABBREVS = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];
type TokCtx = 'default' | 'time' | 'duration';

export function tokenizeGDL(input: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  let ctx: TokCtx = 'default';

  function push(type: TokenType, start: number, end: number): void {
    out.push({ type, value: input.slice(start, end), start, end });
  }

  while (i < input.length) {
    const ch = input[i];

    // ---- whitespace ----
    if (/\s/.test(ch)) {
      const s = i;
      while (i < input.length && /\s/.test(input[i])) i++;
      push('whitespace', s, i);
      continue;
    }

    // ---- quoted note ----
    if (ch === '"') {
      const s = i;
      i++;
      while (i < input.length && input[i] !== '"') i++;
      if (i < input.length) {
        i++;
        push('note', s, i);
      } else {
        push('error', s, i);
      }
      ctx = 'default';
      continue;
    }

    // ---- operators ----
    if (ch === '@') {
      push('operator', i, i + 1);
      ctx = 'time';
      i++;
      continue;
    }
    if (ch === '^') {
      push('operator', i, i + 1);
      ctx = 'duration';
      i++;
      continue;
    }
    if (ch === '-') {
      push('operator', i, i + 1);
      // stay in time context if already there
      if (ctx !== 'time') ctx = 'default';
      i++;
      continue;
    }

    // ---- recurrence *N ----
    if (ch === '*') {
      push('operator', i, i + 1);
      i++;
      // Try to consume digits immediately (no space): *3 → recurrence token
      if (i < input.length && /\d/.test(input[i])) {
        const ds = i;
        while (i < input.length && /\d/.test(input[i])) i++;
        push('recurrence', ds, i);
      }
      ctx = 'default';
      continue;
    }

    // ---- combiner / separator / brackets ----
    if (ch === '+') {
      push('combiner', i, i + 1);
      ctx = 'default';
      i++;
      continue;
    }
    if (ch === ',') {
      push('separator', i, i + 1);
      i++;
      continue;
    }
    if (ch === '[' || ch === ']' || ch === '(' || ch === ')') {
      push('bracket', i, i + 1);
      i++;
      continue;
    }

    // ---- digits ----
    if (/\d/.test(ch)) {
      const s = i;

      if (ctx === 'duration') {
        while (i < input.length && /\d/.test(input[i])) i++;
        if (i < input.length && /[hHmM]/.test(input[i])) i++;
        push('time', s, i);
        continue;
      }

      if (ctx === 'time') {
        while (i < input.length && /\d/.test(input[i])) i++;
        if (i < input.length && input[i] === ':') {
          i++;
          while (i < input.length && /\d/.test(input[i])) i++;
        }
        if (
          i + 1 < input.length &&
          /[aApP]/.test(input[i]) &&
          /[mM]/.test(input[i + 1])
        ) {
          i += 2;
        }
        push('time', s, i);
        continue;
      }

      // default: date (DD or MM/DD)
      while (i < input.length && /\d/.test(input[i])) i++;
      if (i < input.length && input[i] === '/') {
        i++;
        while (i < input.length && /\d/.test(input[i])) i++;
      }
      push('date', s, i);
      continue;
    }

    // ---- letters ----
    if (/[a-zA-Z]/.test(ch)) {
      const s = i;
      while (i < input.length && /[a-zA-Z]/.test(input[i])) i++;
      const val = input.slice(s, i);
      if (DAY_ABBREVS.includes(val.toLowerCase())) {
        push('day', s, i);
        ctx = 'default';
      } else {
        push('error', s, i);
      }
      continue;
    }

    // ---- unknown ----
    push('error', i, i + 1);
    i++;
  }

  return out;
}
