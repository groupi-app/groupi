import type {
  Token,
  TokenType,
  DateTimeOption,
  GDLResult,
  GDLContext,
} from './types';
import { tokenizeGDL } from './tokenizer';
import { CivilTimeZone } from './timezone';
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
  step?: ASTNode;
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
    if (!Number.isSafeInteger(n) || n <= 0) {
      throw new GDLError(`Invalid duration: "${raw}"`);
    }
    if (!Number.isSafeInteger(n * 60))
      throw new GDLError(`Invalid duration: "${raw}"`);
    return { minutes: n * 60 };
  }
  if (s.endsWith('m')) {
    const n = Number(s.slice(0, -1));
    if (!Number.isSafeInteger(n) || n <= 0) {
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

  // '(' dayAtom ',' dayAtom [',' step] ')'
  private pDayRange(): ASTNode {
    this.advance(); // (
    const from = this.pDayAtom();
    if (!this.isVal(','))
      throw new GDLError(
        'Range needs 2 or 3 items: (start, end) or (start, end, step)'
      );
    this.advance();
    const to = this.pDayAtom();
    let step: ASTNode | undefined;
    if (this.isVal(',')) {
      this.advance();
      step = this.pDayAtom();
      if (this.isVal(','))
        throw new GDLError(
          'Range has too many items (max 3: start, end, step)'
        );
    }
    if (!this.isVal(')')) throw new GDLError('Expected ")" to close range');
    this.advance();
    return { kind: 'range', from, to, step };
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
      throw new GDLError(
        'Time range needs 2 or 3 items: (start, end) or (start, end, step)'
      );
    this.advance();
    const to = this.pTimeSingle();
    let step: ASTNode | undefined;
    if (this.isVal(',')) {
      this.advance();
      step = this.pTimeSingle();
      if (this.isVal(','))
        throw new GDLError(
          'Time range has too many items (max 3: start, end, step)'
        );
    }
    if (!this.isVal(')'))
      throw new GDLError('Expected ")" to close time range');
    this.advance();
    return { kind: 'range', from, to, step };
  }

  // --- duration value expressions ---

  private pDurVal(): ASTNode {
    const t = this.peek();
    if (!t) throw new GDLError('Expected a duration value');
    if (t.value === '[') return this.pDurList();
    if (t.value === '(') return this.pDurRange();
    return this.pDurSingle();
  }

  private pDurRange(): ASTNode {
    this.advance(); // (
    const from = this.pDurSingle();
    if (!this.isVal(','))
      throw new GDLError(
        'Duration range needs 2 or 3 items: (start, end) or (start, end, step)'
      );
    this.advance();
    const to = this.pDurSingle();
    let step: ASTNode | undefined;
    if (this.isVal(',')) {
      this.advance();
      step = this.pDurSingle();
      if (this.isVal(','))
        throw new GDLError(
          'Duration range has too many items (max 3: start, end, step)'
        );
    }
    if (!this.isVal(')'))
      throw new GDLError('Expected ")" to close duration range');
    this.advance();
    return { kind: 'range', from, to, step };
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

  constructor(
    ref: Date,
    private zone: CivilTimeZone
  ) {
    this.ref = zone.toCivil(ref);
  }

  run(node: ASTNode): DateTimeOption[] {
    const opts = this.toOptions(node);
    if (
      opts.some(
        option =>
          !Number.isFinite(option.start.getTime()) ||
          (option.end && !Number.isFinite(option.end.getTime()))
      )
    ) {
      throw new GDLError(
        'Expression produces a date outside the supported range'
      );
    }
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
              if (st.hour % 24 === et.hour % 24 && st.minute === et.minute) {
                throw new GDLError(
                  `Span start and end are identical (${st.hour}:${String(st.minute).padStart(2, '0')})`
                );
              }
              const start = this.setHM(d.date, st.hour, st.minute);
              const startMinutes = st.hour * 60 + st.minute;
              const endMinutes = et.hour * 60 + et.minute;
              const daysToAdd = Math.max(
                0,
                Math.floor((startMinutes - endMinutes) / 1440) + 1
              );
              const endHour = et.hour + daysToAdd * 24;
              const end = this.setHM(d.date, endHour, et.minute);
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
    this.checkCount(count);
    if (node.kind === 'date' && node.month !== null) {
      throw new GDLError(
        'Recurrence (*) cannot be used with a specific date (MM/DD)'
      );
    }

    if (node.kind === 'day') {
      const js = gdlToJs(node.idx);
      const cur = new Date(this.ref);
      cur.setUTCHours(0, 0, 0, 0);
      while (cur.getUTCDay() !== js) cur.setUTCDate(cur.getUTCDate() + 1);
      const out: DayResult[] = [];
      for (let i = 0; i < count; i++) {
        out.push({ date: new Date(cur) });
        cur.setUTCDate(cur.getUTCDate() + 7);
      }
      return out;
    }

    if (node.kind === 'date' && node.month === null) {
      const target = node.day;
      const out: DayResult[] = [];
      const cur = new Date(this.ref);
      cur.setUTCHours(0, 0, 0, 0);
      const refStart = cur.getTime();
      for (let attempts = 0; out.length < count && attempts < 60; attempts++) {
        const y = cur.getUTCFullYear();
        const m = cur.getUTCMonth() + 1;
        if (target <= maxDay(m, y)) {
          const candidate = new Date(Date.UTC(y, m - 1, target));
          if (candidate.getTime() >= refStart) {
            out.push({ date: candidate });
          }
        }
        cur.setUTCMonth(cur.getUTCMonth() + 1, 1);
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
      const dayStep = range.step ? this.resolveStep(range.step, 1) : 1;
      const indices = this.expandDowRange(
        range.from.idx,
        range.to.idx,
        dayStep
      );
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

  private expandDowRange(from: number, to: number, step = 1): number[] {
    if (!Number.isInteger(step) || step < 1)
      throw new GDLError('Day range step must be positive');
    const out: number[] = [];
    const distance = (to - from + 7) % 7;
    for (let offset = 0; offset <= distance; offset += step)
      out.push((from + offset) % 7);
    return out;
  }

  private resolveStep(step: ASTNode | undefined, defaultStep: number): number {
    const value = !step
      ? defaultStep
      : step.kind === 'date' && step.month === null
        ? step.day
        : step.kind === 'day'
          ? step.idx
          : NaN;
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new GDLError(
        'Day range step must be a positive integer number of days'
      );
    }
    return value;
  }

  private dayRange(node: RangeNode): DayResult[] {
    const { from, to } = node;

    if (from.kind === 'day' && to.kind === 'day') {
      const dayStep = node.step ? this.resolveStep(node.step, 1) : 1;
      const indices = this.expandDowRange(from.idx, to.idx, dayStep);
      const results = indices.map(idx => ({
        date: this.nextDow(idx),
      }));
      if (results.length > 1) {
        const firstTime = results[0].date.getTime();
        for (let i = 1; i < results.length; i++) {
          if (results[i].date.getTime() < firstTime) {
            results[i].date.setUTCDate(results[i].date.getUTCDate() + 7);
          }
        }
      }
      return results;
    }

    if (from.kind === 'date' && to.kind === 'date') {
      if (from.month !== null || to.month !== null) {
        return this.fullDateRange(from, to, node.step);
      }
      const dayStep = node.step ? this.resolveStep(node.step, 1) : 1;
      if (from.day >= to.day) {
        throw new GDLError(
          `Day-of-month range (${from.day},${to.day}): start must be less than end`
        );
      }
      const out: DayResult[] = [];
      for (let d = from.day; d <= to.day; d += dayStep) {
        out.push({ date: this.nextDate(null, d) });
      }
      return out;
    }

    throw new GDLError(
      'Range endpoints must be the same type (both day abbreviations or both dates)'
    );
  }

  private fullDateRange(
    from: DateNode,
    to: DateNode,
    stepNode?: ASTNode
  ): DayResult[] {
    if (from.month === null || to.month === null) {
      throw new GDLError('Cannot mix bare day-of-month and MM/DD in a range');
    }
    const dayStep = stepNode ? this.resolveStep(stepNode, 1) : 1;
    const startDate = this.nextDate(from.month, from.day);
    let endDate = this.nextDate(to.month, to.day);
    if (endDate.getTime() < startDate.getTime()) {
      endDate = new Date(endDate);
      endDate.setUTCFullYear(endDate.getUTCFullYear() + 1);
    }
    const out: DayResult[] = [];
    const cur = new Date(startDate);
    while (cur.getTime() <= endDate.getTime()) {
      out.push({ date: new Date(cur) });
      cur.setUTCDate(cur.getUTCDate() + dayStep);
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
    const fromMinutes = node.from.hour * 60 + node.from.minute;
    let toMinutes = node.to.hour * 60 + node.to.minute;
    if (toMinutes < fromMinutes) toMinutes += 1440;

    let stepMinutes = 60;
    if (node.step) {
      if (node.step.kind !== 'time')
        throw new GDLError('Time range step must be a number');
      stepMinutes = node.step.hour * 60 + node.step.minute;
      if (stepMinutes <= 0)
        throw new GDLError('Time range step must be positive');
    }

    const out: TimeResult[] = [];
    for (let m = fromMinutes; m <= toMinutes; m += stepMinutes) {
      out.push({ hour: Math.floor(m / 60), minute: m % 60 });
      if (out.length > MAX_OPTIONS)
        throw new GDLError(`Time range exceeds ${MAX_OPTIONS} options`);
    }
    if (out.length === 0)
      out.push({ hour: node.from.hour, minute: node.from.minute });
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
      case 'range':
        return this.durRange(node);
      default:
        throw new GDLError(`Cannot use ${node.kind} as a duration`);
    }
  }

  private durRange(node: RangeNode): DurResult[] {
    if (node.from.kind !== 'duration' || node.to.kind !== 'duration') {
      throw new GDLError('Duration range endpoints must be duration values');
    }
    const fromM = node.from.minutes;
    const toM = node.to.minutes;

    let stepM = 60;
    if (node.step) {
      if (node.step.kind !== 'duration')
        throw new GDLError(
          'Duration range step must be a duration (e.g. 1h, 30m)'
        );
      stepM = node.step.minutes;
      if (stepM <= 0)
        throw new GDLError('Duration range step must be positive');
    }

    const out: DurResult[] = [];
    for (let m = fromM; m <= toM; m += stepM) {
      out.push({ minutes: m });
      if (out.length > MAX_OPTIONS)
        throw new GDLError(`Duration range exceeds ${MAX_OPTIONS} options`);
    }
    if (out.length === 0) out.push({ minutes: fromM });
    return out;
  }

  // ---------- date resolution ----------

  private nextDow(gdlIdx: number): Date {
    const js = gdlToJs(gdlIdx);
    const d = new Date(this.ref);
    d.setUTCHours(0, 0, 0, 0);
    if (d.getUTCDay() === js) return d;
    let add = js - d.getUTCDay();
    if (add <= 0) add += 7;
    d.setUTCDate(d.getUTCDate() + add);
    return d;
  }

  private nextDate(month: number | null, day: number): Date {
    const r = new Date(this.ref);
    r.setUTCHours(0, 0, 0, 0);

    if (month !== null) {
      if (month === 2 && day === 29) return this.nextLeapFeb29(r);
      let year = r.getUTCFullYear();
      let candidate = new Date(Date.UTC(year, month - 1, day));
      if (
        candidate.getUTCMonth() !== month - 1 ||
        candidate.getUTCDate() !== day
      ) {
        throw new GDLError(`Invalid date: ${month}/${day}`);
      }
      if (candidate.getTime() >= r.getTime()) return candidate;
      year++;
      candidate = new Date(Date.UTC(year, month - 1, day));
      return candidate;
    }

    // bare day-of-month
    const today = r.getUTCDate();
    let year = r.getUTCFullYear();
    let m = r.getUTCMonth() + 1;
    if (day <= maxDay(m, year) && day >= today) {
      return new Date(Date.UTC(year, m - 1, day));
    }
    for (let i = 1; i <= 12; i++) {
      m++;
      if (m > 12) {
        m = 1;
        year++;
      }
      if (day <= maxDay(m, year)) {
        return new Date(Date.UTC(year, m - 1, day));
      }
    }
    throw new GDLError(`Cannot find a valid date for day-of-month ${day}`);
  }

  private nextLeapFeb29(r: Date): Date {
    let y = r.getUTCFullYear();
    if (isLeapYear(y)) {
      const c = new Date(Date.UTC(y, 1, 29));
      if (c.getTime() >= r.getTime()) return c;
    }
    y++;
    while (!isLeapYear(y)) y++;
    return new Date(Date.UTC(y, 1, 29));
  }

  // ---------- date helpers ----------

  private setHM(d: Date, h: number, m: number): Date {
    const out = new Date(d);
    out.setUTCHours(h, m, 0, 0);
    return this.zone.toInstant(out);
  }

  private midnight(d: Date): Date {
    const out = new Date(d);
    out.setUTCHours(0, 0, 0, 0);
    return this.zone.toInstant(out);
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

export function parseGDL(input: string, context: GDLContext): GDLResult {
  try {
    if (
      !context ||
      !(context.referenceDate instanceof Date) ||
      !Number.isFinite(context.referenceDate.getTime())
    )
      throw new GDLError('A valid referenceDate is required');
    if (typeof context.timeZone !== 'string' || !context.timeZone.trim())
      throw new GDLError('A valid timeZone is required');
    const zone = new CivilTimeZone(context.timeZone);
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
    const results = new Evaluator(context.referenceDate, zone).run(ast);

    return { success: true, results };
  } catch (e) {
    if (e instanceof GDLError) return { success: false, error: e.message };
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Parser error: ${msg}` };
  }
}
