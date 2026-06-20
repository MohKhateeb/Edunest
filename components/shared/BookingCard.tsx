'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Booking, Student, TeacherService, ServiceType, Teacher, User, Payment, SessionReport } from '@prisma/client';
import { BOOKING_STATUS_AR, PAYMENT_STATUS_AR, PAYMENT_METHOD_AR } from '@/lib/translations';
import { formatLocalTime, formatPrice } from '@/lib/utils';
import { acceptBooking, rejectBooking, cancelBooking, submitSessionReport } from '@/lib/actions/booking';
import { submitReview } from '@/lib/actions/review';
import { Calendar, Clock, Video, User as UserIcon, BookOpen, FileText, Star, Lock, TimerOff, Eye, GraduationCap } from 'lucide-react';
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
    PENDING: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900',
    CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
    COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
    CANCELLED: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
  };

  const paymentStyles: Record<string, string> = {
    UNPAID: 'text-rose-600 dark:text-rose-400',
    PENDING_VERIFICATION: 'text-indigo-600 dark:text-indigo-400',
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
    <div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
      
      {/* 🔹 Top Row: Status & Price */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className={cn('text-[11px] font-bold px-3 py-1.5 rounded-full border', statusStyles[booking.status])}>
            {BOOKING_STATUS_AR[booking.status]}
          </span>
          {isTrial && (
            <span className="me-2 text-[10px] font-bold px-2 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900 mt-2 inline-block">
              جلسة تجريبية
            </span>
          )}
        </div>
        
        {/* السعر وحالة الدفع (مدمجة وبدون عناوين مزعجة) */}
        <div className="text-left flex flex-col items-end">
          <span className="text-xl font-black text-primary leading-none">{priceDisplay}</span>
          {!isTrial && (
            <span className={cn("text-[10px] mt-1.5 font-bold", paymentStyles[booking.paymentStatus])}>
              {PAYMENT_STATUS_AR[booking.paymentStatus]}
            </span>
          )}
        </div>
      </div>

      {/* 🔹 Middle: Core Info (Subject, Date, People) */}
      <div className="space-y-4 mb-5">
        
        {/* Subject & Duration */}
        <div>
          <h3 className="font-extrabold text-foreground text-base mb-1 line-clamp-1">
            {booking.teacherService.serviceType.name}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold">
            <Clock className="h-3.5 w-3.5" />
            <span>{booking.duration} دقيقة</span>
          </div>
        </div>

        {/* Date / Time */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-border/50">
          <div className="bg-white dark:bg-slate-700 p-2 rounded-xl shadow-sm border border-border/40">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <span className="font-black text-foreground text-sm">{formatLocalTime(booking.startTime)}</span>
        </div>

        {/* People (Teacher / Student) */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
          <div className="flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5 text-secondary" />
            <span>{role === 'TEACHER' ? booking.parent.name : booking.teacherService.teacher.user.name}</span>
          </div>
          <span className="w-1 h-1 bg-border rounded-full"></span>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            <span className="line-clamp-1">{booking.student.name}</span>
          </div>
        </div>
      </div>

      {/* 🔹 Bottom Row: Actions */}
      <div className="flex flex-wrap gap-2 mt-auto border-t border-border/40 pt-4">
        {/* The Meet link is the most prominent if active */}
        {booking.status === 'CONFIRMED' && sessionTimeState.status === 'active' && (
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 py-2.5 rounded-xl shadow-sm transition-transform hover:scale-105 animate-pulse"
          >
            <Video className="h-4 w-4" />
            انضم الآن
          </a>
        )}

        {/* View Details is secondary but always available */}
        <button
          onClick={() => setShowDetailsModal(true)}
          className={cn(
            "text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5",
            (booking.status === 'CONFIRMED' && sessionTimeState.status === 'active') 
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              : "flex-1 bg-primary/5 text-primary hover:bg-primary hover:text-white border border-primary/20 hover:border-primary"
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          التفاصيل
        </button>

        {/* Action icons based on role and status */}
        {role === 'TEACHER' && booking.status === 'PENDING' && (
          <div className="flex w-full gap-2 mt-2">
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 py-2.5 rounded-xl transition-colors"
            >
              رفض
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 text-xs font-bold bg-primary text-white hover:bg-primary/90 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              قبول
            </button>
          </div>
        )}

        {role === 'TEACHER' && booking.status === 'CONFIRMED' && (
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 py-2.5 rounded-xl transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            إنهاء ورفع التقرير
          </button>
        )}

        {role === 'PARENT' && booking.status === 'COMPLETED' && !booking.report && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 py-2.5 rounded-xl transition-colors"
          >
            <Star className="h-3.5 w-3.5" />
            تقييم المعلم
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
                        className="text-violet-500 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          size={32}
                          fill={star <= reviewForm.rating ? 'currentColor' : 'none'}
                          className="text-violet-500"
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
                            fill={star <= (report.studentPerformance ?? 0) ? 'currentColor' : 'none'}
                            className={star <= (report.studentPerformance ?? 0) ? 'text-violet-500' : 'text-muted-foreground/30'}
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
