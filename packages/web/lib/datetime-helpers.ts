/**
 * Shared date/time helper functions for event date/time selection components.
 * These utilities are used by both create and edit flows to ensure consistency.
 */

/**
 * Regular expression for validating 24-hour time format (HH:MM)
 */
export const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Parse a time string (HH:MM) into hours and minutes
 * @param time - Time string in HH:MM format
 * @returns Tuple of [hours, minutes]
 */
export function parseTimeString(time: string): [number, number] {
  const [hours, minutes] = time.split(':').map(Number);
  return [hours, minutes];
}

/**
 * Add one hour to a time string, wrapping at midnight
 * @param time - Time string in HH:MM format
 * @returns New time string with one hour added
 */
export function addOneHour(time: string): string {
  const [hours, minutes] = parseTimeString(time);
  const newHours = (hours + 1) % 24;
  return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Format a Date object to a time input value (HH:MM)
 * @param date - Date object to format
 * @returns Time string in HH:MM format
 */
export function formatTimeForInput(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Get the start of day (midnight) for a given date
 * @param date - Date to get start of day for
 * @returns New Date object at 00:00:00.000
 */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Get the current timezone string in format "America/New_York (UTC-5)"
 * @returns Formatted timezone string
 */
export function getTimezoneString(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offsetMinutes = new Date().getTimezoneOffset();
  const sign = offsetMinutes > 0 ? '-' : '+';
  const hours = Math.abs(offsetMinutes / 60);
  return `${tz} (UTC${sign}${hours})`;
}

/**
 * Get the current time formatted for an input[type="time"]
 * @returns Current time in HH:MM format
 */
export function getCurrentTimeString(): string {
  return new Date().toLocaleTimeString([], {
    timeStyle: 'short',
    hour12: false,
  });
}

/**
 * Generate a unique ID for date time options
 * @returns Random string ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Combine a date and time string into a Date object
 * @param date - Date object for the date portion
 * @param time - Time string in HH:MM format
 * @returns New Date object with combined date and time
 */
export function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = parseTimeString(time);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Validate that an end datetime is after start datetime
 * @param startDate - Start date
 * @param startTime - Start time string
 * @param endDate - End date
 * @param endTime - End time string
 * @returns True if end is after start
 */
export function isEndAfterStart(
  startDate: Date,
  startTime: string,
  endDate: Date,
  endTime: string
): boolean {
  const start = combineDateAndTime(startDate, startTime);
  const end = combineDateAndTime(endDate, endTime);
  return end.getTime() > start.getTime();
}

/**
 * Interface for date time options with optional end times
 */
export interface DateTimeOption {
  id: string;
  start: Date;
  end?: Date;
}

/**
 * Sort date time options chronologically by start time
 * @param options - Array of DateTimeOption
 * @returns New sorted array
 */
export function sortDateTimeOptions(
  options: DateTimeOption[]
): DateTimeOption[] {
  return [...options].sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Merge new date time options with existing ones, avoiding duplicates
 * @param existing - Existing options
 * @param newOptions - New options to add
 * @returns Merged and sorted array
 */
export function mergeDateTimeOptions(
  existing: DateTimeOption[],
  newOptions: DateTimeOption[]
): DateTimeOption[] {
  const merged = [...existing];

  for (const newOpt of newOptions) {
    const isDuplicate = merged.some(
      opt =>
        opt.start.getTime() === newOpt.start.getTime() &&
        opt.end?.getTime() === newOpt.end?.getTime()
    );
    if (!isDuplicate) {
      merged.push(newOpt);
    }
  }

  return sortDateTimeOptions(merged);
}
