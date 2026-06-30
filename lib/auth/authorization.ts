import { UserType } from "@prisma/client";

export type AuthResult = { authorized: true } | { authorized: false; error: string };

// --- STUDENT GUARDS ---

export function authorizeStudentAccess(
  student: { parentUserId: string; bookings?: unknown[] },
  userId: string,
  userType: UserType
): AuthResult {
  if (userType === "ADMIN") return { authorized: true };
  
  if (userType === "PARENT") {
    if (student.parentUserId !== userId) {
      return { authorized: false, error: "غير مصرح لك بمشاهدة تفاصيل هذا الطالب." };
    }
    return { authorized: true };
  }
  
  if (userType === "TEACHER") {
    if (!student.bookings || student.bookings.length === 0) {
      return { authorized: false, error: "غير مصرح لك بالاطلاع على هذا الطالب لعدم وجود حجوزات مشتركة بينكما." };
    }
    return { authorized: true };
  }
  
  return { authorized: false, error: "نوع الحساب غير مصرح له بالوصول." };
}

export function authorizeTeacherProfileAccess(
  teacher: { userId: string },
  userId: string,
  userType: UserType
): AuthResult {
  if (userType === "ADMIN") return { authorized: true };
  if (teacher.userId === userId) return { authorized: true };
  return { authorized: false, error: "غير مصرح" };
}

// --- BOOKING GUARDS ---

export function authorizeBookingAccess(
  booking: { parentUserId: string; teacherService: { teacher: { userId: string } } },
  userId: string,
  userType: UserType
): AuthResult {
  if (userType === "ADMIN") return { authorized: true };
  
  if (userType === "PARENT") {
    if (booking.parentUserId !== userId) {
      return { authorized: false, error: "غير مصرح لك بمشاهدة تفاصيل هذا الحجز." };
    }
    return { authorized: true };
  }
  
  if (userType === "TEACHER") {
    if (booking.teacherService.teacher.userId !== userId) {
      return { authorized: false, error: "غير مصرح لك بمشاهدة تفاصيل حجز خاص بمعلم آخر." };
    }
    return { authorized: true };
  }
  
  return { authorized: false, error: "غير مصرح لك بمشاهدة تفاصيل هذا الحجز." };
}

export function authorizeBookingReview(
  booking: { parentUserId: string },
  userId: string,
  userType: UserType
): AuthResult {
  if (userType === "ADMIN") return { authorized: true };
  
  if (booking.parentUserId !== userId) {
    return { authorized: false, error: "غير مصرح لك بتقييم هذا الحجز" };
  }
  
  return { authorized: true };
}

// --- DISPUTE GUARDS ---

export function authorizeDisputeAccess(
  dispute: { 
    parentUserId?: string | null; 
    booking: { 
      parentUserId?: string; 
      teacherService: { teacher: { userId: string } } 
    } 
  },
  userId: string,
  userType: UserType
): AuthResult {
  if (userType === "ADMIN") return { authorized: true };
  
  if (userType === "PARENT") {
    const parentId = dispute.parentUserId || dispute.booking?.parentUserId;
    if (parentId !== userId) {
      return { authorized: false, error: "غير مصرح." };
    }
    return { authorized: true };
  }
  
  if (userType === "TEACHER") {
    if (dispute.booking?.teacherService?.teacher?.userId !== userId) {
      return { authorized: false, error: "غير مصرح." };
    }
    return { authorized: true };
  }
  
  return { authorized: false, error: "غير مصرح." };
}

export function authorizeDisputeTurn(
  dispute: { allowedTurn: string },
  userType: UserType
): AuthResult {
  if (userType === "ADMIN") return { authorized: true };
  
  if (dispute.allowedTurn === "NONE") {
    return { authorized: false, error: "المحادثة مغلقة من قبل الإدارة حالياً." };
  }
  
  if (dispute.allowedTurn === "PARENT" && userType !== "PARENT") {
    return { authorized: false, error: "عذراً، الإدارة تنتظر رد ولي الأمر الآن. لا يمكنك الإرسال." };
  }
  
  if (dispute.allowedTurn === "TEACHER" && userType !== "TEACHER") {
    return { authorized: false, error: "عذراً، الإدارة تنتظر رد المعلم الآن. لا يمكنك الإرسال." };
  }
  
  return { authorized: true };
}

// --- PAYOUT GUARDS ---

export function authorizePayoutAccess(
  payout: { teacher: { userId: string } },
  userId: string,
  userType: UserType
): AuthResult {
  if (userType === "ADMIN") return { authorized: true };
  
  if (userType === "TEACHER") {
    if (payout.teacher.userId !== userId) {
      return { authorized: false, error: "غير مصرح لك بالاطلاع على تسوية مالية خاصة بمعلم آخر." };
    }
    return { authorized: true };
  }
  
  return { authorized: false, error: "غير مصرح لك بمشاهدة تفاصيل التسويات المالية." };
}
