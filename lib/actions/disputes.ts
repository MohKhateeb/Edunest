'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, DisputeStatus, BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';
import { hoursUntil } from '@/lib/utils/time';

const createDisputeSchema = z.object({
  bookingId: z.string().min(1, 'معرف الحجز مطلوب'),
  reason: z.string().min(10, 'سبب الاعتراض يجب أن يكون 10 أحرف على الأقل').max(1000, 'السبب طويل جداً'),
});

const sendMessageSchema = z.object({
  disputeId: z.string().min(1, 'معرف النزاع مطلوب'),
  message: z.string().min(1, 'الرسالة لا يمكن أن تكون فارغة').max(2000, 'الرسالة طويلة جداً'),
});

const resolveDisputeSchema = z.object({
  disputeId: z.string().min(1, 'معرف النزاع مطلوب'),
  decision: z.enum(['RESOLVED_IN_FAVOR_OF_PARENT', 'RESOLVED_IN_FAVOR_OF_TEACHER']),
  adminNotes: z.string().optional(),
});

export async function createDispute(data: z.infer<typeof createDisputeSchema>): Promise<ActionResponse> {
  try {
    const validated = createDisputeSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { userId } = await requireAuth([UserType.PARENT]);
    const { bookingId, reason } = validated.data;

    // 1. Verify booking ownership and status
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        dispute: true,
        teacherService: {
          include: { teacher: true },
        },
      },
    });

    if (!booking || booking.parentUserId !== userId) {
      return { success: false, error: 'الحجز غير موجود أو لا تملك صلاحية الوصول إليه.' };
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      return { success: false, error: 'لا يمكن تقديم اعتراض إلا على الحجوزات المكتملة.' };
    }

    if (booking.payoutId) {
      return { success: false, error: 'تم تسوية هذا الحجز مالياً مسبقاً ولا يمكن الاعتراض عليه الآن.' };
    }

    if (booking.dispute) {
      return { success: false, error: 'يوجد اعتراض مسبق على هذا الحجز.' };
    }

    // 2. Strict Date Validation: Only within 24 hours of completion
    if (!booking.completedAt) {
      return { success: false, error: 'تاريخ اكتمال الجلسة غير متوفر.' };
    }

    // hoursUntil returns (completedAt - now) in hours. It should be negative since completed in past.
    // So if it was completed 25 hours ago, hoursUntil is -25.
    // If it was completed 2 hours ago, hoursUntil is -2.
    // We want to allow if hoursUntil >= -24 (i.e. within the last 24h)
    if (hoursUntil(booking.completedAt) < -24) {
      return { success: false, error: 'انتهت فترة السماح (24 ساعة) لتقديم اعتراض على هذه الجلسة.' };
    }

    // 3. Create Dispute and first message
    await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: {
          bookingId,
          parentUserId: userId,
          reason,
          status: DisputeStatus.OPEN,
        },
      });

      await tx.disputeMessage.create({
        data: {
          disputeId: dispute.id,
          senderId: userId,
          message: `[رسالة النظام - فتح الاعتراض]: ${reason}`,
        },
      });

      // Send notifications to Admin and Teacher
      await createNotification({
        userId: booking.teacherService.teacher.userId,
        title: 'اعتراض جديد ⚠️',
        message: 'قام ولي الأمر برفع اعتراض على جلستك الأخيرة. تم تجميد مستحقات الجلسة مؤقتاً.',
      }, tx);
    });

    revalidatePath('/dashboard/parent/financials');
    revalidatePath('/dashboard/teacher/earnings');
    revalidatePath('/dashboard/admin/financials');

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ أثناء تقديم الاعتراض' };
  }
}

export async function sendDisputeMessage(data: z.infer<typeof sendMessageSchema>): Promise<ActionResponse> {
  try {
    const validated = sendMessageSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { userId, userType } = await requireAuth([UserType.PARENT, UserType.TEACHER, UserType.ADMIN]);
    const { disputeId, message } = validated.data;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            teacherService: { include: { teacher: true } },
          },
        },
      },
    });

    if (!dispute) {
      return { success: false, error: 'النزاع غير موجود.' };
    }

    if (dispute.status !== DisputeStatus.OPEN) {
      return { success: false, error: 'المحادثة مغلقة للنزاعات التي تم البت فيها (للقراءة فقط).' };
    }

    // Verify access
    if (userType === UserType.PARENT && dispute.parentUserId !== userId) {
      return { success: false, error: 'غير مصرح.' };
    }
    if (userType === UserType.TEACHER && dispute.booking.teacherService.teacher.userId !== userId) {
      return { success: false, error: 'غير مصرح.' };
    }

    await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: userId,
        message,
      },
    });

    revalidatePath(`/dashboard/admin/disputes/${disputeId}`);

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ أثناء إرسال الرسالة' };
  }
}

export async function resolveDispute(data: z.infer<typeof resolveDisputeSchema>): Promise<ActionResponse> {
  try {
    const validated = resolveDisputeSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { userId } = await requireAuth([UserType.ADMIN]);
    const { disputeId, decision, adminNotes } = validated.data;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: { payment: true, teacherService: { include: { teacher: true } } },
        },
      },
    });

    if (!dispute) {
      return { success: false, error: 'النزاع غير موجود.' };
    }

    if (dispute.status !== DisputeStatus.OPEN) {
      return { success: false, error: 'تم البت في هذا النزاع مسبقاً.' };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update dispute status
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: decision as DisputeStatus,
          resolvedAt: new Date(),
          resolvedBy: userId,
          adminNotes,
        },
      });

      // 2. Log message
      await tx.disputeMessage.create({
        data: {
          disputeId,
          senderId: userId,
          message: `[رسالة إدارية - إغلاق النزاع]: تم إغلاق النزاع وحله بناءً على القرار الإداري.\nملاحظات الإدارة: ${adminNotes || 'لا يوجد'}`,
        },
      });

      // 3. Update payment logic if resolved in favor of parent
      if (decision === 'RESOLVED_IN_FAVOR_OF_PARENT') {
        // Simulating refund by marking payment as REFUNDED
        await tx.booking.update({
          where: { id: dispute.bookingId },
          data: { paymentStatus: 'REFUNDED' },
        });

        if (dispute.booking.payment) {
            await tx.payment.update({
              where: { bookingId: dispute.bookingId },
              data: { isPaid: false },
            });
        }
      }

      // Notifications
      await createNotification({
        userId: dispute.parentUserId,
        title: 'قرار بشأن اعتراضك',
        message: decision === 'RESOLVED_IN_FAVOR_OF_PARENT' ? 'تم حل الاعتراض لصالحك وجاري إرجاع المبلغ.' : 'تم رفض الاعتراض بعد المراجعة. راجع المحادثة للتفاصيل.',
      }, tx);

      await createNotification({
        userId: dispute.booking.teacherService.teacher.userId,
        title: 'إغلاق النزاع المالي',
        message: decision === 'RESOLVED_IN_FAVOR_OF_TEACHER' ? 'تم الحكم بصالحك في النزاع الأخير، وسيضاف الرصيد لدفعاتك القادمة.' : 'تم قبول اعتراض ولي الأمر واسترداد مبلغ الجلسة.',
      }, tx);
    });

    revalidatePath(`/dashboard/admin/disputes/${disputeId}`);
    revalidatePath('/dashboard/admin/financials');
    revalidatePath('/dashboard/parent/financials');
    revalidatePath('/dashboard/teacher/earnings');

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ أثناء حسم النزاع' };
  }
}
