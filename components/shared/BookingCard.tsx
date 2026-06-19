'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Booking, Student, TeacherService, ServiceType, Teacher, User, Payment, SessionReport } from '@prisma/client';
import { BOOKING_STATUS_AR, PAYMENT_STATUS_AR, PAYMENT_METHOD_AR } from '@/lib/translations';
import { formatLocalTime, formatPrice } from '@/lib/utils';
import { acceptBooking, rejectBooking, cancelBooking, submitSessionReport } from '@/lib/actions/booking';
import { submitReview } from '@/lib/actions/review';
import { Calendar, Clock, Video, User as UserIcon, BookOpen, FileText, Star, Lock, TimerOff, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import DetailsModal from '@/components/shared/DetailsModal';
import Portal from '@/components/shared/Portal';

type BookingCardProps = {
  booking: Booking & {
    student: Student;
    teacherService: TeacherService & {
      serviceType: ServiceType;
      teacher: Teacher & {
        user: Pick<User, 'name'>;
      };
    };
    parent: Pick<User, 'name'>;
    payment?: Payment | null;
    report?: SessionReport | null;
  };
  role: 'PARENT' | 'TEACHER' | 'ADMIN';
};

export default function BookingCard({ booking, role }: BookingCardProps) {
  const [loading, setLoading] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showViewReportModal, setShowViewReportModal] = useState(false);
  const report = booking.report;

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    studentAttended: true,
    topicsCovered: '',
    studentPerformance: '5',
    homeworkAssigned: '',
    teacherNotes: '',
  });

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });

  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const isTrial = booking.isTrial;
  const priceDisplay = isTrial ? 'تجريبية مجانية' : formatPrice(Number(booking.price));

  // Style helpers
  const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900',
    CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
    COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
    CANCELLED: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
  };

  const paymentStyles: Record<string, string> = {
    UNPAID: 'text-rose-600 dark:text-rose-400',
    PENDING_VERIFICATION: 'text-yellow-600 dark:text-yellow-400',
    PAID: 'text-emerald-600 dark:text-emerald-400 font-bold',
    REFUNDED: 'text-slate-500 dark:text-slate-400 line-through',
  };

  // Actions
  const handleAccept = async () => {
    setLoading(true);
    const res = await acceptBooking(booking.id);
    setLoading(false);
    if (!res.success) toast.error('فشل قبول الحجز', { description: res.error });
    else toast.success('تم قبول الحجز بنجاح');
  };

  const handleReject = async () => {
    setLoading(true);
    const res = await rejectBooking(booking.id);
    setLoading(false);
    if (!res.success) toast.error('فشل رفض الحجز', { description: res.error });
    else toast.success('تم رفض الحجز');
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cancelReason.trim().length < 5) {
      toast.warning('سبب الإلغاء قصير جداً', { description: 'الرجاء كتابة سبب إلغاء لا يقل عن 5 أحرف' });
      return;
    }
    setLoading(true);
    const res = await cancelBooking({ bookingId: booking.id, reason: cancelReason });
    setLoading(false);
    if (res.success) {
      toast.success('تم الإلغاء بنجاح', { description: 'تم إلغاء الجلسة وإبلاغ الطرف الآخر' });
      setShowCancelModal(false);
      setCancelReason('');
    } else {
      toast.error('فشل إلغاء الحجز', { description: res.error });
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.topicsCovered.trim()) {
      toast.warning('بيانات ناقصة', { description: 'الرجاء تعبئة المواضيع المغطاة' });
      return;
    }
    setLoading(true);
    const res = await submitSessionReport({
      bookingId: booking.id,
      studentAttended: reportForm.studentAttended,
      topicsCovered: reportForm.topicsCovered,
      studentPerformance: reportForm.studentAttended ? Number(reportForm.studentPerformance) : null,
      homeworkAssigned: reportForm.homeworkAssigned,
      teacherNotes: reportForm.teacherNotes,
    });
    setLoading(false);
    if (res.success) {
      toast.success('تم إرسال التقرير', { description: 'تم حفظ تقرير الجلسة وإنهاء الحجز بنجاح' });
      setShowReportModal(false);
    } else {
      toast.error('فشل إرسال التقرير', { description: res.error });
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await submitReview({
      bookingId: booking.id,
      rating: Number(reviewForm.rating),
      comment: reviewForm.comment,
    });
    setLoading(false);
    if (res.success) {
      toast.success('شكراً لتقييمك', { description: 'تم إرسال تقييمك للمعلم بنجاح' });
      setShowReviewModal(false);
    } else {
      toast.error('فشل إرسال التقييم', { description: res.error });
    }
  };

  // Meet link (Jitsi Meet)
  const meetLink = booking.meetingUrl || `https://meet.jit.si/edunest-${booking.id}`;

  // ════════════════════════════════════════════════════
  // حالة تفعيل زر الانضمام بناءً على الوقت
  // يُفعّل قبل 5 دقائق من بداية الجلسة ويُلغى بعد انتهائها
  // ════════════════════════════════════════════════════
  const EARLY_JOIN_MINUTES = 5; // السماح بالانضمام قبل 5 دقائق

  const getSessionTimeState = useCallback(() => {
    const now = Date.now();
    const sessionStart = new Date(booking.startTime).getTime();
    const sessionEnd = sessionStart + booking.duration * 60_000;
    const earlyJoinTime = sessionStart - EARLY_JOIN_MINUTES * 60_000;

    if (now < earlyJoinTime) {
      // لم يحن الوقت بعد
      const minutesLeft = Math.ceil((earlyJoinTime - now) / 60_000);
      return { status: 'waiting' as const, minutesLeft };
    } else if (now >= earlyJoinTime && now <= sessionEnd) {
      // وقت الجلسة (نشط)
      return { status: 'active' as const, minutesLeft: 0 };
    } else {
      // انتهت الجلسة
      return { status: 'expired' as const, minutesLeft: 0 };
    }
  }, [booking.startTime, booking.duration]);

  const [sessionTimeState, setSessionTimeState] = useState(getSessionTimeState);

  useEffect(() => {
    if (booking.status !== 'CONFIRMED') return;

    // تحديث الحالة كل 30 ثانية
    const interval = setInterval(() => {
      setSessionTimeState(getSessionTimeState());
    }, 30_000);

    // تحديث فوري
    setSessionTimeState(getSessionTimeState());

    return () => clearInterval(interval);
  }, [booking.status, getSessionTimeState]);

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover-card relative flex flex-col gap-4 shadow-sm">
      {/* Top row */}
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', statusStyles[booking.status])}>
            {BOOKING_STATUS_AR[booking.status]}
          </span>
          {isTrial && (
            <span className="me-2 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900">
              جلسة تجريبية
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground block">التكلفة</span>
          <span className="font-extrabold text-foreground">{priceDisplay}</span>
        </div>
      </div>

      {/* Main Details List */}
      <div className="space-y-3 border-y border-border py-4 my-1 text-right">
        {/* Item 1: Service Type & Duration */}
        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
          <div className="flex items-center gap-2 text-foreground/80 font-medium">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>{booking.teacherService.serviceType.name}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted dark:bg-accent/20 px-2 py-0.5 rounded-md">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>مدة الجلسة: {booking.duration} دقيقة</span>
          </div>
        </div>

        {/* Item 2: Date & Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary/75" />
          <span className="font-semibold text-foreground/80">{formatLocalTime(booking.startTime)}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-border/80 my-1"></div>

        {/* Item 3: Student Details */}
        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserIcon className="h-4 w-4 text-primary/75" />
            <span>الطالب: <strong className="text-foreground">{booking.student.name}</strong></span>
          </div>
          <span className="text-[10px] text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-bold">
            الصف {booking.student.grade}
          </span>
        </div>

        {/* Item 4: Parent / Teacher Details */}
        {role === 'TEACHER' ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserIcon className="h-4 w-4 text-primary/75" />
            <span>ولي الأمر: <strong className="text-foreground">{booking.parent.name}</strong></span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <div className="relative h-8 w-8 rounded-full overflow-hidden bg-accent border border-border flex-shrink-0">
              {booking.teacherService.teacher.profileImageUrl ? (
                <img
                  src={booking.teacherService.teacher.profileImageUrl}
                  alt={booking.teacherService.teacher.user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-primary font-bold text-xs bg-primary/10">
                  {booking.teacherService.teacher.user.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground leading-none">المعلم</span>
              <strong className="text-foreground text-xs font-bold mt-0.5">{booking.teacherService.teacher.user.name}</strong>
            </div>
          </div>
        )}

        {/* Item 5: Payment Info */}
        {!isTrial && (
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-accent/20 px-3 py-2 rounded-lg border border-border/40 mt-1">
            <span>حالة الدفع:</span>
            <div className="flex items-center gap-1 font-semibold">
              <span className={paymentStyles[booking.paymentStatus]}>
                {PAYMENT_STATUS_AR[booking.paymentStatus]}
              </span>
              {booking.payment?.method && (
                <span className="text-[10px] text-muted-foreground">({PAYMENT_METHOD_AR[booking.payment.method]})</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Notes */}
      {booking.parentNotes && (
        <div className="text-xs text-muted-foreground bg-accent/40 px-3 py-2 rounded-lg border border-border">
          <span className="font-semibold block mb-0.5 text-foreground/80">ملاحظات ولي الأمر:</span>
          {booking.parentNotes}
        </div>
      )}

      {/* Bottom Row Actions */}
      <div className="flex justify-end gap-3 items-center flex-wrap pt-2">
        <button
          onClick={() => setShowDetailsModal(true)}
          className="text-xs font-semibold border border-primary/20 hover:bg-primary hover:text-primary-foreground px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ml-auto"
        >
          <Eye className="h-3.5 w-3.5" />
          التفاصيل الكاملة
        </button>
        {/* Tutor Accept/Reject for PENDING status */}
        {role === 'TEACHER' && booking.status === 'PENDING' && (
          <>
            <button
              onClick={handleReject}
              disabled={loading}
              className="text-xs font-semibold border border-border hover:bg-rose-50 hover:text-rose-600 px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              رفض الطلب
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              قبول الحجز
            </button>
          </>
        )}

        {/* Meet Link for CONFIRMED status — يُفعّل فقط عند دخول وقت الجلسة */}
        {booking.status === 'CONFIRMED' && sessionTimeState.status === 'active' && (
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer animate-pulse"
          >
            <Video className="h-4 w-4" />
            انضم للجلسة الآن
          </a>
        )}
        {booking.status === 'CONFIRMED' && sessionTimeState.status === 'waiting' && (
          <span className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-not-allowed">
            <Lock className="h-3.5 w-3.5" />
            {sessionTimeState.minutesLeft > 60
              ? `يُفتح قبل الجلسة بـ ${Math.floor(sessionTimeState.minutesLeft / 60)} ساعة`
              : `يُفتح خلال ${sessionTimeState.minutesLeft} دقيقة`}
          </span>
        )}
        {booking.status === 'CONFIRMED' && sessionTimeState.status === 'expired' && (
          <span className="flex items-center gap-1.5 text-xs font-semibold bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 cursor-not-allowed line-through">
            <TimerOff className="h-3.5 w-3.5" />
            انتهى وقت الجلسة
          </span>
        )}

        {/* Submit Report (TEACHER only, CONFIRMED status) */}
        {role === 'TEACHER' && booking.status === 'CONFIRMED' && (
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            رفع تقرير الحصة وإنهاء الجلسة
          </button>
        )}

        {/* View Session Report (COMPLETED status, report exists) */}
        {booking.status === 'COMPLETED' && booking.report && (
          <button
            onClick={() => setShowViewReportModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            عرض تقرير الحصة
          </button>
        )}

        {/* Submit Review (PARENT only, COMPLETED status, no review yet) */}
        {role === 'PARENT' && booking.status === 'COMPLETED' && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Star className="h-4 w-4" />
            تقييم المعلم
          </button>
        )}

        {/* Cancel actions */}
        {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
          <button
            onClick={() => setShowCancelModal(true)}
            disabled={loading}
            className="text-xs font-medium text-destructive hover:bg-destructive/10 px-3 py-2 rounded-lg transition-colors cursor-pointer"
          >
            إلغاء الجلسة
          </button>
        )}
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 overflow-y-auto">
            <form onSubmit={handleCancelSubmit} className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl my-8">
              <h3 className="font-extrabold text-lg">إلغاء حجز الجلسة</h3>
              <p className="text-xs text-muted-foreground">
                يرجى توضيح سبب الإلغاء. تطبق سياسة الاسترداد للمنصة تلقائياً على هذا الإلغاء.
              </p>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="اكتب سبب إلغاء الحجز هنا (5 أحرف على الأقل)..."
                className="w-full text-sm premium-input resize-none"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="text-xs font-semibold border border-border hover:bg-accent px-4 py-2 rounded-lg cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-lg shadow-sm cursor-pointer"
                >
                  تأكيد الإلغاء
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* Session Report Modal */}
      {showReportModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 overflow-y-auto">
            <form onSubmit={handleReportSubmit} className="bg-card border border-border rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl my-8">
              <h3 className="font-extrabold text-lg">تقرير الجلسة التعليمية</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="attended"
                    checked={reportForm.studentAttended}
                    onChange={(e) => setReportForm({ ...reportForm, studentAttended: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="attended" className="font-medium cursor-pointer">هل حضر الطالب الجلسة؟</label>
                </div>

                {reportForm.studentAttended && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-muted-foreground">أداء الطالب (1-5)</label>
                      <select
                        value={reportForm.studentPerformance}
                        onChange={(e) => setReportForm({ ...reportForm, studentPerformance: e.target.value })}
                        className="w-full premium-input text-xs"
                      >
                        <option value="5">ممتاز (5)</option>
                        <option value="4">جيد جداً (4)</option>
                        <option value="3">متوسط (3)</option>
                        <option value="2">يحتاج تحسين (2)</option>
                        <option value="1">ضعيف جداً (1)</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-muted-foreground">المواضيع التي تم تغطيتها *</label>
                  <textarea
                    required
                    rows={2}
                    value={reportForm.topicsCovered}
                    onChange={(e) => setReportForm({ ...reportForm, topicsCovered: e.target.value })}
                    placeholder="المواضيع والمسائل والدروس التي تم شرحها للطالب..."
                    className="w-full premium-input text-xs resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-muted-foreground">الواجبات المنزلية المقررة (اختياري)</label>
                  <textarea
                    rows={2}
                    value={reportForm.homeworkAssigned}
                    onChange={(e) => setReportForm({ ...reportForm, homeworkAssigned: e.target.value })}
                    placeholder="أي تدريبات أو واجبات مقررة للمرة القادمة..."
                    className="w-full premium-input text-xs resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-muted-foreground">ملاحظات المعلم (اختياري)</label>
                  <textarea
                    rows={2}
                    value={reportForm.teacherNotes}
                    onChange={(e) => setReportForm({ ...reportForm, teacherNotes: e.target.value })}
                    placeholder="ملاحظات سرية أو توصيات إضافية لولي الأمر..."
                    className="w-full premium-input text-xs resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="text-xs font-semibold border border-border hover:bg-accent px-4 py-2 rounded-lg cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg shadow-sm cursor-pointer"
                >
                  إرسال التقرير وإنهاء الجلسة
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 overflow-y-auto">
            <form onSubmit={handleReviewSubmit} className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl my-8">
              <h3 className="font-extrabold text-lg">تقييم تجربة التعلم مع المعلم</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-muted-foreground">التقييم بالنجوم</label>
                  <div className="flex items-center gap-1.5 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="text-yellow-500 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          size={32}
                          fill={star <= reviewForm.rating ? 'currentColor' : 'none'}
                          className="text-yellow-500"
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-muted-foreground">تعليق إضافي (اختياري)</label>
                  <textarea
                    rows={3}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="اكتب رأيك وتجربتك مع المعلم هنا لمساعدة الآخرين..."
                    className="w-full text-sm premium-input resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="text-xs font-semibold border border-border hover:bg-accent px-4 py-2 rounded-lg cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg shadow-sm cursor-pointer"
                >
                  إرسال التقييم
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* View Session Report Modal */}
      {showViewReportModal && report && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 space-y-5 shadow-xl relative animate-in zoom-in-95 duration-200 my-8">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-border pb-3">
                <div>
                  <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                    <FileText className="h-5.5 w-5.5 text-primary" />
                    تقرير الجلسة التعليمية المنتهية
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    المعلم: <span className="font-semibold text-foreground">{booking.teacherService.teacher.user.name}</span> | 
                    الطالب: <span className="font-semibold text-foreground">{booking.student.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowViewReportModal(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent transition-colors"
                  aria-label="إغلاق"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4 text-sm pe-1">
                {/* Attendance and Performance row */}
                <div className="flex justify-between items-center gap-4 bg-accent/20 p-3.5 rounded-xl border border-border">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block font-semibold">حضور الطالب</span>
                    {report.studentAttended ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1 rounded-full">
                        ✓ حضر الجلسة
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900 px-2.5 py-1 rounded-full">
                        ✗ غاب عن الجلسة
                      </span>
                    )}
                  </div>

                  {report.studentAttended && report.studentPerformance && (
                    <div className="space-y-1 text-left">
                      <span className="text-xs text-muted-foreground block font-semibold">أداء الطالب في الحصة</span>
                      <div className="flex items-center gap-1 justify-end">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            fill={star <= (report.studentPerformance ?? 0) ? '#eab308' : 'none'}
                            className={star <= (report.studentPerformance ?? 0) ? 'text-yellow-500' : 'text-muted-foreground/30'}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Topics Covered */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-primary" />
                    المواضيع التي تم تغطيتها وشرحها
                  </span>
                  <div className="bg-accent/40 border border-border rounded-xl p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                    {report.topicsCovered}
                  </div>
                </div>

                {/* Homework */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    الواجبات المنزلية والمهام المقررة
                  </span>
                  <div className="bg-accent/40 border border-border rounded-xl p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                    {report.homeworkAssigned ? (
                      report.homeworkAssigned
                    ) : (
                      <span className="text-muted-foreground italic">لم يتم تحديد واجبات منزلية لهذه الحصة.</span>
                    )}
                  </div>
                </div>

                {/* Teacher Notes */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-primary" />
                    ملاحظات وتوصيات المعلم لولي الأمر
                  </span>
                  <div className="bg-accent/40 border border-border rounded-xl p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                    {report.teacherNotes ? (
                      report.teacherNotes
                    ) : (
                      <span className="text-muted-foreground italic">لا توجد ملاحظات إضافية من المعلم.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowViewReportModal(false)}
                  className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  إغلاق التقرير
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      <DetailsModal 
        isOpen={showDetailsModal} 
        onClose={() => setShowDetailsModal(false)} 
        entityType="booking" 
        entityId={booking.id} 
      />
    </div>
  );
}
