/** Monaco token themes require full hexadecimal colors, unlike CSS shorthand. */
export function normalizeMonacoHexColor(value: string): string | undefined {
  if (/^#[\da-f]{3,4}$/i.test(value)) {
    return `#${[...value.slice(1)].map(digit => digit + digit).join('')}`;
  }
  return /^#[\da-f]{6}([\da-f]{2})?$/i.test(value) ? value : undefined;
}
