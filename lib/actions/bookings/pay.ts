'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, PaymentStatus, BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { createNotification } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';

export async function processPayment(bookingId: string): Promise<ActionResponse> {
  try {
    const { userId } = await requireAuth([UserType.PARENT]);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        teacherService: {
          include: { teacher: true },
        },
      },
    });

    if (!booking || booking.parentUserId !== userId) {
      return { success: false, error: 'الحجز غير موجود أو لا تملك صلاحية الدفع له' };
    }

    if (booking.status !== BookingStatus.PENDING) {
      return { success: false, error: 'لا يمكن الدفع لحجز غير معلق' };
    }

    if (booking.paymentStatus !== PaymentStatus.UNPAID) {
      return { success: false, error: 'هذا الحجز ليس بحالة انتظار الدفع' };
    }

    // Artificial delay to simulate network request for mock payment
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await prisma.$transaction(async (tx) => {
      // 1. تحديث جدول Payment (إن وجد) أو إنشاؤه إذا لم يكن موجوداً
      if (booking.payment) {
        await tx.payment.update({
          where: { bookingId },
          data: {
            isPaid: true,
            paidAt: new Date(),
          },
        });
      } else {
        await tx.payment.create({
          data: {
            bookingId,
            amount: booking.price,
            method: 'ONLINE_CARD',
            isPaid: true,
            paidAt: new Date(),
          },
        });
      }

      // 2. تحديث حالة الدفع في جدول الحجز نفسه
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: PaymentStatus.PAID,
        },
      });

      // 3. إرسال إشعار للمعلم بأنه يمكنه الآن الموافقة
      await createNotification({
        userId: booking.teacherService.teacher.userId,
        title: 'تم دفع قيمة الحجز 💳',
        message: 'قام ولي الأمر بدفع قيمة الحجز المعلق، يمكنك الآن الدخول وتأكيد الحجز وبدء الجلسة في موعدها.',
      }, tx);
    });

    revalidatePath('/dashboard/parent/bookings');
    revalidatePath('/dashboard/teacher/bookings');

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ غير متوقع أثناء معالجة الدفع' };
  }
}
