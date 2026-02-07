/**
 * Generic browser-side data export utilities.
 * Addon-agnostic — any page or component can use these.
 */

/** Trigger a file download in the browser. */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Escape and quote a single CSV cell value. */
function escapeCSVValue(value: string): string {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Convert headers + row arrays to a CSV string. */
export function toCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCSVValue).join(',');
  const dataLines = rows.map(row => row.map(escapeCSVValue).join(','));
  return [headerLine, ...dataLines].join('\n');
}

/** Convert headers + row objects to a formatted JSON string. */
export function toJSON(
  _headers: string[],
  rows: Record<string, unknown>[]
): string {
  return JSON.stringify(rows, null, 2);
}
