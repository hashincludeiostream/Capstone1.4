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

/**
 * Formats a date/timestamp into a friendly human-readable relative timeline string.
 * Example: 'Just now', '4m ago', '2h ago', 'Today at 3:30 PM', 'Yesterday', 'Nov 2'
 */
export function formatRelativeTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return 'Recently';

  try {
    const date = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput);
    const timeMs = date.getTime();
    if (isNaN(timeMs) || timeMs <= 0) return 'Recently';

    const now = Date.now();
    const diffSec = Math.floor((now - timeMs) / 1000);

    if (diffSec < 0) {
      // Future date
      return 'Upcoming';
    }

    if (diffSec < 45) {
      return 'Just now';
    }

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return `${diffMin}m ago`;
    }

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      const hours = date.getHours();
      const mins = String(date.getMinutes()).padStart(2, '0');
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      return `Yesterday, ${displayHours}:${mins} ${period}`;
    }

    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    // Older than 7 days, format e.g. "Oct 28"
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}`;
  } catch {
    return 'Recently';
  }
}

/**
 * Formats a date/timestamp into a concise timeline timestamp with exact time.
 * Example: 'Nov 2, 2:30 PM'
 */
export function formatTimelineDate(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput);
    const timeMs = date.getTime();
    if (isNaN(timeMs) || timeMs <= 0) return '';

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours();
    const mins = String(date.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;

    return `${month} ${day}, ${displayHours}:${mins} ${period}`;
  } catch {
    return '';
  }
}

export interface TimelineMilestone {
  title: string;
  timeLabel?: string;
  status: 'completed' | 'current' | 'pending' | 'cancelled' | 'warning';
  detail?: string;
}

/**
 * Builds structured timeline milestones for an appointment notification.
 */
export function getAppointmentTimelineMilestones(appt: any): TimelineMilestone[] {
  const milestones: TimelineMilestone[] = [];

  // Milestone 1: Booking requested / placed
  milestones.push({
    title: 'Booked',
    timeLabel: appt.created_at ? formatRelativeTime(appt.created_at) : 'Initiated',
    status: 'completed',
    detail: appt.created_at ? formatTimelineDate(appt.created_at) : undefined,
  });

  // Milestone 2: Salon review / confirmation or cancellation
  if (appt.status === 'cancelled') {
    milestones.push({
      title: appt.cancelled_by === 'salon_owner' ? 'Salon Cancelled' : 'Cancelled',
      timeLabel: appt.cancelled_at || appt.updated_at ? formatRelativeTime(appt.cancelled_at || appt.updated_at) : 'Cancelled',
      status: 'cancelled',
      detail: appt.cancellation_reason || undefined,
    });
  } else if (appt.status === 'confirmed') {
    milestones.push({
      title: 'Confirmed',
      timeLabel: appt.updated_at ? formatRelativeTime(appt.updated_at) : 'Accepted',
      status: 'completed',
    });
  } else {
    milestones.push({
      title: 'Awaiting Salon',
      timeLabel: 'Pending',
      status: 'current',
    });
  }

  // Milestone 3: Scheduled service execution
  if (appt.status !== 'cancelled') {
    milestones.push({
      title: 'Scheduled Visit',
      timeLabel: `${appt.appointment_date} at ${formatTimeTo12Hour(appt.appointment_time)}`,
      status: appt.status === 'completed' ? 'completed' : 'pending',
    });
  }

  return milestones;
}

/**
 * Builds structured timeline milestones for a product reservation order.
 */
export function getOrderTimelineMilestones(order: any): TimelineMilestone[] {
  const milestones: TimelineMilestone[] = [];

  // Milestone 1: Reservation placed
  milestones.push({
    title: 'Reserved',
    timeLabel: order.created_at || order.order_date ? formatRelativeTime(order.created_at || order.order_date) : 'Placed',
    status: 'completed',
  });

  // Milestone 2: Preparation / Ready or Cancelled
  if (order.status === 'cancelled') {
    milestones.push({
      title: order.cancelled_by === 'salon_owner' ? 'Salon Cancelled' : 'Cancelled',
      timeLabel: order.cancelled_at || order.updated_at ? formatRelativeTime(order.cancelled_at || order.updated_at) : 'Cancelled',
      status: 'cancelled',
      detail: order.cancellation_reason || undefined,
    });
  } else if (order.status === 'unclaimed') {
    milestones.push({
      title: 'Expired & Unclaimed',
      timeLabel: order.unclaimed_at || order.updated_at ? formatRelativeTime(order.unclaimed_at || order.updated_at) : 'Expired',
      status: 'cancelled',
    });
  } else if (order.status === 'ready_for_pickup') {
    milestones.push({
      title: 'Ready for Pickup',
      timeLabel: order.updated_at ? formatRelativeTime(order.updated_at) : 'Prepared',
      status: 'completed',
    });
  } else {
    milestones.push({
      title: 'Preparing',
      timeLabel: 'In Progress',
      status: 'current',
    });
  }

  // Milestone 3: Store pickup
  if (order.status !== 'cancelled' && order.status !== 'unclaimed') {
    milestones.push({
      title: 'In-Store Pickup',
      timeLabel: `Pickup: ${order.pickup_date}`,
      status: order.status === 'completed' ? 'completed' : 'pending',
    });
  }

  return milestones;
}
