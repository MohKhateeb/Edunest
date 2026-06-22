'use server';

import crypto from 'crypto';
import { requireAuth } from '@/lib/require-auth';
import { UserType, BookingStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { isValidTransition, getTransitionError } from '@/lib/utils/booking-state';
import { createNotification } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';

export async function acceptBooking(bookingId: string): Promise<ActionResponse> {
  try {
    const { userId } = await requireAuth([UserType.TEACHER]);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        teacherService: {
          include: { teacher: true },
        },
        payment: true,
      },
    });

    if (!booking || booking.teacherService.teacher.userId !== userId) {
      return { success: false, error: 'الحجز غير موجود أو غير تابع لك' };
    }

    if (!isValidTransition(booking.status, BookingStatus.CONFIRMED)) {
      return { success: false, error: getTransitionError(booking.status, BookingStatus.CONFIRMED) };
    }

    if (
      booking.paymentStatus === PaymentStatus.UNPAID &&
      !booking.isTrial
    ) {
      return { success: false, error: 'لا يمكن تأكيد الجلسة قبل إتمام الدفع أو تحقق الإدارة من إيصال التحويل' };
    }

    await prisma.$transaction(async (tx) => {
      const meetingUrl = booking.meetingUrl || `https://meet.jit.si/edunest-${crypto.randomUUID()}`;

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          confirmedAt: new Date(),
          meetingUrl,
        },
      });

      await createNotification({
        userId: booking.parentUserId,
        title: 'قبول الحجز',
        message: 'لقد وافق المعلم على طلب حجز الجلسة بنجاح.',
      }, tx);
    });

    revalidatePath('/dashboard/teacher/bookings');
    revalidatePath('/dashboard/parent/bookings');

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ أثناء قبول الحجز' };
  }
}
