const fs = require('fs');

const REPLACEMENTS = {
  // 1. lib/utils/booking-state.ts
  'lib/utils/booking-state.ts': {
    import: `import { getErrorT } from "@/lib/i18n/get-server-translations";`,
    reps: [
      {
        from: /export function getTransitionError\(\n\tfrom: BookingStatus,\n\tto: BookingStatus,\n\): string {/g,
        to: `export async function getTransitionError(\n\tfrom: BookingStatus,\n\tto: BookingStatus,\n): Promise<string> {`
      },
      {
        from: 'return `لا يمكن تغيير الحجز من "${BOOKING_STATUS_AR[from]}" إلى "${BOOKING_STATUS_AR[to]}"`;',
        to: `const tError = await getErrorT();\n\treturn tError('booking_invalid_transition', { from: BOOKING_STATUS_AR[from], to: BOOKING_STATUS_AR[to] });`
      }
    ]
  },

  // 2. lib/utils/availability.ts
  'lib/utils/availability.ts': {
    import: `import { getErrorT } from "@/lib/i18n/get-server-translations";`,
    reps: [
      {
        from: 'reason: "يجب أن تبدأ الجلسة وتنتهي في نفس اليوم بالتوقيت المحلي"',
        to: 'reason: await (async () => { const t = await getErrorT(); return t("availability_same_day_required"); })()'
      },
      {
        from: 'reason: "الوقت المطلوب ليس ضمن ساعات عمل المعلم المحددة لهذا اليوم"',
        to: 'reason: await (async () => { const t = await getErrorT(); return t("availability_outside_working_hours"); })()'
      },
      {
        from: 'reason: "يوجد لديك حجز مؤكد أو قيد الانتظار في نفس الوقت المطلوب"',
        to: 'reason: await (async () => { const t = await getErrorT(); return t("availability_has_overlap"); })()'
      }
    ]
  },

  // 3. lib/utils/booking-logic.ts
  'lib/utils/booking-logic.ts': {
    import: `import { getErrorT } from "@/lib/i18n/get-server-translations";`,
    reps: [
      {
        from: 'throw new Error("الجلسات التجريبية المجانية غير مفعلة حالياً");',
        to: 'const tError = await getErrorT();\n\t\tthrow new Error(tError("booking_trials_disabled"));'
      },
      {
        from: 'throw new Error("لقد قمت باستخدام جلستك التجريبية المجانية مسبقاً");',
        to: 'const tError = await getErrorT();\n\t\tthrow new Error(tError("booking_trial_already_used"));'
      },
      {
        from: 'throw new Error(`الحد الأدنى لسعر الجلسة هو ${formatCurrency(minPrice)}`);',
        to: 'const tError = await getErrorT();\n\t\tthrow new Error(tError("booking_min_price", { minPrice: formatCurrency(minPrice) }));'
      }
    ]
  },

  // 4. lib/actions/bookings/accept.ts
  'lib/actions/bookings/accept.ts': {
    import: `import { getErrorT, getNotificationT } from "@/lib/i18n/get-server-translations";`,
    reps: [
      {
        from: 'error: getTransitionError(booking.status, targetStatus),',
        to: 'error: await getTransitionError(booking.status, targetStatus),'
      },
      {
        from: 'error: "لقد مضى موعد الجلسة بالفعل، لا يمكن قبولها الآن. سيقوم النظام بإلغائها قريباً.",',
        to: 'error: await (async () => { const t = await getErrorT(); return t("booking_past_time_accept"); })(),'
      },
      {
        from: 'error: "لا يمكن تأكيد الجلسة قبل إتمام الدفع أو تحقق الإدارة من إيصال التحويل",',
        to: 'error: await (async () => { const t = await getErrorT(); return t("booking_cannot_confirm_unpaid"); })(),'
      },
      {
        from: 'title: isTrial\n\t\t\t\t\t\t\t? "تمت الموافقة على طلبك"\n\t\t\t\t\t\t\t: "قبول الحجز",',
        to: 'title: await (async () => { const t = await getNotificationT(); return isTrial ? t("booking_approved_title") : t("booking_accepted_title"); })(),'
      },
      {
        from: 'message: !isTrial\n\t\t\t\t\t\t\t? `وافق المعلم على طلبك، يرجى إتمام الدفع خلال ${holdMinutes} دقيقة لتأكيد الحجز`\n\t\t\t\t\t\t\t: "لقد وافق المعلم على طلب حجز الجلسة وتم تأكيدها.",',
        to: 'message: await (async () => { const t = await getNotificationT(); return !isTrial ? t("booking_accepted_pay_message", { holdMinutes }) : t("booking_approved_message"); })(),'
      }
    ]
  },

  // 5. lib/actions/bookings/pay.ts
  'lib/actions/bookings/pay.ts': {
    import: `import { getErrorT, getNotificationT } from "@/lib/i18n/get-server-translations";`,
    reps: [
      {
        from: 'error: getTransitionError(booking.status, BookingStatus.CONFIRMED),',
        to: 'error: await getTransitionError(booking.status, BookingStatus.CONFIRMED),'
      },
      {
        from: 'return { success: false, error: "هذا الحجز ليس بحالة انتظار الدفع" };',
        to: 'const tError = await getErrorT();\n\t\treturn { success: false, error: tError("booking_not_awaiting_payment") };'
      },
      {
        from: 'error: "لقد مضى موعد الجلسة بالفعل، لا يمكن الدفع الآن. سيقوم النظام بإلغائها قريباً.",',
        to: 'error: await (async () => { const t = await getErrorT(); return t("booking_past_time_pay"); })(),'
      },
      {
        from: 'title: booking.isInstant\n\t\t\t\t\t\t? "الجلسة الفورية بدأت الآن! 🚨"\n\t\t\t\t\t\t: "حجز جديد مؤكد! 🎉",',
        to: 'title: await (async () => { const t = await getNotificationT(); return booking.isInstant ? t("booking_instant_started_title") : t("booking_confirmed_title"); })(),'
      },
      {
        from: 'message: booking.isInstant\n\t\t\t\t\t\t? "لقد وافقت على الطلب وقام ولي الأمر بالدفع. الجلسة بدأت فوراً، ادخل الآن وتوجه لصفحة الحجوزات لتجد الرابط!"\n\t\t\t\t\t\t: "قام ولي الأمر بدفع قيمة الحجز وتم تأكيده تلقائياً. يمكنك الآن الدخول وتجهيز الجلسة في موعدها.",',
        to: 'message: await (async () => { const t = await getNotificationT(); return booking.isInstant ? t("booking_instant_started_message") : t("booking_confirmed_message"); })(),'
      }
    ]
  },

  // 6. lib/actions/bookings/reject.ts
  'lib/actions/bookings/reject.ts': {
    import: `import { getNotificationT } from "@/lib/i18n/get-server-translations";`,
    reps: [
      {
        from: 'error: getTransitionError(booking.status, BookingStatus.REJECTED),',
        to: 'error: await getTransitionError(booking.status, BookingStatus.REJECTED),'
      },
      {
        from: 'title: "رفض الحجز",',
        to: 'title: await (async () => { const t = await getNotificationT(); return t("booking_rejected_title"); })(),'
      },
      {
        from: 'message: "نعتذر، لقد قام المعلم برفض طلب الحجز الخاص بك.",',
        to: 'message: await (async () => { const t = await getNotificationT(); return t("booking_rejected_message"); })(),'
      }
    ]
  },

  // 7. lib/actions/bookings/report.ts
  'lib/actions/bookings/report.ts': {
    import: `import { getErrorT, getNotificationT } from "@/lib/i18n/get-server-translations";`,
    reps: [
      {
        from: 'error: getTransitionError(booking.status, BookingStatus.COMPLETED),',
        to: 'error: await getTransitionError(booking.status, BookingStatus.COMPLETED),'
      },
      {
        from: 'return { success: false, error: "الحجز غير موجود أو غير تابع لك" };',
        to: 'const tError = await getErrorT();\n\t\treturn { success: false, error: tError("booking_not_found_or_unauthorized") };'
      },
      {
        from: 'error: "لا يمكن تقديم التقرير قبل انتهاء وقت الجلسة الفعلي",',
        to: 'error: await (async () => { const t = await getErrorT(); return t("booking_report_early_error"); })(),'
      },
      {
        from: 'title: "تقرير الجلسة التعليمية جاهز",',
        to: 'title: await (async () => { const t = await getNotificationT(); return t("booking_report_ready_title"); })(),'
      },
      {
        from: 'message: `قام المعلم برفع تقرير الحصة للطالب. يرجى مراجعة تفاصيل الجلسة.`,',
        to: 'message: await (async () => { const t = await getNotificationT(); return t("booking_report_ready_message"); })(),'
      }
    ]
  },

  // 8. lib/actions/bookings/search.ts
  'lib/actions/bookings/search.ts': {
    import: `import { getErrorT } from "@/lib/i18n/get-server-translations";`,
    reps: [
      {
        from: 'return { success: false, error: "يرجى تحديد الطالب والمادة والتاريخ والوقت" };',
        to: 'const tError = await getErrorT();\n\t\treturn { success: false, error: tError("search_missing_fields") };'
      },
      {
        from: 'return { success: false, error: "الطالب المحدد غير موجود" };',
        to: 'const tError = await getErrorT();\n\t\treturn { success: false, error: tError("search_student_not_found") };'
      },
      {
        from: 'return { success: false, error: "التاريخ أو الوقت غير صالح" };',
        to: 'const tError = await getErrorT();\n\t\treturn { success: false, error: tError("search_invalid_datetime") };'
      },
      {
        from: 'error: `يجب أن يكون الموعد بعد ${minLeadHours} ساعات على الأقل من الآن`,',
        to: 'error: await (async () => { const t = await getErrorT(); return t("booking_min_lead_time", { minLeadHours }); })(),'
      },
      {
        from: '"غير محدد",',
        to: 'await (async () => { const t = await getErrorT(); return t("search_unspecified", undefined, { fallback: "غير محدد" }); })() as any,'
      },
      {
        from: 'const msg = err instanceof Error ? err.message : "حدث خطأ أثناء البحث";',
        to: 'const tError = await getErrorT();\n\t\tconst msg = err instanceof Error ? err.message : tError("search_unexpected_error");'
      }
    ]
  },

  // 9. lib/actions/tutoring-requests/create.ts
  'lib/actions/tutoring-requests/create.ts': {
    import: `import { getErrorT, getNotificationT } from "@/lib/i18n/get-server-translations";`,
    reps: [
      {
        from: 'error: "الطالب المحدد غير موجود أو غير تابع لك",',
        to: 'error: await (async () => { const t = await getErrorT(); return t("booking_student_not_found"); })(),'
      },
      {
        from: 'return { success: false, error: "نوع الخدمة المطلوب غير متوفر" };',
        to: 'const tError = await getErrorT();\n\t\treturn { success: false, error: tError("request_service_type_not_found") };'
      },
      {
        from: 'title: "⚡ طلب فوري جديد! (Live Radar) 📢",',
        to: 'title: await (async () => { const t = await getNotificationT(); return t("instant_request_new_title"); })(),'
      },
      {
        from: 'message: `طلب عاجل من الطالب (${student.name} - الصف ${student.grade}). الطلب مدفوع مسبقاً (${formatCurrency(price)} - ${duration} دقيقة). أسرع والتقط الطلب الآن قبل غيرك!`,',
        to: 'message: await (async () => { const t = await getNotificationT(); return t("instant_request_new_message", { studentName: student.name, studentGrade: student.grade, priceFormatted: formatCurrency(price), duration }); })(),'
      },
      {
        from: 'error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء الطلب",',
        to: 'error instanceof Error ? error.message : await (async () => { const t = await getErrorT(); return t("request_creation_error"); })()'
      }
    ]
  },

  // 10. lib/actions/tutoring-requests/instant-book.ts
  'lib/actions/tutoring-requests/instant-book.ts': {
    import: `import { getErrorT, getNotificationT } from "@/lib/i18n/get-server-translations";`,
    reps: [
      {
        from: 'error: "يجب توثيق حسابك أولاً لالتقاط الطلبات الفورية",',
        to: 'error: await (async () => { const t = await getErrorT(); return t("instant_book_teacher_unverified"); })(),'
      },
      {
        from: 'throw new Error("عذراً، لقد كان معلماً آخر أسرع منك والتقط هذا الطلب!");',
        to: 'const tError = await getErrorT();\n\t\t\t\tthrow new Error(tError("instant_book_already_taken"));'
      },
      {
        from: 'throw new Error("تخصصك لا يطابق التخصص المطلوب في هذا الطلب");',
        to: 'const tError = await getErrorT();\n\t\t\tthrow new Error(tError("instant_book_subject_mismatch"));'
      },
      {
        from: '"المرحلة الدراسية للطالب لا تقع ضمن المراحل التي تدرسها",',
        to: 'await (async () => { const t = await getErrorT(); return t("instant_book_grade_mismatch"); })()'
      },
      {
        from: '"لديك حجز آخر متداخل في هذا الوقت حالياً. يرجى إنهاء جلستك أولاً.",',
        to: 'await (async () => { const t = await getErrorT(); return t("instant_book_overlap"); })()'
      },
      {
        from: 'customDescription: "خدمة فوري (Live Radar)",',
        to: 'customDescription: await (async () => { const t = await getErrorT(); return t("instant_service_desc", undefined, { fallback: "خدمة فوري (Live Radar)" }); })(),'
      },
      {
        from: 'title: "⚡ تم العثور على معلم!",',
        to: 'title: await (async () => { const t = await getNotificationT(); return t("instant_book_found_title"); })(),'
      },
      {
        from: 'message: `تم التطابق مع المعلم ${teacher.user.name}. يرجى إتمام الدفع فوراً للدخول إلى الجلسة. المعلم بانتظارك الآن!`,',
        to: 'message: await (async () => { const t = await getNotificationT(); return t("instant_book_found_message", { teacherName: teacher.user.name }); })(),'
      },
      {
        from: 'error instanceof Error ? error.message : "حدث خطأ أثناء التقاط الطلب",',
        to: 'error instanceof Error ? error.message : await (async () => { const t = await getErrorT(); return t("instant_book_unexpected_error"); })()'
      }
    ]
  },

  // 11. lib/actions/tutoring-requests/status.ts
  'lib/actions/tutoring-requests/status.ts': {
    import: `import { getErrorT } from "@/lib/i18n/get-server-translations";`,
    reps: [
      {
        from: 'return { success: false, error: "الطلب غير موجود" };',
        to: 'const tError = await getErrorT();\n\t\treturn { success: false, error: tError("request_not_found") };'
      },
      {
        from: 'error: error instanceof Error ? error.message : "حدث خطأ أثناء الفحص",',
        to: 'error: error instanceof Error ? error.message : await (async () => { const t = await getErrorT(); return t("request_status_check_error"); })(),'
      }
    ]
  },

  // 12. lib/actions/availability.ts
  'lib/actions/availability.ts': {
    import: `import { getErrorT } from "@/lib/i18n/get-server-translations";`,
    reps: [
      {
        from: 'return { success: false, error: "البيانات المرسلة غير صالحة" };',
        to: 'const tError = await getErrorT();\n\t\t\treturn { success: false, error: tError("availability_invalid_data") };'
      },
      {
        from: 'error: "وقت البدء يجب أن يكون قبل وقت الانتهاء",',
        to: 'error: await (async () => { const t = await getErrorT(); return t("availability_start_before_end"); })(),'
      },
      {
        from: 'err instanceof Error ? err.message : "حدث خطأ أثناء تحديث أوقات التوفر";',
        to: 'err instanceof Error ? err.message : await (async () => { const t = await getErrorT(); return t("availability_update_error"); })();'
      }
    ]
  },

  // 13. lib/actions/review.ts
  'lib/actions/review.ts': {
    import: `import { getErrorT } from "@/lib/i18n/get-server-translations";`,
    reps: [
      {
        // For zod max
        from: '.max(5, "التقييم يجب أن يكون بين 1 و 5"),',
        to: '.max(5, "التقييم يجب أن يكون بين 1 و 5"),' // Skip zod for now, keep standard
      },
      {
        from: 'return { success: false, error: "الحجز غير موجود" };',
        to: 'const tError = await getErrorT();\n\t\treturn { success: false, error: tError("review_booking_not_found") };'
      },
      {
        from: 'return { success: false, error: "يمكنك تقييم الجلسات المكتملة فقط" };',
        to: 'const tError = await getErrorT();\n\t\treturn { success: false, error: tError("review_only_completed_bookings") };'
      },
      {
        from: 'return { success: false, error: "لقد قمت بتقييم هذه الجلسة مسبقاً" };',
        to: 'const tError = await getErrorT();\n\t\treturn { success: false, error: tError("review_already_submitted") };'
      },
      {
        from: 'err instanceof Error ? err.message : "حدث خطأ أثناء إرسال التقييم";',
        to: 'err instanceof Error ? err.message : await (async () => { const t = await getErrorT(); return t("review_submit_error"); })();'
      }
    ]
  },

  // 14. hooks/useBookingSubmission.ts
  'hooks/useBookingSubmission.ts': {
    import: `import { useTranslations } from "next-intl";`,
    reps: [
      {
        from: 'setErrorMsg(res.error || "حدث خطأ غير معروف");',
        to: 'setErrorMsg(res.error || t("booking_unknown_error"));'
      },
      {
        from: 'options?.onError?.(res.error || "حدث خطأ غير معروف");',
        to: 'options?.onError?.(res.error || t("booking_unknown_error"));'
      },
      {
        from: 'setErrorMsg("حدث خطأ غير متوقع أثناء إتمام الحجز");',
        to: 'setErrorMsg(t("booking_unexpected_error"));'
      },
      {
        from: 'options?.onError?.("حدث خطأ غير متوقع أثناء إتمام الحجز");',
        to: 'options?.onError?.(t("booking_unexpected_error"));'
      }
    ],
    // custom hook injection
    customInject: (content) => {
      // Find `export function useBookingSubmission` and inject `const t = useTranslations("errors");` inside.
      return content.replace(
        /(export function useBookingSubmission[\s\S]*?{\n)/,
        `$1\tconst t = useTranslations("errors");\n`
      );
    }
  }
};

for (const [file, config] of Object.entries(REPLACEMENTS)) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add imports
    if (config.import && !content.includes(config.import.split(' ')[2])) {
      // Find first import and insert before
      const firstImportMatch = content.match(/^import /m);
      if (firstImportMatch) {
        const idx = content.indexOf(firstImportMatch[0]);
        content = content.slice(0, idx) + config.import + '\n' + content.slice(idx);
      } else {
        content = config.import + '\n' + content;
      }
    }

    if (config.customInject) {
      content = config.customInject(content);
    }

    // Apply replacements
    for (const rep of config.reps) {
      content = content.replace(rep.from, rep.to);
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Processed ${file}`);
  } else {
    console.warn(`File missing: ${file}`);
  }
}
