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

export interface GDLContext {
  referenceDate: Date;
  timeZone: string;
}
