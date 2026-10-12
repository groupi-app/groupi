// Compatibility entry point for device-local callers.
import { parseGDL as parseWithContext } from '../gdl';
export { isGDL, tokenizeGDL } from '../gdl';
export type { Token, TokenType, DateTimeOption, GDLResult } from '../gdl';
export function parseGDL(input: string, referenceDate?: Date) {
  return parseWithContext(input, {
    referenceDate: referenceDate ?? new Date(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}
