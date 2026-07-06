const fs = require('fs');

const arErrors = {
  auth_unauthorized_student_access: "غير مصرح لك بالاطلاع على هذا الطالب لعدم وجود حجوزات مشتركة بينكما.",
  auth_unauthorized_booking_view: "غير مصرح لك بمشاهدة تفاصيل هذا الحجز.",
  auth_unauthorized_other_teacher_booking: "غير مصرح لك بمشاهدة تفاصيل حجز خاص بمعلم آخر.",
  auth_unauthorized_review: "غير مصرح لك بتقييم هذا الحجز",
  auth_unauthorized: "غير مصرح.",
  auth_chat_closed_admin: "المحادثة مغلقة من قبل الإدارة حالياً.",
  auth_chat_waiting_parent: "عذراً، الإدارة تنتظر رد ولي الأمر الآن. لا يمكنك الإرسال.",
  auth_chat_waiting_teacher: "عذراً، الإدارة تنتظر رد المعلم الآن. لا يمكنك الإرسال.",
  auth_unauthorized_other_teacher_payout: "غير مصرح لك بالاطلاع على تسوية مالية خاصة بمعلم آخر.",
  auth_unauthorized_payout_view: "غير مصرح لك بمشاهدة تفاصيل التسويات المالية.",
  auth_unauthorized_login_required: "يجب تسجيل الدخول",
  auth_unauthorized_account_disabled: "حسابك معطل أو غير موجود",
  auth_forbidden_action: "غير مصرح لك بهذا الإجراء",
  unexpected_error: "حدث خطأ غير متوقع",
  booking_not_found_or_unavailable: "الحجز غير موجود أو غير متاح",
  booking_unauthorized_edit: "غير مصرح لك بإجراء تعديلات على هذا الحجز",
  financial_teacher_profile_missing: "حدث خطأ، لا يوجد ملف معلم.",
  slug_generation_failed: "فشل توليد slug فريد بعد عدة محاولات"
};

const enErrors = {
  auth_unauthorized_student_access: "You are not authorized to view this student because there are no shared bookings between you.",
  auth_unauthorized_booking_view: "You are not authorized to view the details of this booking.",
  auth_unauthorized_other_teacher_booking: "You are not authorized to view the details of a booking belonging to another teacher.",
  auth_unauthorized_review: "You are not authorized to review this booking.",
  auth_unauthorized: "Unauthorized.",
  auth_chat_closed_admin: "The chat is currently closed by the administration.",
  auth_chat_waiting_parent: "Sorry, the administration is currently waiting for the parent's response. You cannot send a message.",
  auth_chat_waiting_teacher: "Sorry, the administration is currently waiting for the teacher's response. You cannot send a message.",
  auth_unauthorized_other_teacher_payout: "You are not authorized to view a financial settlement belonging to another teacher.",
  auth_unauthorized_payout_view: "You are not authorized to view financial settlement details.",
  auth_unauthorized_login_required: "You must be logged in.",
  auth_unauthorized_account_disabled: "Your account is disabled or not found.",
  auth_forbidden_action: "You are forbidden from performing this action.",
  unexpected_error: "An unexpected error occurred.",
  booking_not_found_or_unavailable: "Booking not found or unavailable.",
  booking_unauthorized_edit: "You are not authorized to edit this booking.",
  financial_teacher_profile_missing: "An error occurred, teacher profile is missing.",
  slug_generation_failed: "Failed to generate a unique slug after several attempts."
};

const arNotifications = {
  booking_auto_cancelled_title: "إلغاء حجز تلقائي",
  booking_auto_cancelled_message: "نعتذر، لقد تم إلغاء جلستك تلقائياً نظراً لانتهاء وقتها دون تأكيد المعلم.",
  booking_auto_cancelled_refund: " سيتم إرجاع المبلغ المدفوع لرصيدك في أقرب وقت.",
  booking_report_penalty_title: "إلغاء جلسة ومصادرة الأرباح 🔴",
  booking_report_penalty_message: "تم إغلاق جلستك تلقائياً نظراً لعدم تسليم التقرير لفترة تجاوزت 4 أيام.",
  booking_report_penalty_parent_title: "إلغاء جلسة لعدم التزام المعلم بالتقرير",
  booking_report_penalty_parent_message: "نعتذر، لم يقم المعلم بكتابة تقرير الجلسة. تم حفظ حقوقك المالية وتُراجع الإدارة الموضوع الآن.",
  booking_report_warning_final_title: "تحذير نهائي - تجميد أرباح ⚠️",
  booking_report_warning_final_message: "أرباح جلستك محجوزة! أمامك وقت محدود لتقديم التقرير قبل مصادرة الجلسة نهائياً.",
  booking_report_warning_title: "تحذير: تقرير متأخر ⏳",
  booking_report_warning_message: "لقد مضى 24 ساعة على انتهاء الجلسة ولم تقم بكتابة التقرير. يرجى كتابته فوراً لتجنب تجميد الأرباح.",
  dispute_new_title: "اعتراض جديد ⚠️",
  dispute_new_message: "قام ولي الأمر برفع اعتراض على جلستك الأخيرة. تم تجميد مستحقات الجلسة مؤقتاً.",
  dispute_decision_title: "قرار بشأن اعتراضك",
  dispute_decision_won_message: "تم حل الاعتراض لصالحك وجاري إرجاع المبلغ.",
  dispute_decision_lost_message: "تم رفض الاعتراض بعد المراجعة. راجع المحادثة للتفاصيل.",
  dispute_closed_title: "إغلاق النزاع المالي",
  dispute_closed_won_message: "تم الحكم بصالحك في النزاع الأخير، وسيضاف الرصيد لدفعاتك القادمة.",
  dispute_closed_lost_message: "تم قبول اعتراض ولي الأمر واسترداد مبلغ الجلسة."
};

const enNotifications = {
  booking_auto_cancelled_title: "Automatic Booking Cancellation",
  booking_auto_cancelled_message: "We apologize, your session has been automatically cancelled due to the time expiring without teacher confirmation.",
  booking_auto_cancelled_refund: " The paid amount will be refunded to your balance shortly.",
  booking_report_penalty_title: "Session Cancelled & Earnings Confiscated 🔴",
  booking_report_penalty_message: "Your session has been closed automatically due to failure to submit the report for over 4 days.",
  booking_report_penalty_parent_title: "Session Cancelled Due to Teacher Non-compliance",
  booking_report_penalty_parent_message: "We apologize, the teacher did not write the session report. Your financial rights have been preserved and the administration is reviewing the matter.",
  booking_report_warning_final_title: "Final Warning - Earnings Frozen ⚠️",
  booking_report_warning_final_message: "Your session earnings are frozen! You have limited time to submit the report before the session is permanently confiscated.",
  booking_report_warning_title: "Warning: Overdue Report ⏳",
  booking_report_warning_message: "24 hours have passed since the end of the session and you have not written the report. Please write it immediately to avoid frozen earnings.",
  dispute_new_title: "New Dispute ⚠️",
  dispute_new_message: "The parent has raised a dispute on your recent session. The session's dues have been temporarily frozen.",
  dispute_decision_title: "Decision on Your Dispute",
  dispute_decision_won_message: "The dispute has been resolved in your favor and the amount is being refunded.",
  dispute_decision_lost_message: "The dispute was rejected after review. Check the chat for details.",
  dispute_closed_title: "Financial Dispute Closed",
  dispute_closed_won_message: "The recent dispute was ruled in your favor, and the balance will be added to your next payouts.",
  dispute_closed_lost_message: "The parent's dispute was accepted and the session amount was refunded."
};

function updateJson(filePath, newErrors, newNotifications) {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  data.errors = { ...data.errors, ...newErrors };
  data.notifications = { ...data.notifications, ...newNotifications };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Updated ' + filePath);
}

updateJson('messages/ar.json', arErrors, arNotifications);
updateJson('messages/en.json', enErrors, enNotifications);
