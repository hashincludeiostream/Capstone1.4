/**
 * Utility functions for 12-hour AM/PM and 24-hour appointment time formatting,
 * parsing, slot generation, and date-time arithmetic.
 */

/**
 * Parses any time string (e.g. '14:00', '14:00:00', '2:00 PM', '02:00 PM', '9:30 AM')
 * into total minutes from midnight (0 - 1439).
 */
export function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const cleaned = timeStr.trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?$/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3] ? match[3].toUpperCase() : null;

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return Math.min(1439, Math.max(0, hours * 60 + minutes));
}

/**
 * Formats total minutes from midnight into 12-hour AM/PM string.
 * Example: 840 -> '02:00 PM' (padZero=true) or '2:00 PM' (padZero=false).
 */
export function formatMinutesTo12Hour(totalMinutes: number, padZero: boolean = true): string {
  const normalizedMins = Math.min(1439, Math.max(0, totalMinutes));
  const rawHours = Math.floor(normalizedMins / 60);
  const minutes = normalizedMins % 60;
  const period = rawHours >= 12 ? 'PM' : 'AM';
  const displayHour = rawHours % 12 === 0 ? 12 : rawHours % 12;
  const hourStr = padZero ? String(displayHour).padStart(2, '0') : String(displayHour);
  const minStr = String(minutes).padStart(2, '0');
  return `${hourStr}:${minStr} ${period}`;
}

/**
 * Formats any time string into clean 12-hour AM/PM format (e.g. '02:00 PM').
 * If already in 12-hour format, normalizes spacing and casing (e.g. '2:00pm' -> '02:00 PM').
 */
export function formatTimeTo12Hour(timeStr?: string | null, padZero: boolean = true): string {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const cleaned = timeStr.trim();
  if (!cleaned) return '';

  const minutes = parseTimeToMinutes(cleaned);
  return formatMinutesTo12Hour(minutes, padZero);
}

/**
 * Formats total minutes into 24-hour HH:MM format (e.g. 840 -> '14:00').
 */
export function formatMinutesTo24Hour(totalMinutes: number): string {
  const normalizedMins = Math.min(1439, Math.max(0, totalMinutes));
  const hours = Math.floor(normalizedMins / 60);
  const minutes = normalizedMins % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Normalizes any time representation to standard 12-hour AM/PM slot format (e.g. '02:00 PM').
 * Useful for matching booked slots against available slots regardless of legacy data storage.
 */
export function normalizeTimeSlot(timeStr?: string | null): string {
  return formatTimeTo12Hour(timeStr, true);
}

/**
 * Parses appointment date ('YYYY-MM-DD') and time (12-hour or 24-hour)
 * into a safe, valid JavaScript Date object without NaN risks.
 */
export function parseAppointmentDateTime(dateStr?: string | null, timeStr?: string | null): Date {
  if (!dateStr) return new Date(NaN);
  try {
    const parts = dateStr.trim().split('-');
    if (parts.length < 3) return new Date(dateStr);
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    const totalMins = parseTimeToMinutes(timeStr || '10:00');
    const hours = Math.floor(totalMins / 60);
    const minutes = totalMins % 60;

    return new Date(year, month - 1, day, hours, minutes, 0);
  } catch {
    return new Date(dateStr);
  }
}

/**
 * Safely computes numeric timestamp (ms) for appointment sorting.
 */
export function getAppointmentSortTimestamp(
  dateStr?: string | null,
  timeStr?: string | null,
  fallbackDateStr?: string | null
): number {
  if (fallbackDateStr) {
    const fallback = new Date(fallbackDateStr).getTime();
    if (!isNaN(fallback) && fallback > 0) return fallback;
  }
  if (!dateStr) return 0;
  const d = parseAppointmentDateTime(dateStr, timeStr);
  const ts = d.getTime();
  return isNaN(ts) ? 0 : ts;
}

/**
 * Generates an array of available slots in 12-hour AM/PM format (e.g. ['09:00 AM', '10:00 AM', ...])
 * based on salon opening and closing times.
 */
export function generate12HourSlots(
  openingTimeStr: string,
  closingTimeStr: string,
  intervalMinutes: number = 60
): string[] {
  const openingMins = parseTimeToMinutes(openingTimeStr);
  const closingMins = parseTimeToMinutes(closingTimeStr);
  if (closingMins <= openingMins) return [];

  const slotsCount = Math.floor((closingMins - openingMins) / intervalMinutes);
  const slots: string[] = [];

  for (let i = 0; i < slotsCount; i++) {
    const currentMins = openingMins + i * intervalMinutes;
    slots.push(formatMinutesTo12Hour(currentMins, true));
  }

  return slots;
}
