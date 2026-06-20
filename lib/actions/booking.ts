'use server';

import crypto from 'crypto';
import { requireAuth } from '@/lib/require-auth';
import { UserType, BookingStatus, PaymentStatus, PaymentMethod, BookingSource } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { bookingSchema, cancellationSchema, reportSchema } from '@/lib/validations/booking';
import { checkTeacherAvailability } from '@/lib/utils/availability';
import { isValidTransition, getTransitionError } from '@/lib/utils/booking-state';
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
    } else if (data.paymentMethod === PaymentMethod.BANK_TRANSFER && data.bankTransferProofUrl) {
      paymentStatus = PaymentStatus.PENDING_VERIFICATION;
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
          status: BookingStatus.PENDING,
          paymentStatus,
          bookingSource: BookingSource.WEB,
          meetingUrl: `https://meet.jit.si/edunest-${crypto.randomUUID()}`,
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
            bankTransferProofUrl: data.bankTransferProofUrl || null,
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

export async function acceptBooking(bookingId: string): Promise<ActionResponse> {
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

    if (!isValidTransition(booking.status, BookingStatus.CONFIRMED)) {
      return { success: false, error: getTransitionError(booking.status, BookingStatus.CONFIRMED) };
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          confirmedAt: new Date(),
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

// ════════════════════════════════════════════════════
// البحث عن معلمين متاحين بناءً على الوقت والتخصص
// ════════════════════════════════════════════════════
export async function searchAvailableTeachers(input: {
  specialization: string;
  date: string; // "YYYY-MM-DD"
  timeSlot: string; // "HH:MM"
}): Promise<
  ActionResponse<{
    teachers: {
      id: string;
      userId: string;
      slug: string;
      userName: string;
      specialization: string;
      city: string | null;
      profileImageUrl: string | null;
      verificationLevel: string;
      averageRating: number;
      totalReviews: number;
      totalSessions: number;
      yearsOfExperience: number;
      education: string | null;
      bio: string | null;
      services: {
        id: string;
        price: number;
        duration: number;
        serviceTypeName: string;
        serviceTypeNameEnglish: string | null;
      }[];
    }[];
  }>
> {
  try {
    await requireAuth([UserType.PARENT]);

    const { specialization, date, timeSlot } = input;

    if (!specialization || !date || !timeSlot) {
      return { success: false, error: 'يرجى تحديد المادة والتاريخ والوقت' };
    }

    // تحديد يوم الأسبوع من التاريخ المطلوب
    const dateObj = new Date(`${date}T${timeSlot}:00`);
    if (isNaN(dateObj.getTime())) {
      return { success: false, error: 'التاريخ أو الوقت غير صالح' };
    }

    // التحقق من أن الوقت المطلوب في المستقبل
    const minLeadHours = await getSettingNumber('MinBookingLeadHours', 2);
    if (hoursUntil(dateObj) < minLeadHours) {
      return {
        success: false,
        error: `يجب أن يكون الموعد بعد ${minLeadHours} ساعات على الأقل من الآن`,
      };
    }

    const dayOfWeek = dateObj.getDay(); // 0 = Sunday ... 6 = Saturday

    // 1. جلب المعلمين الموثقين بنفس التخصص مع أوقات توفرهم وخدماتهم
    const teachers = await prisma.teacher.findMany({
      where: {
        isVerified: true,
        specialization,
      },
      include: {
        user: { select: { name: true } },
        availability: {
          where: {
            dayOfWeek,
            isActive: true,
          },
        },
        services: {
          where: { isActive: true, serviceType: { name: { not: 'الحقيبة الشهرية' } } },
          include: {
            serviceType: {
              select: { name: true, nameEnglish: true, defaultDuration: true },
            },
          },
        },
      },
    });

    // 2. تصفية المعلمين الذين لديهم فترة توفر تغطي الوقت المطلوب
    const candidateTeachers = teachers.filter((teacher) => {
      if (teacher.services.length === 0) return false;

      const minDuration = Math.min(...teacher.services.map((s) => s.duration));
      const requestedEndTime = new Date(dateObj.getTime() + minDuration * 60_000);
      const requestedEndStr = `${String(requestedEndTime.getHours()).padStart(2, '0')}:${String(requestedEndTime.getMinutes()).padStart(2, '0')}`;

      return teacher.availability.some(
        (a) => a.startTime <= timeSlot && a.endTime >= requestedEndStr
      );
    });

    const availableTeachers = [];

    if (candidateTeachers.length > 0) {
      const candidateTeacherIds = candidateTeachers.map((t) => t.id);

      // 3. التحقق من عدم وجود تداخل مع حجوزات موجودة (استعلام واحد مجمّع لتجنب N+1 Queries)
      const dayStart = new Date(dateObj);
      dayStart.setHours(dayStart.getHours() - 24);
      const dayEnd = new Date(dateObj);
      dayEnd.setHours(dayEnd.getHours() + 24);

      const allActiveBookings = await prisma.booking.findMany({
        where: {
          teacherService: { teacherId: { in: candidateTeacherIds } },
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          startTime: { gte: dayStart, lte: dayEnd },
        },
        select: {
          startTime: true,
          duration: true,
          teacherService: {
            select: { teacherId: true },
          },
        },
      });

      // تصنيف الحجوزات حسب المعلم في الذاكرة
      const bookingsByTeacher = new Map<string, { startTime: Date; duration: number }[]>();
      for (const booking of allActiveBookings) {
        const tId = booking.teacherService.teacherId;
        if (!bookingsByTeacher.has(tId)) {
          bookingsByTeacher.set(tId, []);
        }
        bookingsByTeacher.get(tId)!.push({
          startTime: booking.startTime,
          duration: booking.duration,
        });
      }

      for (const teacher of candidateTeachers) {
        const minDuration = Math.min(...teacher.services.map((s) => s.duration));
        const activeBookings = bookingsByTeacher.get(teacher.id) || [];

        // التحقق من التداخل مع أقصر مدة خدمة
        const requestedStartMs = dateObj.getTime();
        const requestedEndMs = requestedStartMs + minDuration * 60_000;

        const hasOverlap = activeBookings.some((b) => {
          const otherStartMs = b.startTime.getTime();
          const otherEndMs = otherStartMs + b.duration * 60_000;
          return Math.max(requestedStartMs, otherStartMs) < Math.min(requestedEndMs, otherEndMs);
        });

        if (hasOverlap) continue;

        // المعلم متاح — أضفه للقائمة
        availableTeachers.push({
          id: teacher.id,
          userId: teacher.userId,
          slug: teacher.slug,
          userName: teacher.user.name,
          specialization: teacher.specialization,
          city: teacher.city,
          profileImageUrl: teacher.profileImageUrl,
          verificationLevel: teacher.verificationLevel,
          averageRating: Number(teacher.averageRating),
          totalReviews: teacher.totalReviews,
          totalSessions: teacher.totalSessions,
          yearsOfExperience: teacher.yearsOfExperience,
          education: teacher.education,
          bio: teacher.bio,
          services: teacher.services.map((s) => ({
            id: s.id,
            price: Number(s.price),
            duration: s.duration,
            serviceTypeName: s.serviceType.name,
            serviceTypeNameEnglish: s.serviceType.nameEnglish,
          })),
        });
      }
    }

    return { success: true, data: { teachers: availableTeachers } };
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء البحث';
    return { success: false, error: msg };
  }
}

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
