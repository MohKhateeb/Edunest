'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType } from '@prisma/client';
import { requireTeacherProfile } from '@/lib/actions/auth-helpers';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { createPayoutSchema, payoutIdSchema } from '@/lib/validations/payout';
import { calculateEarnings } from '@/lib/utils/financial';

export async function getPendingPayoutBookingsForTeacher(teacherId: string) {
  try {
    const { userId, userType } = await requireAuth([UserType.ADMIN, UserType.TEACHER]);
    
    // Security Check: IDOR prevention
    if (userType === 'TEACHER') {
      const teacherProfile = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacherProfile || teacherProfile.id !== teacherId) {
        throw new Error('غير مصرح لك باستعراض بيانات معلم آخر');
      }
    }

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    let bookings = await prisma.booking.findMany({
      where: {
        teacherService: { teacherId },
        status: 'COMPLETED',
        payoutId: null,
        completedAt: { lte: twentyFourHoursAgo },
        OR: [{ paymentStatus: 'PAID' }, { isTrial: true }],
      },
      include: {
        dispute: true,
        student: { select: { name: true } },
        teacherService: { include: { serviceType: { select: { name: true } } } }
      },
      orderBy: { startTime: 'asc' },
    });

    const filteredBookings = bookings.filter((b) => {
      if (!b.dispute) return true;
      if (b.dispute.status === 'RESOLVED_IN_FAVOR_OF_TEACHER') return true;
      return false;
    });

    return { success: true, data: filteredBookings };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ أثناء جلب الجلسات المستحقة' };
  }
}

export async function createTeacherPayout(data: {
  teacherId: string;
  bookingIds: string[];
}): Promise<ActionResponse> {
  try {
    const validated = createPayoutSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await requireAuth([UserType.ADMIN]);
    const { teacherId, bookingIds } = data;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT id FROM "Teacher" WHERE id = ${teacherId} FOR UPDATE`;

      // Fetch the selected bookings to verify they belong to the teacher and are eligible
      const bookings = await tx.booking.findMany({
        where: {
          id: { in: bookingIds },
          teacherService: { teacherId },
          status: 'COMPLETED',
          payoutId: null,
          OR: [{ paymentStatus: 'PAID' }, { isTrial: true }],
        },
      });

      if (bookings.length !== bookingIds.length) {
        throw new Error('بعض الجلسات المحددة غير صالحة للتسوية أو تم تسويتها مسبقاً.');
      }

      let totalAmount = 0;
      let commissionAmount = 0;
      let trialCompensation = 0;
      let minStartTime = bookings[0].startTime;
      let maxStartTime = bookings[0].startTime;

      for (const b of bookings) {
        if (b.startTime < minStartTime) minStartTime = b.startTime;
        if (b.startTime > maxStartTime) maxStartTime = b.startTime;

        const earnings = calculateEarnings(
          b.price,
          b.appliedCommissionRate,
          b.isTrial,
          b.trialCostToPlatform
        );

        totalAmount += earnings.totalAmount;
        commissionAmount += earnings.commissionAmount;
        trialCompensation += earnings.trialCompensation;
      }

      const netAmount = Math.round((totalAmount - commissionAmount) * 100) / 100;

      // Create the Payout record
      const payout = await tx.teacherPayout.create({
        data: {
          teacherId,
          totalAmount,
          commissionAmount,
          trialCompensation,
          netAmount,
          periodStart: minStartTime,
          periodEnd: maxStartTime,
          isPaid: false,
        },
      });

      // Link all included bookings to this payoutId
      await tx.booking.updateMany({
        where: {
          id: { in: bookingIds },
        },
        data: {
          payoutId: payout.id,
        },
      });
    });

    revalidatePath('/dashboard/admin/payouts');
    revalidatePath('/dashboard/teacher/earnings');

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء إصدار التسوية';
    return { success: false, error: msg };
  }
}

export async function markPayoutAsPaid(payoutId: string): Promise<ActionResponse> {
  try {
    const validated = payoutIdSchema.safeParse({ payoutId });
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await requireAuth([UserType.ADMIN]);

    const payout = await prisma.teacherPayout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      return { success: false, error: 'التسوية المالية المطلوبة غير موجودة' };
    }

    if (payout.isPaid) {
      return { success: false, error: 'هذه التسوية مدفوعة بالفعل مسبقاً' };
    }

    await prisma.teacherPayout.update({
      where: { id: payoutId },
      data: {
        isPaid: true,
        paidAt: new Date(),
      },
    });

    revalidatePath('/dashboard/admin/payouts');
    revalidatePath('/dashboard/teacher/earnings');

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ أثناء تحديث حالة الدفع' };
  }
}

export async function markParentRefundAsPaid(refundId: string): Promise<ActionResponse> {
  try {
    const validated = payoutIdSchema.safeParse({ payoutId: refundId });
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await requireAuth([UserType.ADMIN]);

    const refund = await prisma.parentRefund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      return { success: false, error: 'عملية الاسترداد غير موجودة' };
    }

    if (refund.isPaid) {
      return { success: false, error: 'تم تحويل مبلغ الاسترداد مسبقاً' };
    }

    await prisma.parentRefund.update({
      where: { id: refundId },
      data: {
        isPaid: true,
        paidAt: new Date(),
      },
    });

    revalidatePath('/dashboard/admin/payouts');
    revalidatePath('/dashboard/parent/financials');

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ أثناء تحديث حالة الاسترداد' };
  }
}
