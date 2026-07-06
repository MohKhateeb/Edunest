const fs = require('fs');

const arErrors = {
  booking_past_time_accept: "لقد مضى موعد الجلسة بالفعل، لا يمكن قبولها الآن. سيقوم النظام بإلغائها قريباً.",
  booking_cannot_confirm_unpaid: "لا يمكن تأكيد الجلسة قبل إتمام الدفع أو تحقق الإدارة من إيصال التحويل",
  booking_not_awaiting_payment: "هذا الحجز ليس بحالة انتظار الدفع",
  booking_past_time_pay: "لقد مضى موعد الجلسة بالفعل، لا يمكن الدفع الآن. سيقوم النظام بإلغائها قريباً.",
  booking_not_found_or_unauthorized: "الحجز غير موجود أو غير تابع لك",
  booking_report_early_error: "لا يمكن تقديم التقرير قبل انتهاء وقت الجلسة الفعلي",
  search_missing_fields: "يرجى تحديد الطالب والمادة والتاريخ والوقت",
  search_student_not_found: "الطالب المحدد غير موجود",
  search_invalid_datetime: "التاريخ أو الوقت غير صالح",
  search_unexpected_error: "حدث خطأ أثناء البحث",
  request_creation_error: "حدث خطأ أثناء إنشاء الطلب",
  request_service_type_not_found: "نوع الخدمة المطلوب غير متوفر",
  instant_book_teacher_unverified: "يجب توثيق حسابك أولاً لالتقاط الطلبات الفورية",
  instant_book_already_taken: "عذراً، لقد كان معلماً آخر أسرع منك والتقط هذا الطلب!",
  instant_book_subject_mismatch: "تخصصك لا يطابق التخصص المطلوب في هذا الطلب",
  instant_book_grade_mismatch: "المرحلة الدراسية للطالب لا تقع ضمن المراحل التي تدرسها",
  instant_book_overlap: "لديك حجز آخر متداخل في هذا الوقت حالياً. يرجى إنهاء جلستك أولاً.",
  instant_book_unexpected_error: "حدث خطأ أثناء التقاط الطلب",
  request_not_found: "الطلب غير موجود",
  request_status_check_error: "حدث خطأ أثناء الفحص",
  availability_invalid_data: "البيانات المرسلة غير صالحة",
  availability_start_before_end: "وقت البدء يجب أن يكون قبل وقت الانتهاء",
  availability_update_error: "حدث خطأ أثناء تحديث أوقات التوفر",
  review_invalid_rating: "التقييم يجب أن يكون بين 1 و 5",
  review_booking_not_found: "الحجز غير موجود",
  review_only_completed_bookings: "يمكنك تقييم الجلسات المكتملة فقط",
  review_already_submitted: "لقد قمت بتقييم هذه الجلسة مسبقاً",
  review_submit_error: "حدث خطأ أثناء إرسال التقييم",
  availability_same_day_required: "يجب أن تبدأ الجلسة وتنتهي في نفس اليوم بالتوقيت المحلي",
  availability_outside_working_hours: "الوقت المطلوب ليس ضمن ساعات عمل المعلم المحددة لهذا اليوم",
  availability_has_overlap: "يوجد لديك حجز مؤكد أو قيد الانتظار في نفس الوقت المطلوب",
  booking_trials_disabled: "الجلسات التجريبية المجانية غير مفعلة حالياً",
  booking_min_price: "الحد الأدنى لسعر الجلسة هو {minPrice}",
  booking_unexpected_error: "حدث خطأ غير متوقع أثناء إتمام الحجز",
  booking_unknown_error: "حدث خطأ غير معروف",
  booking_invalid_transition: 'لا يمكن تغيير الحجز من "{from}" إلى "{to}"'
};

const enErrors = {
  booking_past_time_accept: "The session time has already passed, it cannot be accepted now. The system will cancel it soon.",
  booking_cannot_confirm_unpaid: "The session cannot be confirmed before payment is completed or the administration verifies the transfer receipt",
  booking_not_awaiting_payment: "This booking is not in an awaiting payment state",
  booking_past_time_pay: "The session time has already passed, it cannot be paid now. The system will cancel it soon.",
  booking_not_found_or_unauthorized: "Booking not found or you are not authorized",
  booking_report_early_error: "The report cannot be submitted before the actual session end time",
  search_missing_fields: "Please specify the student, subject, date and time",
  search_student_not_found: "The selected student was not found",
  search_invalid_datetime: "Invalid date or time",
  search_unexpected_error: "An error occurred while searching",
  request_creation_error: "An error occurred while creating the request",
  request_service_type_not_found: "The requested service type is not available",
  instant_book_teacher_unverified: "You must verify your account first to capture instant requests",
  instant_book_already_taken: "Sorry, another teacher was faster and captured this request!",
  instant_book_subject_mismatch: "Your subject does not match the requested subject in this request",
  instant_book_grade_mismatch: "The student's grade does not fall within the grades you teach",
  instant_book_overlap: "You have another overlapping booking at this time. Please finish your session first.",
  instant_book_unexpected_error: "An error occurred while capturing the request",
  request_not_found: "Request not found",
  request_status_check_error: "An error occurred during the status check",
  availability_invalid_data: "The submitted data is invalid",
  availability_start_before_end: "Start time must be before end time",
  availability_update_error: "An error occurred while updating availability",
  review_invalid_rating: "Rating must be between 1 and 5",
  review_booking_not_found: "Booking not found",
  review_only_completed_bookings: "You can only review completed sessions",
  review_already_submitted: "You have already reviewed this session",
  review_submit_error: "An error occurred while submitting the review",
  availability_same_day_required: "The session must start and end on the same day in local time",
  availability_outside_working_hours: "The requested time is not within the teacher's specified working hours for this day",
  availability_has_overlap: "You have a confirmed or pending booking at the same requested time",
  booking_trials_disabled: "Free trial sessions are currently disabled",
  booking_min_price: "The minimum session price is {minPrice}",
  booking_unexpected_error: "An unexpected error occurred while completing the booking",
  booking_unknown_error: "An unknown error occurred",
  booking_invalid_transition: 'Cannot change booking from "{from}" to "{to}"'
};

const arNotifications = {
  booking_approved_title: "تمت الموافقة على طلبك",
  booking_accepted_title: "قبول الحجز",
  booking_accepted_pay_message: "وافق المعلم على طلبك، يرجى إتمام الدفع خلال {holdMinutes} دقيقة لتأكيد الحجز",
  booking_approved_message: "لقد وافق المعلم على طلب حجز الجلسة وتم تأكيدها.",
  booking_instant_started_title: "الجلسة الفورية بدأت الآن! 🚨",
  booking_confirmed_title: "حجز جديد مؤكد! 🎉",
  booking_instant_started_message: "لقد وافقت على الطلب وقام ولي الأمر بالدفع. الجلسة بدأت فوراً، ادخل الآن وتوجه لصفحة الحجوزات لتجد الرابط!",
  booking_confirmed_message: "قام ولي الأمر بدفع قيمة الحجز وتم تأكيده تلقائياً. يمكنك الآن الدخول وتجهيز الجلسة في موعدها.",
  booking_rejected_title: "رفض الحجز",
  booking_rejected_message: "نعتذر، لقد قام المعلم برفض طلب الحجز الخاص بك.",
  booking_report_ready_title: "تقرير الجلسة التعليمية جاهز",
  booking_report_ready_message: "قام المعلم برفع تقرير الحصة للطالب. يرجى مراجعة تفاصيل الجلسة.",
  instant_request_new_title: "⚡ طلب فوري جديد! (Live Radar) 📢",
  instant_request_new_message: "طلب عاجل من الطالب ({studentName} - الصف {studentGrade}). الطلب مدفوع مسبقاً ({priceFormatted} - {duration} دقيقة). أسرع والتقط الطلب الآن قبل غيرك!",
  instant_book_found_title: "⚡ تم العثور على معلم!",
  instant_book_found_message: "تم التطابق مع المعلم {teacherName}. يرجى إتمام الدفع فوراً للدخول إلى الجلسة. المعلم بانتظارك الآن!"
};

const enNotifications = {
  booking_approved_title: "Your request has been approved",
  booking_accepted_title: "Booking Accepted",
  booking_accepted_pay_message: "The teacher approved your request, please complete the payment within {holdMinutes} minutes to confirm the booking",
  booking_approved_message: "The teacher has approved your booking request and it has been confirmed.",
  booking_instant_started_title: "The instant session has started now! 🚨",
  booking_confirmed_title: "New Booking Confirmed! 🎉",
  booking_instant_started_message: "You approved the request and the parent has paid. The session has started immediately, log in now and head to the bookings page to find the link!",
  booking_confirmed_message: "The parent has paid the booking amount and it has been confirmed automatically. You can now log in and prepare for the session.",
  booking_rejected_title: "Booking Rejected",
  booking_rejected_message: "We apologize, the teacher has rejected your booking request.",
  booking_report_ready_title: "Educational Session Report Ready",
  booking_report_ready_message: "The teacher has uploaded the class report for the student. Please review the session details.",
  instant_request_new_title: "⚡ New Instant Request! (Live Radar) 📢",
  instant_request_new_message: "Urgent request from student ({studentName} - Grade {studentGrade}). Pre-paid request ({priceFormatted} - {duration} minutes). Hurry up and capture the request now before anyone else!",
  instant_book_found_title: "⚡ Teacher Found!",
  instant_book_found_message: "Matched with teacher {teacherName}. Please complete payment immediately to join the session. The teacher is waiting for you now!"
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
