'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Calendar, User, CreditCard, Eye, Video, FileText, Star 
} from 'lucide-react';
import { cn, formatPrice, formatLocalTime } from '@/lib/utils';
import { BOOKING_STATUS_AR, PAYMENT_STATUS_AR, PAYMENT_METHOD_AR } from '@/lib/translations';

interface BookingDetailsProps {
  booking: any;
  setPreviewImage: (url: string) => void;
}

export default function BookingDetails({ booking, setPreviewImage }: BookingDetailsProps) {
  const isTrial = booking.isTrial;
  const priceDisplay = isTrial ? 'جلسة تجريبية مجانية' : formatPrice(Number(booking.price));

  return (
    <div className="space-y-6 text-xs text-muted-foreground">
      {/* Booking Header Overview */}
      <div className="p-5 bg-gradient-to-br from-primary/10 to-accent/20 border border-primary/15 rounded-2xl flex justify-between items-center flex-wrap gap-4">
        <div>
          <span className="text-[10px] text-muted-foreground block font-mono">رقم الحجز: #{booking.id.toUpperCase()}</span>
          <h3 className="text-base font-extrabold text-foreground mt-0.5">
            {booking.teacherService.serviceType.name}
          </h3>
        </div>
        <div className="flex gap-2">
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-bold border",
            booking.status === 'CONFIRMED' && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800",
            booking.status === 'PENDING' && "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800",
            booking.status === 'COMPLETED' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800",
            booking.status === 'CANCELLED' && "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
            booking.status === 'REJECTED' && "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800"
          )}>
            {BOOKING_STATUS_AR[booking.status as keyof typeof BOOKING_STATUS_AR]}
          </span>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scheduled Info */}
        <div className="p-4 border border-border bg-card rounded-xl space-y-3">
          <h4 className="font-extrabold text-sm border-b border-border/50 pb-1.5 flex items-center gap-1 text-primary">
            <Calendar className="h-4 w-4" />
            توقيت وتكلفة الجلسة
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>تاريخ ووقت البدء:</span>
              <strong className="text-foreground">{formatLocalTime(booking.startTime)}</strong>
            </div>
            <div className="flex justify-between">
              <span>مدة الحصة:</span>
              <strong className="text-foreground">{booking.duration} دقيقة</strong>
            </div>
            <div className="flex justify-between">
              <span>التكلفة الإجمالية:</span>
              <strong className="text-foreground text-sm text-primary font-extrabold">{priceDisplay}</strong>
            </div>
            {booking.bookingSource && (
              <div className="flex justify-between">
                <span>مصدر الحجز:</span>
                <strong className="text-foreground">{booking.bookingSource === 'ADMIN' ? 'إداري' : 'الويب'}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Client & Tutor Info */}
        <div className="p-4 border border-border bg-card rounded-xl space-y-3">
          <h4 className="font-extrabold text-sm border-b border-border/50 pb-1.5 flex items-center gap-1 text-primary">
            <User className="h-4 w-4" />
            أطراف الجلسة التعليمية
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>الطالب المستفيد:</span>
              <strong className="text-foreground">{booking.student.name} (الصف {booking.student.grade})</strong>
            </div>
            <div className="flex justify-between">
              <span>ولي الأمر:</span>
              <strong className="text-foreground">{booking.parent.name}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>المعلم الخصوصي:</span>
              <div className="flex items-center gap-2">
                <div className="relative h-6 w-6 rounded-full overflow-hidden bg-accent border border-border flex-shrink-0">
                  {booking.teacherService.teacher.profileImageUrl ? (
                    <img
                      src={booking.teacherService.teacher.profileImageUrl}
                      alt={booking.teacherService.teacher.user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-primary font-bold text-[10px] bg-primary/10">
                      {booking.teacherService.teacher.user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <strong className="text-foreground">{booking.teacherService.teacher.user.name}</strong>
              </div>
            </div>
            {booking.parent.phone && (
              <div className="flex justify-between">
                <span>رقم هاتف ولي الأمر:</span>
                <strong className="text-foreground">{booking.parent.phone}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Information */}
      {!isTrial && (
        <div className="p-4 border border-border bg-card rounded-xl space-y-3">
          <h4 className="font-extrabold text-sm border-b border-border/50 pb-1.5 flex items-center gap-1 text-primary">
            <CreditCard className="h-4 w-4" />
            حالة الدفع وتأكيد الرسوم
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>حالة التحويل:</span>
                <strong className={cn(
                  "font-bold",
                  booking.paymentStatus === 'PAID' && "text-emerald-600",
                  booking.paymentStatus === 'PENDING_VERIFICATION' && "text-yellow-600",
                  booking.paymentStatus === 'UNPAID' && "text-rose-600"
                )}>
                  {PAYMENT_STATUS_AR[booking.paymentStatus as keyof typeof PAYMENT_STATUS_AR]}
                </strong>
              </div>
              {booking.payment?.method && (
                <div className="flex justify-between">
                  <span>طريقة التحويل:</span>
                  <strong className="text-foreground">{PAYMENT_METHOD_AR[booking.payment.method as keyof typeof PAYMENT_METHOD_AR]}</strong>
                </div>
              )}
              {booking.payment?.paidAt && (
                <div className="flex justify-between">
                  <span>تاريخ تأكيد التحويل:</span>
                  <strong className="text-foreground">{new Date(booking.payment.paidAt).toLocaleDateString('ar-EG')}</strong>
                </div>
              )}
            </div>

            {/* Receipt Proof (Admin and Parent Only) */}
            {booking.payment?.bankTransferProofUrl && (
              <div className="border border-border rounded-xl p-2 bg-accent/10 flex justify-between items-center gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-[10px] text-foreground block">إيصال التحويل المرفق:</span>
                  <button
                    onClick={() => setPreviewImage(booking.payment.bankTransferProofUrl)}
                    className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    عرض وتكبير الصورة
                  </button>
                </div>
                <div 
                  onClick={() => setPreviewImage(booking.payment.bankTransferProofUrl)}
                  className="h-12 w-16 relative border border-border rounded overflow-hidden cursor-zoom-in bg-black/10 flex-shrink-0"
                >
                  <Image 
                    src={booking.payment.bankTransferProofUrl} 
                    alt="Receipt thumbnail" 
                    fill 
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Meeting URL */}
      {booking.status === 'CONFIRMED' && (
        <div className="p-4 border border-border bg-card rounded-xl space-y-2">
          <span className="font-bold text-primary block text-[11px]">رابط القاعة الافتراضية (Jitsi Meet):</span>
          <div className="flex items-center justify-between gap-4 flex-wrap bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/40 p-3 rounded-lg">
            <span className="text-[11px] text-emerald-800 dark:text-emerald-400">القاعة الافتراضية جاهزة وتفتح للتحضير قبل الجلسة بخمس دقائق.</span>
            <a 
              href={booking.meetingUrl || `https://meet.jit.si/edunest-${booking.id}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"
            >
              <Video className="h-3.5 w-3.5" />
              انضم للجلسة (قاعة ويب)
            </a>
          </div>
        </div>
      )}

      {/* Notes Box */}
      {(booking.parentNotes || booking.teacherNotes || booking.cancellationReason) && (
        <div className="space-y-3">
          {booking.parentNotes && (
            <div className="p-4 border border-border bg-accent/20 rounded-xl">
              <span className="font-bold text-foreground/80 block mb-1">ملاحظات حجز ولي الأمر:</span>
              <p className="text-foreground/75 leading-relaxed italic">"{booking.parentNotes}"</p>
            </div>
          )}
          {booking.teacherNotes && (
            <div className="p-4 border border-border bg-accent/20 rounded-xl">
              <span className="font-bold text-foreground/80 block mb-1">ملاحظات المعلم:</span>
              <p className="text-foreground/75 leading-relaxed italic">"{booking.teacherNotes}"</p>
            </div>
          )}
          {booking.cancellationReason && (
            <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-xl text-destructive">
              <span className="font-bold block mb-1 text-xs">سبب إلغاء الجلسة:</span>
              <p className="leading-relaxed italic">"{booking.cancellationReason}"</p>
            </div>
          )}
        </div>
      )}

      {/* Completed Session Report Details */}
      {booking.status === 'COMPLETED' && booking.report && (
        <div className="p-5 border border-primary/20 bg-primary/5 rounded-xl space-y-4">
          <h4 className="font-extrabold text-sm border-b border-primary/10 pb-2 text-primary flex items-center gap-1">
            <FileText className="h-4.5 w-4.5" />
            تقرير انتهاء الجلسة التعليمية المرفوع
          </h4>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-card border border-border p-3 rounded-lg">
              <div>
                <span className="text-muted-foreground block text-[10px]">حضور الطالب:</span>
                <strong className={booking.report.studentAttended ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                  {booking.report.studentAttended ? '✓ حضر الجلسة' : '✗ غاب عن الجلسة'}
                </strong>
              </div>
              {booking.report.studentAttended && booking.report.studentPerformance && (
                <div className="text-left">
                  <span className="text-muted-foreground block text-[10px]">تقييم أداء الطالب:</span>
                  <div className="flex justify-end items-center gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((s: number) => (
                      <Star 
                        key={s} 
                        size={12} 
                        fill={s <= booking.report.studentPerformance ? '#eab308' : 'none'} 
                        className={s <= booking.report.studentPerformance ? 'text-yellow-500' : 'text-muted-foreground/35'}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <span className="font-bold text-foreground/80 block mb-1">المواضيع والدروس التي تم شرحها:</span>
              <p className="bg-card border border-border p-3 rounded-lg text-foreground/75 leading-relaxed whitespace-pre-wrap">
                {booking.report.topicsCovered}
              </p>
            </div>

            {booking.report.homeworkAssigned && (
              <div>
                <span className="font-bold text-foreground/80 block mb-1">الواجبات والتدريبات المنزلية المقررة:</span>
                <p className="bg-card border border-border p-3 rounded-lg text-foreground/75 leading-relaxed whitespace-pre-wrap">
                  {booking.report.homeworkAssigned}
                </p>
              </div>
            )}

            {booking.report.teacherNotes && (
              <div>
                <span className="font-bold text-foreground/80 block mb-1">توصيات وملاحظات المعلم للأهالي:</span>
                <p className="bg-card border border-border p-3 rounded-lg text-foreground/75 leading-relaxed whitespace-pre-wrap">
                  {booking.report.teacherNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Info */}
      {booking.status === 'COMPLETED' && booking.review && (
        <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-xl space-y-2">
          <span className="font-bold text-yellow-600 dark:text-yellow-400 block text-xs">تقييم ولي الأمر للمعلم:</span>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((s: number) => (
              <Star 
                key={s} 
                size={14} 
                fill={s <= booking.review.rating ? '#eab308' : 'none'} 
                className={s <= booking.review.rating ? 'text-yellow-500' : 'text-muted-foreground/35'}
              />
            ))}
            <span className="text-[10px] text-muted-foreground me-2">({booking.review.rating} من 5)</span>
          </div>
          {booking.review.comment && (
            <p className="text-foreground/75 italic leading-relaxed pt-1">"{booking.review.comment}"</p>
          )}
        </div>
      )}
    </div>
  );
}
