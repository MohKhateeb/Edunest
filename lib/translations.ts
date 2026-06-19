import type {
  BookingStatus,
  PaymentStatus,
  VerificationLevel,
  UserType,
  PaymentMethod,
} from '@prisma/client';

export const BOOKING_STATUS_AR: Record<BookingStatus, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'مؤكد',
  COMPLETED: 'مكتمل',
  REJECTED: 'مرفوض',
  CANCELLED: 'ملغى',
};

export const PAYMENT_STATUS_AR: Record<PaymentStatus, string> = {
  UNPAID: 'غير مدفوع',
  PENDING_VERIFICATION: 'بانتظار التأكيد',
  PAID: 'مدفوع',
  REFUNDED: 'مُسترد',
};

export const VERIFICATION_BADGE: Record<
  VerificationLevel,
  { label: string; color: string }
> = {
  NONE: { label: 'غير موثق', color: 'gray' },
  BRONZE: { label: 'برونزي', color: 'orange' },
  SILVER: { label: 'فضي', color: 'slate' },
  GOLD: { label: 'ذهبي', color: 'yellow' },
};

export const USER_TYPE_AR: Record<UserType, string> = {
  PARENT: 'ولي أمر',
  TEACHER: 'معلم',
  ADMIN: 'مدير النظام',
};

export const PAYMENT_METHOD_AR: Record<PaymentMethod, string> = {
  CASH: 'نقداً',
  BANK_TRANSFER: 'تحويل بنكي',
  ONLINE_CARD: 'بطاقة إلكترونية',
};

export const DAYS_OF_WEEK_AR: Record<number, string> = {
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};
