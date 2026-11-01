/** Keep persisted sub-minute precision when a displayed date was not edited. */
export function localDateValue(timestamp: number | undefined) {
  if (timestamp === undefined) return '';
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
export function dateTimestamp(raw: string, original?: number) {
  if (!raw) return undefined;
  return original !== undefined && raw === localDateValue(original)
    ? original
    : new Date(raw).getTime();
}
