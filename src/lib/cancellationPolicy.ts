export type CancellationTier = 'flexible' | 'late' | 'critical';

export interface CancellationTierCalculation {
  hoursRemaining: number;
  tier: CancellationTier;
  fee: number;
  strike: boolean;
  strikeCount: number;
  title: string;
  description: string;
  depositRefundPercentage: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export interface CancellationReasonOption {
  id: string;
  label: string;
  description: string;
  requiresDetails?: boolean;
}

export const APPOINTMENT_CANCELLATION_REASONS: CancellationReasonOption[] = [
  {
    id: 'schedule_conflict',
    label: 'Work or Personal Schedule Conflict',
    description: 'Sudden overtime, school commitments, or conflicting calendar appointment.',
  },
  {
    id: 'medical_emergency',
    label: 'Feeling Unwell / Medical Condition',
    description: 'Flu, contagious condition, fever, or doctor-mandated rest.',
  },
  {
    id: 'transportation',
    label: 'Traffic, Weather, or Transport Issue',
    description: 'Vehicle breakdown, heavy typhoon rains, or severe commute delays.',
  },
  {
    id: 'family_emergency',
    label: 'Family or Personal Urgent Emergency',
    description: 'Unexpected household or caretaking situation requiring immediate attention.',
  },
  {
    id: 'accidental_booking',
    label: 'Booked by Mistake (Wrong Date / Time / Service)',
    description: 'Selected the wrong salon location, specialist, or time slot.',
  },
  {
    id: 'financial_budget',
    label: 'Budget or Financial Adjustment',
    description: 'Unplanned expenses or desire to postpone discretionary beauty spending.',
  },
  {
    id: 'change_of_mind',
    label: 'Found Alternative Salon / Changed Mind',
    description: 'Opted for home care or decided not to proceed with the treatment.',
  },
  {
    id: 'other',
    label: 'Other Reason (Please explain)',
    description: 'Any other specific circumstance not covered above.',
    requiresDetails: true,
  },
];

export const ORDER_CANCELLATION_REASONS: CancellationReasonOption[] = [
  {
    id: 'change_of_mind',
    label: 'No longer need the product(s)',
    description: 'Decided not to purchase the reserved beauty/nail supplies.',
  },
  {
    id: 'cannot_pickup',
    label: 'Unable to visit store within pickup window',
    description: 'Cannot physically make the trip to the salon within 48-72 hours.',
  },
  {
    id: 'ordered_wrong_item',
    label: 'Ordered wrong shade, formula, or quantity',
    description: 'Want to replace reservation with a different nail lacquer or gel kit.',
  },
  {
    id: 'booked_salon_service',
    label: 'Opted for in-salon treatment instead',
    description: 'Will have nails done professionally at the salon rather than DIY.',
  },
  {
    id: 'financial',
    label: 'Budget or Financial Adjustment',
    description: 'Deferring non-essential beauty retail spending.',
  },
  {
    id: 'other',
    label: 'Other Reason',
    description: 'Specific situation explaining the cancellation.',
    requiresDetails: true,
  },
];

/**
 * Calculates hours remaining between now and the scheduled appointment.
 * Parses strings like "2026-09-25" and "02:30 PM" or "14:30".
 */
export function parseAppointmentDateTime(dateStr: string, timeStr: string): Date {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    let hours = 10;
    let minutes = 0;

    if (timeStr) {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const meridiem = match[3]?.toUpperCase();

        if (meridiem === 'PM' && hours < 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
      }
    }

    return new Date(year, month - 1, day, hours, minutes, 0);
  } catch {
    return new Date(dateStr);
  }
}

/**
 * Evaluates the cancellation tier, policy fee, and strike sanction
 * based on how much advance notice the customer provides.
 */
export function calculateAppointmentCancellationTier(
  appointmentDate: string,
  appointmentTime: string,
  servicePrice: number = 0
): CancellationTierCalculation {
  const apptDate = parseAppointmentDateTime(appointmentDate, appointmentTime);
  const now = new Date();
  const diffMs = apptDate.getTime() - now.getTime();
  const hoursRemaining = Math.max(0, Number((diffMs / (1000 * 60 * 60)).toFixed(1)));
  const price = Number(servicePrice) || 0;

  // Tier 1: Flexible Notice (> 24 hours)
  if (hoursRemaining >= 24) {
    return {
      hoursRemaining,
      tier: 'flexible',
      fee: 0,
      strike: false,
      strikeCount: 0,
      title: 'Flexible Notice Window (24h+ Advance)',
      description:
        'You are cancelling well in advance. The salon has ample time to open this reserved chair to other waiting clients. No cancellation fee or account sanctions apply.',
      depositRefundPercentage: 100,
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
    };
  }

  // Tier 2: Late Notice (between 4 and 24 hours)
  if (hoursRemaining >= 4 && hoursRemaining < 24) {
    const fee = Math.max(150, Math.round(price * 0.25));
    return {
      hoursRemaining,
      tier: 'late',
      fee,
      strike: true,
      strikeCount: 1,
      title: 'Late Notice Window (4h to 24h Advance)',
      description:
        'Your dedicated specialist was assigned and the station reserved. A 25% late cancellation fee (₱' +
        fee.toLocaleString() +
        ') is assessed to partially compensate the nail technician for lost working hours, and 1 strike is recorded.',
      depositRefundPercentage: 75,
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
    };
  }

  // Tier 3: Critical Lockout (< 4 hours notice or same-day no-show)
  const fee = Math.max(250, Math.round(price * 0.5));
  return {
    hoursRemaining,
    tier: 'critical',
    fee,
    strike: true,
    strikeCount: 2,
    title: 'Critical Lockout Window (< 4h Notice)',
    description:
      'The nail technician is on-site and tools are sterilized for your slot. Cancelling on such short notice leaves an empty chair that cannot be rebooked. A 50% fee (₱' +
      fee.toLocaleString() +
      ') applies, plus 2 account strikes.',
    depositRefundPercentage: 50,
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200',
  };
}

export interface AccountSanctionInfo {
  tier: 'excellent' | 'good' | 'caution' | 'restricted';
  score: number;
  strikes: number;
  title: string;
  badgeClasses: string;
  description: string;
  canPayAtSalon: boolean;
  requiresPrepayment: boolean;
  maxActiveBookings: number;
  advice: string;
}

export function getAccountReliabilityInfo(strikes: number = 0, customScore?: number): AccountSanctionInfo {
  const safeStrikes = Math.max(0, Number(strikes) || 0);
  const score = customScore !== undefined ? customScore : Math.max(30, 100 - safeStrikes * 15);

  if (safeStrikes === 0) {
    return {
      tier: 'excellent',
      score,
      strikes: 0,
      title: 'Premier Client (Good Standing)',
      badgeClasses: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      description: 'Your account is in excellent standing with zero late cancellations.',
      canPayAtSalon: true,
      requiresPrepayment: false,
      maxActiveBookings: 5,
      advice: 'Eligible for instant salon confirmations, zero deposits, and priority waitlisting.',
    };
  }

  if (safeStrikes === 1) {
    return {
      tier: 'good',
      score,
      strikes: 1,
      title: 'Active (1 Cancellation Strike)',
      badgeClasses: 'bg-blue-100 text-blue-800 border border-blue-200',
      description: '1 late cancellation recorded in recent activity. Standard salon booking privileges apply.',
      canPayAtSalon: true,
      requiresPrepayment: false,
      maxActiveBookings: 3,
      advice: 'Provide 24+ hours advance notice on future appointments to restore a 100% score.',
    };
  }

  if (safeStrikes === 2) {
    return {
      tier: 'caution',
      score,
      strikes: 2,
      title: 'Caution Level (2 Strikes)',
      badgeClasses: 'bg-amber-100 text-amber-800 border border-amber-300',
      description: 'Multiple late cancellations detected. Pay-in-Salon restricted for peak weekend slots.',
      canPayAtSalon: false,
      requiresPrepayment: true,
      maxActiveBookings: 2,
      advice: 'Advance GCash/Maya reservation deposit required to protect salon technician time.',
    };
  }

  return {
    tier: 'restricted',
    score,
    strikes: safeStrikes,
    title: 'Probationary Tier (3+ Strikes)',
    badgeClasses: 'bg-rose-100 text-rose-800 border border-rose-300',
    description: 'High cancellation rate. You may hold only 1 active booking at a time.',
    canPayAtSalon: false,
    requiresPrepayment: true,
    maxActiveBookings: 1,
    advice: 'Complete 2 booked appointments consecutively without cancelling to rehabilitate your account standing.',
  };
}
