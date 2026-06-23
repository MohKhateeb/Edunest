'use server';

import crypto from 'crypto';
import { requireAuth } from '@/lib/require-auth';
import { UserType, BookingStatus, PaymentStatus, PaymentMethod, BookingSource } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { bookingSchema } from '@/lib/validations/booking';
import { checkTeacherAvailability } from '@/lib/utils/availability';
import { hoursUntil } from '@/lib/utils/time';
import { getSettingNumber, getSettingBool } from '@/lib/settings';
import { createNotification } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function createBooking(
  data: z.infer<typeof bookingSchema> & {
    paymentMethod: PaymentMethod;
    bankTransferProofUrl?: string;
  }
): Promise<ActionResponse<{ bookingId: string }>> {
  try {
    const { userId: parentUserId } = await requireAuth([UserType.PARENT]);

    const validated = bookingSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const {
      studentId,
      teacherServiceId,
      startTime,
      isTrial,
      questionTitle,
      questionDetails,
      questionImageUrl,
      parentNotes,
    } = validated.data;

    // 1. Check lead time restriction
    const minLeadHours = await getSettingNumber('MinBookingLeadHours', 2);
    if (hoursUntil(startTime) < minLeadHours) {
      return {
        success: false,
        error: `يجب أن يكون موعد الحجز بعد ${minLeadHours} ساعات على الأقل من الآن`,
      };
    }

    // 2. Fetch parent, student, and teacher service details
    const student = await prisma.student.findUnique({
      where: { id: studentId, parentUserId, isActive: true },
    });
    if (!student) {
      return { success: false, error: 'الطالب المحدد غير موجود أو غير تابع لك' };
    }

    const teacherService = await prisma.teacherService.findUnique({
      where: { id: teacherServiceId, isActive: true },
      include: {
        serviceType: true,
        teacher: { select: { id: true, userId: true, slug: true, isVerified: true } },
      },
    });
    if (!teacherService) {
      return { success: false, error: 'الخدمة المطلوبة غير متوفرة' };
    }
    if (!teacherService.teacher.isVerified) {
      return { success: false, error: 'المعلم لم يتم توثيقه بعد ولا يمكن حجز جلسات معه حالياً' };
    }

    const teacherId = teacherService.teacher.id;

    // 3. Verify service-specific requirements
    if (teacherService.serviceType.name === 'شرح مسألة سريعة') {
      if (!questionTitle || !questionDetails) {
        return {
          success: false,
          error: 'حقول عنوان وتفاصيل السؤال إلزامية لخدمة شرح المسألة السريعة',
        };
      }
    }

    // 4. Fetch dynamic settings and calculate price/duration/commission
    let duration = teacherService.duration;
    let price = Number(teacherService.price);
    let appliedCommissionRate = Number(teacherService.serviceType.commissionRate);
    let trialCostToPlatform = 0;

    const parentUser = await prisma.user.findUnique({
      where: { id: parentUserId },
    });
    if (!parentUser) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    if (isTrial) {
      const trialEnabled = await getSettingBool('FreeTrialEnabled', true);
      if (!trialEnabled) {
        return { success: false, error: 'الجلسات التجريبية المجانية غير مفعلة حالياً' };
      }
      if (parentUser.hasUsedFreeTrial) {
        return { success: false, error: 'لقد قمت باستخدام جلستك التجريبية المجانية مسبقاً' };
      }

      duration = await getSettingNumber('FreeTrialDurationMinutes', 30);
      price = 0;
      appliedCommissionRate = 0;
      trialCostToPlatform = await getSettingNumber('FreeTrialCostToPlatform', 0);
    } else {
      // Dynamic commission override from general settings if standard rates are defined
      const defaultComm = await getSettingNumber('DefaultCommissionRate', 15);
      const quickHelpComm = await getSettingNumber('QuickHelpCommissionRate', 20);
      const monthlyPackComm = await getSettingNumber('MonthlyPackageCommissionRate', 12);

      if (teacherService.serviceType.name === 'شرح مسألة سريعة') {
        appliedCommissionRate = quickHelpComm;
      } else if (teacherService.serviceType.name === 'الحقيبة الشهرية') {
        appliedCommissionRate = monthlyPackComm;
      } else {
        appliedCommissionRate = defaultComm;
      }

      const minPrice = await getSettingNumber('MinBookingPrice', 5);
      if (price < minPrice) {
        return { success: false, error: `الحد الأدنى لسعر الجلسة هو ${minPrice} شيكل` };
      }
    }

    // 5. Check Weekly Recurring Availability
    const availabilityCheck = await checkTeacherAvailability(teacherId, startTime, duration);
    if (!availabilityCheck.available) {
      return { success: false, error: availabilityCheck.reason || 'الوقت المحدد غير متاح' };
    }

    // 6. Calculate range for overlap check
    const dayStart = new Date(startTime.getTime() - 24 * 3600 * 1000);
    const dayEnd = new Date(startTime.getTime() + 24 * 3600 * 1000);

    // Determine initial payment status
    let paymentStatus: PaymentStatus = PaymentStatus.UNPAID;
    if (isTrial) {
      paymentStatus = PaymentStatus.PAID; // Trials require no parent payment
    }

    // 7. Save booking inside a transaction (handling race conditions)
    const newBooking = await prisma.$transaction(async (tx) => {
      // Acquire exclusive row locks
      await tx.$executeRaw`SELECT id FROM "User" WHERE id = ${parentUserId} FOR UPDATE`;
      await tx.$executeRaw`SELECT id FROM "Teacher" WHERE id = ${teacherId} FOR UPDATE`;

      // Verify trial usage inside transaction to prevent parallel booking bypass
      if (isTrial) {
        const lockedParent = await tx.user.findUnique({
          where: { id: parentUserId },
        });
        if (!lockedParent) {
          throw new Error('المستخدم غير موجود');
        }
        if (lockedParent.hasUsedFreeTrial) {
          throw new Error('لقد قمت باستخدام جلستك التجريبية المجانية مسبقاً');
        }

        // Mark parent as having used trial
        await tx.user.update({
          where: { id: parentUserId },
          data: { hasUsedFreeTrial: true },
        });
      }

      // Check overlapping bookings inside transaction (fully locked)
      const activeBookings = await tx.booking.findMany({
        where: {
          teacherService: { teacherId },
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          startTime: { gte: dayStart, lte: dayEnd },
        },
        select: { startTime: true, duration: true },
      });

      const requestedStartMs = startTime.getTime();
      const requestedEndMs = requestedStartMs + duration * 60_000;

      for (const b of activeBookings) {
        const otherStartMs = b.startTime.getTime();
        const otherEndMs = otherStartMs + b.duration * 60_000;

        const hasOverlap = Math.max(requestedStartMs, otherStartMs) < Math.min(requestedEndMs, otherEndMs);
        if (hasOverlap) {
          throw new Error('المعلم لديه حجز آخر متداخل في هذا الوقت. يرجى اختيار وقت آخر');
        }
      }

      // Check overlapping bookings for the student
      const studentActiveBookings = await tx.booking.findMany({
        where: {
          studentId,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          startTime: { gte: dayStart, lte: dayEnd },
        },
        select: { startTime: true, duration: true },
      });

      for (const b of studentActiveBookings) {
        const otherStartMs = b.startTime.getTime();
        const otherEndMs = otherStartMs + b.duration * 60_000;

        const hasOverlap = Math.max(requestedStartMs, otherStartMs) < Math.min(requestedEndMs, otherEndMs);
        if (hasOverlap) {
          throw new Error('الطالب لديه حجز آخر متداخل في هذا الوقت مع معلم آخر. يرجى اختيار وقت آخر');
        }
      }

      // Create Booking
      const booking = await tx.booking.create({
        data: {
          parentUserId,
          studentId,
          teacherServiceId,
          startTime,
          duration,
          price,
          appliedCommissionRate,
          isTrial,
          trialCostToPlatform,
          questionTitle,
          questionDetails,
          questionImageUrl,
          parentNotes,
          status: isTrial ? BookingStatus.CONFIRMED : BookingStatus.PENDING,
          confirmedAt: isTrial ? new Date() : null,
          paymentStatus,
          bookingSource: BookingSource.WEB,
          meetingUrl: isTrial ? `https://meet.jit.si/edunest-${crypto.randomUUID()}` : null,
        },
      });

      // Create Payment if not trial
      if (!isTrial) {
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            amount: price,
            method: data.paymentMethod,
            isPaid: paymentStatus === PaymentStatus.PAID,
          },
        });
      }

      return booking;
    });

    // Send notification to Tutor (outside transaction)
    await createNotification({
      userId: teacherService.teacher.userId,
      title: 'طلب حجز جديد',
      message: `لديك طلب حجز جديد من ولي الأمر لجلسة بتاريخ ${startTime.toLocaleString('ar-EG')}`,
        link: '/dashboard/teacher/requests',
    });

    revalidatePath('/dashboard/parent/bookings');
    revalidatePath('/dashboard/teacher/bookings');
    revalidatePath(`/teachers/${teacherService.teacher.slug}`);

    return { success: true, data: { bookingId: newBooking.id } };
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الحجز';
    return { success: false, error: msg };
  }
}
