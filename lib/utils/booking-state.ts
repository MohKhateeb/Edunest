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
