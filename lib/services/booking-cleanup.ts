import { prisma } from '@/lib/prisma';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { createNotification } from '@/lib/notifications';

/**
 * دالة موحدة لتنظيف الجلسات المعلقة التي انتهى وقتها (Stale Bookings).
 * تحافظ على مبدأ DRY لكي نستخدمها في الـ Cron Job وفي التحميل اللحظي JIT.
 * والأهم: تحافظ على الأموال (Financial Safety) عبر إصدار رد مالي تلقائي إذا كانت الجلسة مدفوعة مسبقاً.
 *
 * @param teacherId - إذا تم توفيره، يتم التنظيف فقط لجلسات هذا المعلم. وإلا يتم التنظيف لكل النظام.
 * @returns number - عدد الجلسات التي تم إلغاؤها بنجاح.
 */
export async function processStaleBookingsCancellation(teacherId?: string): Promise<number> {
  const now = new Date();

  // 1. البحث عن كل الجلسات المعلقة التي مضى وقتها
  const staleBookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.PENDING,
      startTime: { lt: now },
      ...(teacherId && {
        teacherService: {
          teacherId,
        },
      }),
    },
    select: {
      id: true,
      parentUserId: true,
      price: true,
      paymentStatus: true,
      isTrial: true,
      payment: true,
    },
  });

  if (staleBookings.length === 0) return 0;

  let cancelledCount = 0;

  // 2. إلغاء الجلسات وحفظ الحقوق المالية داخل Transaction لكل جلسة لضمان عزل الأخطاء
  for (const booking of staleBookings) {
    try {
      await prisma.$transaction(async (tx) => {
        const isPaid = booking.paymentStatus === PaymentStatus.PAID && !booking.isTrial;

        // تحديث الحجز
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CANCELLED,
            cancellationReason: 'إلغاء تلقائي من النظام: انتهى وقت الجلسة ولم يتم تأكيدها.',
            cancelledAt: new Date(),
            paymentStatus: isPaid ? PaymentStatus.REFUNDED : booking.paymentStatus,
          },
        });

        // إذا كان مدفوعاً، أرجع المال (Refund)
        if (isPaid) {
          if (booking.payment) {
            await tx.payment.update({
              where: { bookingId: booking.id },
              data: { isPaid: false },
            });
          }

          await tx.parentRefund.create({
            data: {
              bookingId: booking.id,
              amount: booking.price,
              isPaid: false, // لم يتم إرجاعه للبنك فعلياً بعد، بل كأرصدة أو قيد المعالجة الإدارية
            },
          });
        }

        // إرسال إشعار لولي الأمر بالاعتذار
        await createNotification(
          {
            userId: booking.parentUserId,
            title: 'إلغاء حجز تلقائي',
            message: `نعتذر، لقد تم إلغاء جلستك تلقائياً نظراً لانتهاء وقتها دون تأكيد المعلم.${
              isPaid ? ' سيتم إرجاع المبلغ المدفوع لرصيدك في أقرب وقت.' : ''
            }`,
          },
          tx
        );
      });

      cancelledCount++;
    } catch (err) {
      console.error(`Failed to cancel stale booking ${booking.id}:`, err);
    }
  }

  return cancelledCount;
}
