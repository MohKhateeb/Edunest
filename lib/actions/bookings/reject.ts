'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, BookingStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { isValidTransition, getTransitionError } from '@/lib/utils/booking-state';
import { createNotification } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';

export async function rejectBooking(bookingId: string): Promise<ActionResponse> {
  try {
    const { userId } = await requireAuth([UserType.TEACHER]);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        teacherService: {
          include: { teacher: true },
        },
      },
    });

    if (!booking || booking.teacherService.teacher.userId !== userId) {
      return { success: false, error: 'الحجز غير موجود أو غير تابع لك' };
    }

    if (!isValidTransition(booking.status, BookingStatus.REJECTED)) {
      return { success: false, error: getTransitionError(booking.status, BookingStatus.REJECTED) };
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.REJECTED,
        },
      });

      // If it was paid, queue for manual admin refund or handle appropriately
      if (booking.paymentStatus === PaymentStatus.PAID && !booking.isTrial) {
        await tx.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: PaymentStatus.REFUNDED },
        });

        // Toggle payment status
        await tx.payment.update({
          where: { bookingId },
          data: { isPaid: false },
        });
      }

      await createNotification({
        userId: booking.parentUserId,
        title: 'رفض الحجز',
        message: 'نعتذر، لقد قام المعلم برفض طلب الحجز الخاص بك.',
      }, tx);
    });

    revalidatePath('/dashboard/teacher/bookings');
    revalidatePath('/dashboard/parent/bookings');

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ أثناء رفض الحجز' };
  }
}
