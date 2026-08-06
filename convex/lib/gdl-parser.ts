// Groupi Date Language (GDL) Parser
// Three-stage pipeline: Tokenizer -> Parser -> Evaluator
// Self-contained, no external dependencies.

// =============================================================================
// Public Types
// =============================================================================

export type TokenType =
  | 'day'
  | 'date'
  | 'time'
  | 'operator'
  | 'bracket'
  | 'recurrence'
  | 'note'
  | 'error'
  | 'whitespace'
  | 'separator'
  | 'combiner';

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

export interface DateTimeOption {
  start: Date;
  end?: Date;
  note?: string;
}

export type GDLResult =
  | { success: true; results: DateTimeOption[] }
  | { success: false; error: string };

// =============================================================================
// Constants
// =============================================================================

const DAY_ABBREVS: ReadonlyArray<string> = [
  'mo',
  'tu',
  'we',
  'th',
  'fr',
  'sa',
  'su',
];

const MAX_OPTIONS = 20;

// GDL: Mo=0 .. Su=6.  JS Date: Su=0 .. Sa=6.
function gdlToJs(gdl: number): number {
  return (gdl + 1) % 7;
}

const MONTH_DAYS = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function maxDay(month: number, year: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return MONTH_DAYS[month];
}

function validDayForMonth(month: number, day: number): boolean {
  return day >= 1 && day <= MONTH_DAYS[month];
}

// =============================================================================
// Error
// =============================================================================

class GDLError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GDLError';
  }
}

// =============================================================================
// Stage 1 — Tokenizer
// =============================================================================

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

// =============================================================================
// AST node types (internal)
// =============================================================================

interface DayNode {
  kind: 'day';
  idx: number;
}
interface DateNode {
  kind: 'date';
  month: number | null;
  day: number;
}
interface TimeNode {
  kind: 'time';
  hour: number;
  minute: number;
}
interface DurationNode {
  kind: 'duration';
  minutes: number;
}
interface ListNode {
  kind: 'list';
  items: ASTNode[];
}
interface RangeNode {
  kind: 'range';
  from: ASTNode;
  to: ASTNode;
}
interface TimeAttachNode {
  kind: 'timeAttach';
  days: ASTNode;
  times: ASTNode;
}
interface SpanNode {
  kind: 'span';
  base: ASTNode;
  end: ASTNode;
}
interface DurAttachNode {
  kind: 'durAttach';
  base: ASTNode;
  dur: ASTNode;
}
interface RecurNode {
  kind: 'recur';
  item: ASTNode;
  count: number;
}
interface NoteNode {
  kind: 'note';
  item: ASTNode;
  text: string;
}
interface UnionNode {
  kind: 'union';
  items: ASTNode[];
}

type ASTNode =
  | DayNode
  | DateNode
  | TimeNode
  | DurationNode
  | ListNode
  | RangeNode
  | TimeAttachNode
  | SpanNode
  | DurAttachNode
  | RecurNode
  | NoteNode
  | UnionNode;

// =============================================================================
// Value-parsing helpers
// =============================================================================

function parseTime(raw: string): { hour: number; minute: number } {
  let s = raw.toLowerCase().trim();

  if (s.includes('/')) {
    throw new GDLError(`"${raw}" looks like a date, not a time`);
  }

  let pm = false;
  let am = false;
  if (s.endsWith('pm')) {
    pm = true;
    s = s.slice(0, -2);
  } else if (s.endsWith('am')) {
    am = true;
    s = s.slice(0, -2);
  }

  let hour: number;
  let minute = 0;
  const ci = s.indexOf(':');
  if (ci !== -1) {
    hour = Number(s.slice(0, ci));
    minute = Number(s.slice(ci + 1));
  } else {
    hour = Number(s);
  }

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    throw new GDLError(`Invalid time: "${raw}"`);
  }

  if (pm || am) {
    if (hour < 1 || hour > 12) {
      throw new GDLError(`12-hour time "${raw}" requires hour 1-12`);
    }
    if (pm && hour !== 12) hour += 12;
    if (am && hour === 12) hour = 0;
  }

  if (hour < 0 || hour > 23) {
    throw new GDLError(`Hour in "${raw}" must be 0-23`);
  }
  if (minute < 0 || minute > 59) {
    throw new GDLError(`Minute in "${raw}" must be 0-59`);
  }
  return { hour, minute };
}

function parseDate(raw: string): { month: number | null; day: number } {
  if (raw.includes('/')) {
    const si = raw.indexOf('/');
    const month = Number(raw.slice(0, si));
    const day = Number(raw.slice(si + 1));
    if (!Number.isFinite(month) || !Number.isFinite(day)) {
      throw new GDLError(`Invalid date: "${raw}"`);
    }
    if (month < 1 || month > 12) {
      throw new GDLError(`Month in "${raw}" must be 1-12`);
    }
    if (!validDayForMonth(month, day)) {
      throw new GDLError(`Day ${day} is invalid for month ${month}`);
    }
    return { month, day };
  }
  const day = Number(raw);
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    throw new GDLError(`Day-of-month "${raw}" must be 1-31`);
  }
  return { month: null, day };
}

function parseDuration(raw: string): { minutes: number } {
  const s = raw.toLowerCase().trim();
  if (s.endsWith('h')) {
    const n = Number(s.slice(0, -1));
    if (!Number.isFinite(n) || n <= 0) {
      throw new GDLError(`Invalid duration: "${raw}"`);
    }
    return { minutes: n * 60 };
  }
  if (s.endsWith('m')) {
    const n = Number(s.slice(0, -1));
    if (!Number.isFinite(n) || n <= 0) {
      throw new GDLError(`Invalid duration: "${raw}"`);
    }
    return { minutes: n };
  }
  throw new GDLError(
    `Duration "${raw}" must end with h (hours) or m (minutes)`
  );
}

function dayIndex(val: string): number {
  const i = DAY_ABBREVS.indexOf(val.toLowerCase());
  if (i === -1) throw new GDLError(`Unknown day: "${val}"`);
  return i;
}

// =============================================================================
// Stage 2 — Parser (recursive descent)
// =============================================================================

class Parser {
  private toks: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.toks = tokens.filter(t => t.type !== 'whitespace');
  }

  parse(): ASTNode {
    if (this.toks.length === 0) throw new GDLError('Empty expression');
    const node = this.pExpression();
    if (this.pos < this.toks.length) {
      const t = this.toks[this.pos];
      throw new GDLError(`Unexpected "${t.value}" at position ${t.start}`);
    }
    return node;
  }

  // helpers
  private peek(): Token | undefined {
    return this.toks[this.pos];
  }
  private advance(): Token {
    if (this.pos >= this.toks.length)
      throw new GDLError('Unexpected end of input');
    return this.toks[this.pos++];
  }
  private isVal(v: string): boolean {
    return this.peek()?.value === v;
  }
  private isType(t: TokenType): boolean {
    return this.peek()?.type === t;
  }

  // expression := entry ('+' entry)*
  private pExpression(): ASTNode {
    const items: ASTNode[] = [this.pEntry()];
    while (this.isType('combiner')) {
      this.advance();
      items.push(this.pEntry());
    }
    return items.length === 1 ? items[0] : { kind: 'union', items };
  }

  // entry := coreExpr (NOTE)?
  private pEntry(): ASTNode {
    let node = this.pCore();
    if (this.isType('note')) {
      const t = this.advance();
      node = { kind: 'note', item: node, text: t.value.slice(1, -1) };
    }
    return node;
  }

  // coreExpr := timeAttach ('-' timeVal | '^' durVal)?
  private pCore(): ASTNode {
    let node = this.pTimeAttach();

    if (this.isVal('-')) {
      this.advance();
      const endTime = this.pTimeVal();
      node = { kind: 'span', base: node, end: endTime };
      if (this.isVal('^'))
        throw new GDLError('Span (-) and duration (^) cannot be combined');
    } else if (this.isVal('^')) {
      this.advance();
      const dur = this.pDurVal();
      node = { kind: 'durAttach', base: node, dur };
      if (this.isVal('-'))
        throw new GDLError('Duration (^) and span (-) cannot be combined');
    }

    return node;
  }

  // timeAttach := dayExpr ('@' timeVal)?
  private pTimeAttach(): ASTNode {
    const days = this.pDayExpr();
    if (this.isVal('@')) {
      this.advance();
      const times = this.pTimeVal();
      return { kind: 'timeAttach', days, times };
    }
    return days;
  }

  // dayExpr := dayAtom (*N)?
  private pDayExpr(): ASTNode {
    let node = this.pDayAtom();
    // Handle recurrence: either *3 as one token, or * followed by number
    if (this.isType('recurrence')) {
      const t = this.advance();
      const n = Number(t.value.slice(1));
      if (n === 0)
        throw new GDLError('Recurrence *0 is not valid (minimum is *1)');
      node = { kind: 'recur', item: node, count: n };
    } else if (this.isVal('*')) {
      this.advance();
      const t = this.peek();
      if (!t || (t.type !== 'recurrence' && t.type !== 'date'))
        throw new GDLError('Expected a number after *');
      const nt = this.advance();
      const n = Number(nt.value);
      if (!Number.isInteger(n) || n < 1)
        throw new GDLError(
          'Recurrence count must be a positive integer (minimum *1)'
        );
      node = { kind: 'recur', item: node, count: n };
    }
    return node;
  }

  // dayAtom := DAY | DATE | '[' listItems ']' | '(' rangeEndpoints ')'
  private pDayAtom(): ASTNode {
    const t = this.peek();
    if (!t) throw new GDLError('Expected a day, date, or list');

    if (t.type === 'day') {
      this.advance();
      return { kind: 'day', idx: dayIndex(t.value) };
    }
    if (t.type === 'date') {
      this.advance();
      const d = parseDate(t.value);
      return { kind: 'date', month: d.month, day: d.day };
    }
    if (t.value === '[') return this.pDayList();
    if (t.value === '(') return this.pDayRange();

    throw new GDLError(
      `Expected day (Mo-Su), date, or list but got "${t.value}"`
    );
  }

  // '[' dayListItem (',' dayListItem)* ']'
  private pDayList(): ASTNode {
    this.advance(); // [
    const items: ASTNode[] = [this.pDayListItem()];
    while (this.isVal(',')) {
      this.advance();
      items.push(this.pDayListItem());
    }
    if (!this.isVal(']')) throw new GDLError('Expected "]" to close list');
    this.advance();
    if (items.length === 0) throw new GDLError('Empty list [] is not valid');
    return { kind: 'list', items };
  }

  // dayListItem := dayAtom (*N)? (NOTE)?
  private pDayListItem(): ASTNode {
    let node = this.pDayAtom();
    if (this.isType('recurrence')) {
      const t = this.advance();
      const n = Number(t.value.slice(1));
      if (n === 0) throw new GDLError('Recurrence *0 is not valid');
      node = { kind: 'recur', item: node, count: n };
    } else if (this.isVal('*')) {
      this.advance();
      const t = this.peek();
      if (!t || (t.type !== 'recurrence' && t.type !== 'date'))
        throw new GDLError('Expected a number after *');
      const nt = this.advance();
      const n = Number(nt.value);
      if (!Number.isInteger(n) || n < 1)
        throw new GDLError('Recurrence count must be a positive integer');
      node = { kind: 'recur', item: node, count: n };
    }
    if (this.isType('note')) {
      const t = this.advance();
      node = { kind: 'note', item: node, text: t.value.slice(1, -1) };
    }
    return node;
  }

  // '(' dayAtom ',' dayAtom ')'
  private pDayRange(): ASTNode {
    this.advance(); // (
    const from = this.pDayAtom();
    if (!this.isVal(','))
      throw new GDLError('Range needs exactly 2 items: (start, end)');
    this.advance();
    const to = this.pDayAtom();
    if (this.isVal(','))
      throw new GDLError('Range needs exactly 2 items, got more than 2');
    if (!this.isVal(')')) throw new GDLError('Expected ")" to close range');
    this.advance();
    return { kind: 'range', from, to };
  }

  // --- time value expressions ---

  private pTimeVal(): ASTNode {
    const t = this.peek();
    if (!t) throw new GDLError('Expected a time value');
    if (t.value === '[') return this.pTimeList();
    if (t.value === '(') return this.pTimeRange();
    return this.pTimeSingle();
  }

  private pTimeSingle(): ASTNode {
    const t = this.peek();
    if (!t) throw new GDLError('Expected a time value');
    if (t.type === 'time' || t.type === 'date') {
      this.advance();
      const v = parseTime(t.value);
      return { kind: 'time', hour: v.hour, minute: v.minute };
    }
    throw new GDLError(
      `Expected time (e.g. 18, 14:30, 6pm) but got "${t.value}"`
    );
  }

  private pTimeListItem(): ASTNode {
    let node = this.pTimeSingle();
    if (this.isType('note')) {
      const t = this.advance();
      node = { kind: 'note', item: node, text: t.value.slice(1, -1) };
    }
    return node;
  }

  private pTimeList(): ASTNode {
    this.advance(); // [
    const items: ASTNode[] = [this.pTimeListItem()];
    while (this.isVal(',')) {
      this.advance();
      items.push(this.pTimeListItem());
    }
    if (!this.isVal(']')) throw new GDLError('Expected "]" to close time list');
    this.advance();
    if (items.length === 0) throw new GDLError('Empty time list is not valid');
    return items.length === 1 ? items[0] : { kind: 'list', items };
  }

  private pTimeRange(): ASTNode {
    this.advance(); // (
    const from = this.pTimeSingle();
    if (!this.isVal(','))
      throw new GDLError('Time range needs exactly 2 items: (start, end)');
    this.advance();
    const to = this.pTimeSingle();
    if (this.isVal(','))
      throw new GDLError('Time range needs exactly 2 items, got more than 2');
    if (!this.isVal(')'))
      throw new GDLError('Expected ")" to close time range');
    this.advance();
    return { kind: 'range', from, to };
  }

  // --- duration value expressions ---

  private pDurVal(): ASTNode {
    const t = this.peek();
    if (!t) throw new GDLError('Expected a duration value');
    if (t.value === '[') return this.pDurList();
    return this.pDurSingle();
  }

  private pDurSingle(): ASTNode {
    const t = this.peek();
    if (!t) throw new GDLError('Expected a duration (e.g. 2h, 30m)');
    if (t.type === 'time' || t.type === 'date') {
      this.advance();
      const d = parseDuration(t.value);
      return { kind: 'duration', minutes: d.minutes };
    }
    throw new GDLError(`Expected duration (e.g. 2h, 30m) but got "${t.value}"`);
  }

  private pDurList(): ASTNode {
    this.advance(); // [
    const items: ASTNode[] = [this.pDurSingle()];
    while (this.isVal(',')) {
      this.advance();
      items.push(this.pDurSingle());
    }
    if (!this.isVal(']'))
      throw new GDLError('Expected "]" to close duration list');
    this.advance();
    if (items.length === 0)
      throw new GDLError('Empty duration list is not valid');
    return items.length === 1 ? items[0] : { kind: 'list', items };
  }
}

// =============================================================================
// Intermediate evaluation types
// =============================================================================

interface DayResult {
  date: Date;
  note?: string;
}

interface TimeResult {
  hour: number;
  minute: number;
  note?: string;
}

interface DurResult {
  minutes: number;
}

// =============================================================================
// Stage 3 — Evaluator
// =============================================================================

class Evaluator {
  private ref: Date;

  constructor(ref: Date) {
    this.ref = ref;
  }

  run(node: ASTNode): DateTimeOption[] {
    const opts = this.toOptions(node);
    if (opts.length > MAX_OPTIONS) {
      throw new GDLError(
        `Expression produces ${opts.length} options, exceeding the maximum of ${MAX_OPTIONS}`
      );
    }
    return this.dedup(opts);
  }

  // ---------- main evaluation ----------

  private toOptions(node: ASTNode): DateTimeOption[] {
    switch (node.kind) {
      case 'day':
        return [{ start: this.midnight(this.nextDow(node.idx)) }];

      case 'date':
        return [{ start: this.midnight(this.nextDate(node.month, node.day)) }];

      case 'time':
        throw new GDLError('A time value needs a day (e.g. Fr@18)');

      case 'duration':
        throw new GDLError('A duration needs day@time (e.g. Fr@18^2h)');

      case 'list': {
        const out: DateTimeOption[] = [];
        for (const it of node.items) out.push(...this.toOptions(it));
        return out;
      }

      case 'range':
        return this.dayRangeToOptions(node);

      case 'timeAttach': {
        const days = this.toDays(node.days);
        const times = this.toTimes(node.times);
        this.checkCount(days.length * times.length);
        const out: DateTimeOption[] = [];
        for (const d of days)
          for (const t of times)
            out.push({
              start: this.setHM(d.date, t.hour, t.minute),
              note: d.note ?? t.note,
            });
        return out;
      }

      case 'span': {
        if (node.base.kind !== 'timeAttach') {
          throw new GDLError('Span (-) requires day@startTime-endTime format');
        }
        const days = this.toDays(node.base.days);
        const starts = this.toTimes(node.base.times);
        const ends = this.toTimes(node.end);
        this.checkCount(days.length * starts.length * ends.length);
        const out: DateTimeOption[] = [];
        for (const d of days) {
          for (const st of starts) {
            for (const et of ends) {
              if (st.hour === et.hour && st.minute === et.minute) {
                throw new GDLError(
                  `Span start and end are identical (${st.hour}:${String(st.minute).padStart(2, '0')})`
                );
              }
              const start = this.setHM(d.date, st.hour, st.minute);
              let end = this.setHM(d.date, et.hour, et.minute);
              if (end.getTime() <= start.getTime()) {
                end = new Date(end.getTime() + 86_400_000);
              }
              out.push({ start, end, note: d.note ?? st.note });
            }
          }
        }
        return out;
      }

      case 'durAttach': {
        if (node.base.kind !== 'timeAttach') {
          throw new GDLError('Duration (^) requires day@time^duration format');
        }
        const days = this.toDays(node.base.days);
        const times = this.toTimes(node.base.times);
        const durs = this.toDurs(node.dur);
        this.checkCount(days.length * times.length * durs.length);
        const out: DateTimeOption[] = [];
        for (const d of days)
          for (const t of times)
            for (const dur of durs) {
              const start = this.setHM(d.date, t.hour, t.minute);
              const end = new Date(start.getTime() + dur.minutes * 60_000);
              out.push({ start, end, note: d.note ?? t.note });
            }
        return out;
      }

      case 'recur':
        return this.recurToOptions(node);

      case 'note': {
        const opts = this.toOptions(node.item);
        return opts.map(o => ({ ...o, note: o.note ?? node.text }));
      }

      case 'union': {
        const out: DateTimeOption[] = [];
        for (const it of node.items) out.push(...this.toOptions(it));
        return out;
      }
    }
  }

  // ---------- recurrence at top level ----------

  private recurToOptions(node: RecurNode): DateTimeOption[] {
    if (node.item.kind === 'list') {
      const out: DateTimeOption[] = [];
      for (const child of node.item.items) {
        const wrapped: ASTNode =
          child.kind === 'recur'
            ? child
            : { kind: 'recur', item: child, count: node.count };
        out.push(...this.toOptions(wrapped));
      }
      return out;
    }

    if (node.item.kind === 'range') {
      return this.recurRangeToOptions(node.item, node.count);
    }

    const days = this.recurDays(node.item, node.count);
    return days.map(d => ({ start: this.midnight(d.date), note: d.note }));
  }

  // ---------- day evaluation ----------

  private toDays(node: ASTNode): DayResult[] {
    switch (node.kind) {
      case 'day':
        return [{ date: this.nextDow(node.idx) }];

      case 'date':
        return [{ date: this.nextDate(node.month, node.day) }];

      case 'list': {
        const out: DayResult[] = [];
        for (const it of node.items) out.push(...this.toDays(it));
        return out;
      }

      case 'range':
        return this.dayRange(node);

      case 'recur':
        return this.recurToDays(node);

      case 'note': {
        const r = this.toDays(node.item);
        return r.map(d => ({ date: d.date, note: d.note ?? node.text }));
      }

      default:
        throw new GDLError(`Cannot use ${node.kind} as a day value`);
    }
  }

  private recurToDays(node: RecurNode): DayResult[] {
    if (node.item.kind === 'list') {
      const out: DayResult[] = [];
      for (const child of node.item.items) {
        const wrapped: ASTNode =
          child.kind === 'recur'
            ? child
            : { kind: 'recur', item: child, count: node.count };
        out.push(...this.toDays(wrapped));
      }
      return out;
    }

    if (node.item.kind === 'range') {
      return this.recurRange(node.item, node.count);
    }

    return this.recurDays(node.item, node.count);
  }

  private recurDays(node: ASTNode, count: number): DayResult[] {
    if (node.kind === 'date' && node.month !== null) {
      throw new GDLError(
        'Recurrence (*) cannot be used with a specific date (MM/DD)'
      );
    }

    if (node.kind === 'day') {
      const js = gdlToJs(node.idx);
      const cur = new Date(this.ref);
      cur.setHours(0, 0, 0, 0);
      while (cur.getDay() !== js) cur.setDate(cur.getDate() + 1);
      const out: DayResult[] = [];
      for (let i = 0; i < count; i++) {
        out.push({ date: new Date(cur) });
        cur.setDate(cur.getDate() + 7);
      }
      return out;
    }

    if (node.kind === 'date' && node.month === null) {
      const target = node.day;
      const out: DayResult[] = [];
      const cur = new Date(this.ref);
      cur.setHours(0, 0, 0, 0);
      const refStart = cur.getTime();
      for (let attempts = 0; out.length < count && attempts < 60; attempts++) {
        const y = cur.getFullYear();
        const m = cur.getMonth() + 1;
        if (target <= maxDay(m, y)) {
          const candidate = new Date(y, m - 1, target);
          if (candidate.getTime() >= refStart) {
            out.push({ date: candidate });
          }
        }
        cur.setMonth(cur.getMonth() + 1, 1);
      }
      if (out.length < count) {
        throw new GDLError(
          `Cannot find ${count} future occurrences of day-of-month ${target}`
        );
      }
      return out;
    }

    if (node.kind === 'note') {
      const r = this.recurDays(node.item, count);
      return r.map(d => ({ ...d, note: d.note ?? node.text }));
    }

    throw new GDLError(
      `Recurrence (*) can only be applied to day abbreviations or day-of-month values`
    );
  }

  // recurrence on range: expand range, then recur each element
  private recurRange(range: RangeNode, count: number): DayResult[] {
    if (range.from.kind === 'day' && range.to.kind === 'day') {
      const indices = this.expandDowRange(range.from.idx, range.to.idx);
      const out: DayResult[] = [];
      for (const idx of indices) {
        out.push(...this.recurDays({ kind: 'day', idx }, count));
      }
      return out;
    }
    throw new GDLError('Recurrence (*) on date ranges is not supported');
  }

  private recurRangeToOptions(
    range: RangeNode,
    count: number
  ): DateTimeOption[] {
    const days = this.recurRange(range, count);
    return days.map(d => ({ start: this.midnight(d.date), note: d.note }));
  }

  // ---------- day range ----------

  private expandDowRange(from: number, to: number): number[] {
    const out: number[] = [from];
    let cur = from;
    while (cur !== to) {
      cur = (cur + 1) % 7;
      out.push(cur);
    }
    return out;
  }

  private dayRange(node: RangeNode): DayResult[] {
    const { from, to } = node;

    if (from.kind === 'day' && to.kind === 'day') {
      const indices = this.expandDowRange(from.idx, to.idx);
      const results = indices.map(idx => ({
        date: this.nextDow(idx),
      }));
      // Ensure all dates in a wrapping range are ≥ the first date
      // e.g., (Fr,Tu) from Monday: Fr=Aug 8, then Sa/Su/Mo/Tu must all be ≥ Aug 8
      if (results.length > 1) {
        const firstTime = results[0].date.getTime();
        for (let i = 1; i < results.length; i++) {
          if (results[i].date.getTime() < firstTime) {
            results[i].date.setDate(results[i].date.getDate() + 7);
          }
        }
      }
      return results;
    }

    if (from.kind === 'date' && to.kind === 'date') {
      if (from.month !== null || to.month !== null) {
        return this.fullDateRange(from, to);
      }
      // bare day-of-month range
      if (from.day >= to.day) {
        throw new GDLError(
          `Day-of-month range (${from.day},${to.day}): start must be less than end`
        );
      }
      const out: DayResult[] = [];
      for (let d = from.day; d <= to.day; d++) {
        out.push({ date: this.nextDate(null, d) });
      }
      return out;
    }

    throw new GDLError(
      'Range endpoints must be the same type (both day abbreviations or both dates)'
    );
  }

  private fullDateRange(from: DateNode, to: DateNode): DayResult[] {
    if (from.month === null || to.month === null) {
      throw new GDLError('Cannot mix bare day-of-month and MM/DD in a range');
    }
    const startDate = this.nextDate(from.month, from.day);
    let endDate = this.nextDate(to.month, to.day);
    if (endDate.getTime() < startDate.getTime()) {
      endDate = new Date(endDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    const out: DayResult[] = [];
    const cur = new Date(startDate);
    while (cur.getTime() <= endDate.getTime()) {
      out.push({ date: new Date(cur) });
      cur.setDate(cur.getDate() + 1);
      if (out.length > MAX_OPTIONS) {
        throw new GDLError(`Date range produces more than ${MAX_OPTIONS} days`);
      }
    }
    return out;
  }

  private dayRangeToOptions(node: RangeNode): DateTimeOption[] {
    return this.dayRange(node).map(d => ({
      start: this.midnight(d.date),
      note: d.note,
    }));
  }

  // ---------- time evaluation ----------

  private toTimes(node: ASTNode): TimeResult[] {
    switch (node.kind) {
      case 'time':
        return [{ hour: node.hour, minute: node.minute }];
      case 'list': {
        const out: TimeResult[] = [];
        for (const it of node.items) out.push(...this.toTimes(it));
        return out;
      }
      case 'range':
        return this.timeRange(node);
      case 'note': {
        const times = this.toTimes(node.item);
        return times.map(t => ({ ...t, note: node.text }));
      }
      default:
        throw new GDLError(`Cannot use ${node.kind} as a time value`);
    }
  }

  private timeRange(node: RangeNode): TimeResult[] {
    if (node.from.kind !== 'time' || node.to.kind !== 'time') {
      throw new GDLError('Time range endpoints must be time values');
    }
    const fh = node.from.hour;
    const fm = node.from.minute;
    const th = node.to.hour;
    const tm = node.to.minute;

    if (fm !== tm) {
      throw new GDLError(
        'Time range endpoints must have matching minutes for hourly step expansion'
      );
    }
    if (fh === th) {
      return [{ hour: fh, minute: fm }];
    }
    const out: TimeResult[] = [];
    let h = fh;
    for (let i = 0; i <= 24; i++) {
      out.push({ hour: h, minute: i === 0 ? fm : fm });
      if (h === th) break;
      h = (h + 1) % 24;
    }
    return out;
  }

  // ---------- duration evaluation ----------

  private toDurs(node: ASTNode): DurResult[] {
    switch (node.kind) {
      case 'duration':
        return [{ minutes: node.minutes }];
      case 'list': {
        const out: DurResult[] = [];
        for (const it of node.items) out.push(...this.toDurs(it));
        return out;
      }
      default:
        throw new GDLError(`Cannot use ${node.kind} as a duration`);
    }
  }

  // ---------- date resolution ----------

  private nextDow(gdlIdx: number): Date {
    const js = gdlToJs(gdlIdx);
    const d = new Date(this.ref);
    d.setHours(0, 0, 0, 0);
    if (d.getDay() === js) return d;
    let add = js - d.getDay();
    if (add <= 0) add += 7;
    d.setDate(d.getDate() + add);
    return d;
  }

  private nextDate(month: number | null, day: number): Date {
    const r = new Date(this.ref);
    r.setHours(0, 0, 0, 0);

    if (month !== null) {
      if (month === 2 && day === 29) return this.nextLeapFeb29(r);
      let year = r.getFullYear();
      let candidate = new Date(year, month - 1, day);
      if (candidate.getMonth() !== month - 1 || candidate.getDate() !== day) {
        throw new GDLError(`Invalid date: ${month}/${day}`);
      }
      if (candidate.getTime() >= r.getTime()) return candidate;
      year++;
      candidate = new Date(year, month - 1, day);
      return candidate;
    }

    // bare day-of-month
    const today = r.getDate();
    let year = r.getFullYear();
    let m = r.getMonth() + 1;
    if (day <= maxDay(m, year) && day >= today) {
      return new Date(year, m - 1, day);
    }
    for (let i = 1; i <= 12; i++) {
      m++;
      if (m > 12) {
        m = 1;
        year++;
      }
      if (day <= maxDay(m, year)) {
        return new Date(year, m - 1, day);
      }
    }
    throw new GDLError(`Cannot find a valid date for day-of-month ${day}`);
  }

  private nextLeapFeb29(r: Date): Date {
    let y = r.getFullYear();
    if (isLeapYear(y)) {
      const c = new Date(y, 1, 29);
      if (c.getTime() >= r.getTime()) return c;
    }
    y++;
    while (!isLeapYear(y)) y++;
    return new Date(y, 1, 29);
  }

  // ---------- date helpers ----------

  private setHM(d: Date, h: number, m: number): Date {
    const out = new Date(d);
    out.setHours(h, m, 0, 0);
    return out;
  }

  private midnight(d: Date): Date {
    const out = new Date(d);
    out.setHours(0, 0, 0, 0);
    return out;
  }

  private checkCount(n: number): void {
    if (n > MAX_OPTIONS) {
      throw new GDLError(
        `Expression would produce ${n} options, exceeding the maximum of ${MAX_OPTIONS}`
      );
    }
  }

  // ---------- dedup ----------

  private dedup(opts: DateTimeOption[]): DateTimeOption[] {
    const map = new Map<string, DateTimeOption>();
    for (const o of opts) {
      const key = `${o.start.getTime()}_${o.end?.getTime() ?? ''}`;
      const existing = map.get(key);
      if (existing) {
        if (o.note && existing.note !== o.note) {
          existing.note = existing.note
            ? `${existing.note}, ${o.note}`
            : o.note;
        }
      } else {
        map.set(key, { ...o });
      }
    }
    return Array.from(map.values());
  }
}

// =============================================================================
// Public API
// =============================================================================

export function isGDL(input: string): boolean {
  return /[@^*]/.test(input);
}

export function parseGDL(input: string, referenceDate?: Date): GDLResult {
  try {
    const trimmed = input.trim();
    if (!trimmed) return { success: false, error: 'Empty input' };

    const tokens = tokenizeGDL(trimmed);

    // surface tokenizer-level errors
    const errTok = tokens.find(t => t.type === 'error');
    if (errTok) {
      if (errTok.value.startsWith('"')) {
        return {
          success: false,
          error:
            'Unclosed quote. Notes must be wrapped in double quotes: "text"',
        };
      }
      return {
        success: false,
        error: `Unexpected "${errTok.value}" at position ${errTok.start}`,
      };
    }

    const ast = new Parser(tokens).parse();
    const ref = referenceDate ?? new Date();
    const results = new Evaluator(ref).run(ast);

    return { success: true, results };
  } catch (e) {
    if (e instanceof GDLError) return { success: false, error: e.message };
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Parser error: ${msg}` };
  }
}
