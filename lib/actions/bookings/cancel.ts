'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, BookingStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { cancellationSchema } from '@/lib/validations/booking';
import { isValidTransition, getTransitionError } from '@/lib/utils/booking-state';
import { hoursUntil } from '@/lib/utils/time';
import { getSettingNumber } from '@/lib/settings';
import { createNotification } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function cancelBooking(data: z.infer<typeof cancellationSchema>): Promise<ActionResponse> {
  try {
    const { userId, userType } = await requireAuth([UserType.PARENT, UserType.TEACHER, UserType.ADMIN]);

    const validated = cancellationSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { bookingId, reason } = validated.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        teacherService: {
          include: { teacher: true },
        },
        parent: true,
      },
    });

    if (!booking) {
      return { success: false, error: 'الحجز غير موجود' };
    }

    // Verify auth context
    if (userType === UserType.PARENT && booking.parentUserId !== userId) {
      return { success: false, error: 'غير مصرح لك بإلغاء هذا الحجز' };
    }
    if (userType === UserType.TEACHER && booking.teacherService.teacher.userId !== userId) {
      return { success: false, error: 'غير مصرح لك بإلغاء هذا الحجز' };
    }

    if (!isValidTransition(booking.status, BookingStatus.CANCELLED)) {
      return { success: false, error: getTransitionError(booking.status, BookingStatus.CANCELLED) };
    }

    const isTrial = booking.isTrial;
    const isTeacherCancellation = userType === UserType.TEACHER;
    const isParentCancellation = userType === UserType.PARENT;

    // Refund policy checks
    let refundEligible = false;

    if (isTeacherCancellation || userType === UserType.ADMIN) {
      refundEligible = true;
    } else if (isParentCancellation) {
      const cancelHoursWindow = await getSettingNumber('CancellationRefundHours', 24);
      const hoursLeft = hoursUntil(booking.startTime);

      if (hoursLeft >= cancelHoursWindow) {
        const maxRefunds = await getSettingNumber('MaxRefundRequests', 2);
        if (booking.parent.refundRequestsCount < maxRefunds) {
          refundEligible = true;
        } else {
          // Exceeded limit -> mark for admin review (meaning cancelled but refund status requires admin decision)
          refundEligible = false;
        }
      } else {
        // Late cancellation -> no refund
        refundEligible = false;
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update booking fields
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledBy: userId,
          cancelledAt: new Date(),
          cancellationReason: reason,
          paymentStatus: !isTrial && refundEligible && booking.paymentStatus === PaymentStatus.PAID
            ? PaymentStatus.REFUNDED
            : booking.paymentStatus,
        },
      });

      // 2. Update Payment table if refund is eligible and it is not a trial and was paid
      if (!isTrial && refundEligible && booking.paymentStatus === PaymentStatus.PAID) {
        await tx.payment.update({
          where: { bookingId },
          data: { isPaid: false },
        });
      }

      // 3. Increment refundRequestsCount for parents if they cancelled within time window
      if (isParentCancellation && refundEligible) {
        await tx.user.update({
          where: { id: booking.parentUserId },
          data: {
            refundRequestsCount: { increment: 1 },
          },
        });
      }

      // 4. Send Notifications
      if (userType === UserType.ADMIN) {
        // Notify both parent and teacher if admin cancelled
        await createNotification({
          userId: booking.parentUserId,
          title: 'إلغاء الجلسة من الإدارة',
          message: `قامت إدارة المنصة بإلغاء الجلسة. السبب: ${reason}`,
        }, tx);

        await createNotification({
          userId: booking.teacherService.teacher.userId,
          title: 'إلغاء الجلسة من الإدارة',
          message: `قامت إدارة المنصة بإلغاء الجلسة. السبب: ${reason}`,
        }, tx);
      } else {
        // Notify the counterpart if parent or teacher cancelled
        const recipientId = isParentCancellation
          ? booking.teacherService.teacher.userId
          : booking.parentUserId;

        await createNotification({
          userId: recipientId,
          title: 'إلغاء حجز الجلسة',
          message: `تم إلغاء الجلسة من قبل الطرف الآخر. السبب: ${reason}`,
        }, tx);
      }
    });

    revalidatePath('/dashboard/parent/bookings');
    revalidatePath('/dashboard/teacher/bookings');
    revalidatePath('/dashboard/admin/bookings');

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء إلغاء الحجز';
    return { success: false, error: msg };
  }
}
