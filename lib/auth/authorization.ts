import { UserType } from "@prisma/client";

export type AuthErrorKey =
  | "action_error_71"
  | "action_error_72"
  | "action_error_73"
  | "auth_unauthorized_student_access"
  | "auth_unauthorized_booking_view"
  | "auth_unauthorized_other_teacher_booking"
  | "auth_unauthorized_review"
  | "auth_unauthorized"
  | "auth_chat_closed_admin"
  | "auth_chat_waiting_parent"
  | "auth_chat_waiting_teacher"
  | "auth_unauthorized_other_teacher_payout"
  | "auth_unauthorized_payout_view";

export type AuthResult = { authorized: true } | { authorized: false; error: AuthErrorKey };

// --- STUDENT GUARDS ---

export function authorizeStudentAccess(
  student: { parentUserId: string; bookings?: unknown[] },
  userId: string,
  userType: UserType
): AuthResult {
  if (userType === "ADMIN") return { authorized: true };
  
  if (userType === "PARENT") {
    if (student.parentUserId !== userId) {
      return { authorized: false, error: "action_error_71" };
    }
    return { authorized: true };
  }
  
  if (userType === "TEACHER") {
    if (!student.bookings || student.bookings.length === 0) {
      return { authorized: false, error: "auth_unauthorized_student_access" };
    }
    return { authorized: true };
  }
  
  return { authorized: false, error: "action_error_72" };
}

export function authorizeTeacherProfileAccess(
  teacher: { userId: string },
  userId: string,
  userType: UserType
): AuthResult {
  if (userType === "ADMIN") return { authorized: true };
  if (teacher.userId === userId) return { authorized: true };
  return { authorized: false, error: "action_error_73" };
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
      return { authorized: false, error: "auth_unauthorized_booking_view" };
    }
    return { authorized: true };
  }
  
  if (userType === "TEACHER") {
    if (booking.teacherService.teacher.userId !== userId) {
      return { authorized: false, error: "auth_unauthorized_other_teacher_booking" };
    }
    return { authorized: true };
  }
  
  return { authorized: false, error: "auth_unauthorized_booking_view" };
}

export function authorizeBookingReview(
  booking: { parentUserId: string },
  userId: string,
  userType: UserType
): AuthResult {
  if (userType === "ADMIN") return { authorized: true };
  
  if (booking.parentUserId !== userId) {
    return { authorized: false, error: "auth_unauthorized_review" };
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
      return { authorized: false, error: "auth_unauthorized" };
    }
    return { authorized: true };
  }
  
  if (userType === "TEACHER") {
    if (dispute.booking?.teacherService?.teacher?.userId !== userId) {
      return { authorized: false, error: "auth_unauthorized" };
    }
    return { authorized: true };
  }
  
  return { authorized: false, error: "auth_unauthorized" };
}

export function authorizeDisputeTurn(
  dispute: { allowedTurn: string },
  userType: UserType
): AuthResult {
  if (userType === "ADMIN") return { authorized: true };
  
  if (dispute.allowedTurn === "NONE") {
    return { authorized: false, error: "auth_chat_closed_admin" };
  }
  
  if (dispute.allowedTurn === "PARENT" && userType !== "PARENT") {
    return { authorized: false, error: "auth_chat_waiting_parent" };
  }
  
  if (dispute.allowedTurn === "TEACHER" && userType !== "TEACHER") {
    return { authorized: false, error: "auth_chat_waiting_teacher" };
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
      return { authorized: false, error: "auth_unauthorized_other_teacher_payout" };
    }
    return { authorized: true };
  }
  
  return { authorized: false, error: "auth_unauthorized_payout_view" };
}
