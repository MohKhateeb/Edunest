import { BookingStatus } from '@prisma/client';
import { BOOKING_STATUS_AR } from '@/lib/translations';

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: [BookingStatus.CONFIRMED, BookingStatus.REJECTED, BookingStatus.CANCELLED],
  CONFIRMED: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

export function isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function getTransitionError(from: BookingStatus, to: BookingStatus): string {
  return `لا يمكن تغيير الحجز من "${BOOKING_STATUS_AR[from]}" إلى "${BOOKING_STATUS_AR[to]}"`;
}

export type SessionTimeState = {
  status: 'upcoming' | 'ready_to_join' | 'active' | 'grace_period' | 'expired' | 'ghost';
  minutesLeft: number;
};

/**
 * تحديد حالة الجلسة بناءً على الوقت بدقة متناهية
 */
export function getDetailedSessionState(startTime: Date | string, durationMinutes: number): SessionTimeState {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const durationMs = durationMinutes * 60_000;
  const end = start + durationMs;

  const EARLY_JOIN_MS = 5 * 60_000; // يمكن الانضمام قبل 5 دقائق
  const LATE_DEPARTURE_MS = 30 * 60_000; // رابط الجلسة يظل متاحاً لـ 30 دقيقة بعد وقت الانتهاء الرسمي لضمان عدم طردهم
  const GHOST_THRESHOLD_MS = 24 * 60 * 60_000; // بعد 24 ساعة من الانتهاء، تعتبر جلسة شبحية

  if (now < start - EARLY_JOIN_MS) {
    const minutesLeft = Math.ceil((start - EARLY_JOIN_MS - now) / 60_000);
    return { status: 'upcoming', minutesLeft };
  } else if (now >= start - EARLY_JOIN_MS && now < start) {
    return { status: 'ready_to_join', minutesLeft: 0 };
  } else if (now >= start && now <= end) {
    return { status: 'active', minutesLeft: 0 };
  } else if (now > end && now <= end + LATE_DEPARTURE_MS) {
    return { status: 'grace_period', minutesLeft: 0 };
  } else if (now > end + LATE_DEPARTURE_MS && now < end + GHOST_THRESHOLD_MS) {
    return { status: 'expired', minutesLeft: 0 };
  } else {
    return { status: 'ghost', minutesLeft: 0 };
  }
}

/**
 * التحقق مما إذا كان المعلم يحق له كتابة تقرير (الجلسة انتهت فعلاً)
 */
export function canSubmitReport(startTime: Date | string, durationMinutes: number): boolean {
  const state = getDetailedSessionState(startTime, durationMinutes);
  // 🚀 Fix Issue #3: Do not allow teachers to submit reports for 'ghost' sessions (>24h).
  if (state.status === 'ghost') return false;
  return ['grace_period', 'expired'].includes(state.status);
}
