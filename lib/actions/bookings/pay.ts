'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, PaymentStatus, BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { createNotification } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

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

      // 2. تحديث حالة الدفع في جدول الحجز نفسه وتحويله لـ CONFIRMED وتوليد الرابط
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: BookingStatus.CONFIRMED,
          confirmedAt: new Date(),
          meetingUrl: booking.meetingUrl || `https://meet.jit.si/edunest-${crypto.randomUUID()}`,
        },
      });

      // 3. إرسال إشعار للمعلم بتأكيد الحجز الفوري
      const isImmediate = booking.startTime <= new Date(Date.now() + 5 * 60000);
      await createNotification({
        userId: booking.teacherService.teacher.userId,
        title: isImmediate ? 'الجلسة الفورية بدأت الآن! 🚨' : 'حجز جديد مؤكد! 🎉',
        message: isImmediate 
          ? 'لقد وافقت على الطلب وقام ولي الأمر بالدفع. الجلسة بدأت فوراً، ادخل الآن وتوجه لصفحة الحجوزات لتجد الرابط!'
          : 'قام ولي الأمر بدفع قيمة الحجز وتم تأكيده تلقائياً. يمكنك الآن الدخول وتجهيز الجلسة في موعدها.',
        link: '/dashboard/teacher/bookings',
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
