'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { reportSchema } from '@/lib/validations/booking';
import { isValidTransition, getTransitionError, canSubmitReport } from '@/lib/utils/booking-state';
import { createNotification } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function submitSessionReport(data: z.infer<typeof reportSchema>): Promise<ActionResponse> {
  try {
    const { userId } = await requireAuth([UserType.TEACHER]);

    const validated = reportSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const {
      bookingId,
      studentAttended,
      topicsCovered,
      studentPerformance,
      homeworkAssigned,
      teacherNotes,
    } = validated.data;

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

    if (!isValidTransition(booking.status, BookingStatus.COMPLETED)) {
      return { success: false, error: getTransitionError(booking.status, BookingStatus.COMPLETED) };
    }

    if (!canSubmitReport(booking.startTime, booking.duration)) {
      return { success: false, error: 'لا يمكن تقديم التقرير قبل انتهاء وقت الجلسة الفعلي' };
    }

    // Save report and mark booking COMPLETED in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create session report
      await tx.sessionReport.create({
        data: {
          bookingId,
          studentAttended,
          topicsCovered,
          studentPerformance,
          homeworkAssigned,
          teacherNotes,
        },
      });

      // 2. Mark booking completed
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Increment teacher total sessions completed
      await tx.teacher.update({
        where: { id: booking.teacherService.teacherId },
        data: {
          totalSessions: { increment: 1 },
        },
      });

      // 3. Notify parent with report details
      await createNotification({
        userId: booking.parentUserId,
        title: 'تقرير الجلسة التعليمية جاهز',
        message: `قام المعلم برفع تقرير الحصة للطالب. يرجى مراجعة تفاصيل الجلسة.`,
      }, tx);
    });

    revalidatePath('/dashboard/teacher/bookings');
    revalidatePath('/dashboard/parent/bookings');

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء رفع التقرير وحفظ الجلسة';
    return { success: false, error: msg };
  }
}
