'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { draftPayoutSchema, payoutIdSchema } from '@/lib/validations/payout';

export async function calculateDraftPayout(
  teacherId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ActionResponse<{
  bookingCount: number;
  totalAmount: number;
  commissionAmount: number;
  trialCompensation: number;
  netAmount: number;
}>> {
  try {
    const validated = draftPayoutSchema.safeParse({ teacherId, periodStart, periodEnd });
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { userId, userType } = await requireAuth([UserType.ADMIN, UserType.TEACHER]);

    if (userType === UserType.TEACHER) {
      const teacherProfile = await prisma.teacher.findUnique({
        where: { userId },
      });
      if (!teacherProfile || teacherProfile.id !== teacherId) {
        return { success: false, error: 'غير مصرح لك بالاطلاع على مسودة تسوية خاصة بمعلم آخر.' };
      }
    }

    // Fetch eligible bookings: COMPLETED, not yet paid to tutor, and within period
    const bookings = await prisma.booking.findMany({
      where: {
        teacherService: {
          teacherId,
        },
        status: 'COMPLETED',
        payoutId: null,
        startTime: {
          gte: periodStart,
          lte: periodEnd,
        },
        OR: [
          // Either it is paid by parent
          { paymentStatus: 'PAID' },
          // Or it is a free trial (which doesn't require parent payment but is compensated by platform)
          { isTrial: true },
        ],
      },
    });

    let totalAmount = 0;
    let commissionAmount = 0;
    let trialCompensation = 0;

    for (const b of bookings) {
      const price = Number(b.price);
      if (b.isTrial) {
        trialCompensation += Number(b.trialCostToPlatform);
      } else {
        totalAmount += price;
        const commRate = Number(b.appliedCommissionRate);
        commissionAmount += (price * commRate) / 100;
      }
    }

    const netAmount = totalAmount - commissionAmount + trialCompensation;

    return {
      success: true,
      data: {
        bookingCount: bookings.length,
        totalAmount,
        commissionAmount,
        trialCompensation,
        netAmount,
      },
    };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ أثناء احتساب المستحقات' };
  }
}

export async function createTeacherPayout(data: {
  teacherId: string;
  periodStart: Date;
  periodEnd: Date;
}): Promise<ActionResponse> {
  try {
    const validated = draftPayoutSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await requireAuth([UserType.ADMIN]);
    const { teacherId, periodStart, periodEnd } = data;

    // Run in transaction to link bookings and create payout
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT id FROM "Teacher" WHERE id = ${teacherId} FOR UPDATE`;

      // 1. Fetch the bookings to include
      const bookings = await tx.booking.findMany({
        where: {
          teacherService: {
            teacherId,
          },
          status: 'COMPLETED',
          payoutId: null,
          startTime: {
            gte: periodStart,
            lte: periodEnd,
          },
          OR: [
            { paymentStatus: 'PAID' },
            { isTrial: true },
          ],
        },
      });

      if (bookings.length === 0) {
        throw new Error('لا توجد حجوزات مستحقة للدفع في هذه الفترة');
      }

      let totalAmount = 0;
      let commissionAmount = 0;
      let trialCompensation = 0;

      for (const b of bookings) {
        const price = Number(b.price);
        if (b.isTrial) {
          trialCompensation += Number(b.trialCostToPlatform);
        } else {
          totalAmount += price;
          const commRate = Number(b.appliedCommissionRate);
          commissionAmount += (price * commRate) / 100;
        }
      }

      const netAmount = totalAmount - commissionAmount + trialCompensation;

      // 2. Create the Payout record
      const payout = await tx.teacherPayout.create({
        data: {
          teacherId,
          totalAmount,
          commissionAmount,
          trialCompensation,
          netAmount,
          periodStart,
          periodEnd,
          isPaid: false,
        },
      });

      // 3. Link all included bookings to this payoutId
      await tx.booking.updateMany({
        where: {
          id: {
            in: bookings.map((b) => b.id),
          },
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
