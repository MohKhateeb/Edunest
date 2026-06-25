'use server';

import { requireAuth } from '@/lib/require-auth';
import { 
  UserType, 
  RequestStatus, 
  OfferStatus, 
  BookingStatus, 
  PaymentStatus, 
  PaymentMethod, 
  BookingSource 
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireTeacherProfile } from '@/lib/actions/auth-helpers';
import { ActionResponse } from '@/lib/types';
import { checkConflictingBookings } from '@/lib/utils/availability';
import { getSettingNumber } from '@/lib/settings';
import { createNotification } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';

import { offerSchema } from '@/lib/validations/tutoring-request';
import { z } from 'zod';

/**
 * تقديم عرض من المعلم على طلب عام
 */
export async function createTutoringOffer(
  data: z.infer<typeof offerSchema>
): Promise<ActionResponse<void>> {
  try {
    const validated = offerSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { requestId, price, duration, notes } = validated.data;
    const { userId } = await requireAuth([UserType.TEACHER]);
    
    // تعقيم وتنظيف الملاحظات لمنع ثغرات XSS
    const sanitizedNotes = notes ? notes.replace(/<[^>]*>?/gm, '').trim() : undefined;

    const teacher = await requireTeacherProfile(userId);

    if (!teacher.isVerified) {
      return { success: false, error: 'يجب توثيق حسابك أولاً لتقديم عروض' };
    }

    const request = await prisma.tutoringRequest.findUnique({
      where: { id: requestId },
      include: { student: true },
    });

    if (!request || request.status !== RequestStatus.PENDING) {
      return { success: false, error: 'الطلب غير موجود أو لم يعد متاحاً' };
    }

    // التحقق من مطابقة شروط التخصص والصف
    if (!teacher.subjects.some(s => s.subjectId === request.subjectId)) {
      return { success: false, error: 'تخصصك لا يطابق التخصص المطلوب في هذا الطلب' };
    }
    if (!teacher.gradeLevels.includes(request.student.grade)) {
      return { success: false, error: 'المرحلة الدراسية للطالب لا تقع ضمن المراحل التي تدرسها' };
    }

    // التحقق من عدم تعارض وقت الجلسة الفورية مع حجوزات المعلم الحالية
    const conflictCheck = await checkConflictingBookings(teacher.id, new Date(), duration);
    if (conflictCheck.conflict) {
      return { success: false, error: conflictCheck.reason || 'هناك تعارض في وقتك الآن للقيام بهذه الجلسة المباشرة' };
    }

    // التحقق من عدم تقديم عرض سابق
    const existingOffer = await prisma.tutoringOffer.findUnique({
      where: {
        requestId_teacherId: {
          requestId,
          teacherId: teacher.id,
        },
      },
    });
    if (existingOffer) {
      return { success: false, error: 'لقد قمت بتقديم عرض على هذا الطلب بالفعل' };
    }

    // إنشاء العرض
    await prisma.tutoringOffer.create({
      data: {
        requestId,
        teacherId: teacher.id,
        price,
        duration,
        notes: sanitizedNotes,
        status: OfferStatus.PENDING,
      },
    });

    // إرسال إشعار لولي الأمر
    await createNotification({
      userId: request.parentId,
      title: 'عرض جديد على طلبك للتدريس 💰',
      message: `قدم المعلم (${teacher.user.name}) عرضاً بقيمة ${price} شيكل على طلبك موضوع: "${request.title}". تفقد العرض الآن!`,
        link: '/dashboard/parent/requests',
    });

    revalidatePath('/dashboard/teacher/requests');
    revalidatePath('/dashboard/parent/requests');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء تقديم العرض' };
  }
}

/**
 * قبول عرض معلم من قبل ولي الأمر وإنشاء الحجز الرسمي
 */
export async function acceptTutoringOffer(offerId: string): Promise<ActionResponse<{ bookingId: string }>> {
  try {
    const { userId: parentUserId } = await requireAuth([UserType.PARENT]);

    // جلب العرض والتحقق منه
    const offer = await prisma.tutoringOffer.findUnique({
      where: { id: offerId },
      include: {
        request: {
          include: {
            student: true,
            serviceType: true,
          },
        },
        teacher: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!offer) {
      return { success: false, error: 'العرض المحدد غير موجود' };
    }

    const request = offer.request;

    if (request.parentId !== parentUserId) {
      return { success: false, error: 'غير مصرح لك بقبول هذا العرض' };
    }

    if (request.status !== RequestStatus.PENDING || offer.status !== OfferStatus.PENDING) {
      return { success: false, error: 'الطلب أو العرض لم يعد معلقاً' };
    }

    // تنفيذ المعاملة لإنشاء الحجز وتحديث الحالات لمنع السباق التعارضي (Race Condition)
    const result = await prisma.$transaction(async (tx) => {
      // 1. قفل الصفوف للضمان
      await tx.$executeRaw`SELECT id FROM "TutoringRequest" WHERE id = ${request.id} FOR UPDATE`;
      await tx.$executeRaw`SELECT id FROM "TutoringOffer" WHERE id = ${offer.id} FOR UPDATE`;

      // 2. التحقق الإضافي داخل المعاملة المقفلة
      const lockedRequest = await tx.tutoringRequest.findUnique({ where: { id: request.id } });
      if (!lockedRequest || lockedRequest.status !== RequestStatus.PENDING) {
        throw new Error('تم قبول عرض آخر أو إلغاء هذا الطلب مسبقاً');
      }

      // 3. التحقق من توفر وقت الجلسة الفعلي للمعلم وتجنب تداخل الحجوزات
      const now = new Date();
      const dayStart = new Date(now.getTime() - 24 * 3600 * 1000);
      const dayEnd = new Date(now.getTime() + 24 * 3600 * 1000);

      const activeBookings = await tx.booking.findMany({
        where: {
          teacherService: { teacherId: offer.teacherId },
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          startTime: { gte: dayStart, lte: dayEnd },
        },
        select: { startTime: true, duration: true },
      });

      const requestedStartMs = now.getTime();
      const requestedEndMs = requestedStartMs + offer.duration * 60_000;

      for (const b of activeBookings) {
        const otherStartMs = b.startTime.getTime();
        const otherEndMs = otherStartMs + b.duration * 60_000;

        const hasOverlap = Math.max(requestedStartMs, otherStartMs) < Math.min(requestedEndMs, otherEndMs);
        if (hasOverlap) {
          throw new Error('المعلم لديه حجز آخر متداخل في هذا الوقت حالياً. يرجى الانتظار قليلاً أو البحث عن معلم آخر');
        }
      }

      // 3.5 التحقق من عدم تعارض وقت الجلسة الفعلي للطالب (قد يكون الطالب في جلسة أخرى الآن)
      const studentActiveBookings = await tx.booking.findMany({
        where: {
          studentId: request.studentId,
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
          throw new Error('الطالب لديه حجز آخر متداخل في هذا الوقت مع معلم آخر. يرجى الانتظار حتى تنتهي جلسته');
        }
      }

      let teacherService = await tx.teacherService.findFirst({
        where: {
          teacherId: offer.teacherId,
          serviceTypeId: request.serviceTypeId,
          isActive: true,
        },
      });

      if (!teacherService) {
        // إنشاء الخدمة بشكل تلقائي للمعلم لربط الحجز بنجاح
        teacherService = await tx.teacherService.create({
          data: {
            teacherId: offer.teacherId,
            serviceTypeId: request.serviceTypeId,
            price: offer.price,
            duration: offer.duration,
            customDescription: 'خدمة مخصصة لطلب عام تم قبول عرضه',
            isActive: true,
          },
        });
      }

      // 5. حساب نسبة العمولة
      const defaultComm = await getSettingNumber('DefaultCommissionRate', 15);
      const quickHelpComm = await getSettingNumber('QuickHelpCommissionRate', 20);
      const commissionRate = request.serviceType.name === 'شرح مسألة سريعة' ? quickHelpComm : defaultComm;

      // 6. إنشاء الحجز الرسمي (بانتظار الدفع)
      const booking = await tx.booking.create({
        data: {
          parentUserId,
          studentId: request.studentId,
          teacherServiceId: teacherService.id,
          startTime: now,
          duration: offer.duration,
          price: offer.price,
          appliedCommissionRate: commissionRate,
          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
          bookingSource: BookingSource.WEB,
          meetingUrl: null,
          parentNotes: request.details,
          questionTitle: request.serviceType.name === 'شرح مسألة سريعة' ? request.title : undefined,
          questionDetails: request.serviceType.name === 'شرح مسألة سريعة' ? request.details : undefined,
          questionImageUrl: request.serviceType.name === 'شرح مسألة سريعة' ? request.imageUrl : undefined,
        },
      });

      // 7. إنشاء سجل مدفوعات
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: offer.price,
          method: PaymentMethod.ONLINE_CARD, // الدفع الافتراضي بالبطاقة لتفعيل زر الدفع في لوحة التحكم
          isPaid: false,
        },
      });

      // 8. تحديث حالات الطلب والطلب الحالي وبقية العروض
      await tx.tutoringRequest.update({
        where: { id: request.id },
        data: { status: RequestStatus.ACCEPTED },
      });

      await tx.tutoringOffer.update({
        where: { id: offer.id },
        data: { status: OfferStatus.ACCEPTED },
      });


      // الحصول على العروض المرفوضة لإرسال إشعارات لطيفة لأصحابها
      const rejectedOffers = await tx.tutoringOffer.findMany({
        where: {
          requestId: request.id,
          id: { not: offer.id },
        },
        include: { teacher: true }
      });

      // رفض بقية العروض تلقائياً
      await tx.tutoringOffer.updateMany({
        where: {
          requestId: request.id,
          id: { not: offer.id },
        },
        data: { status: OfferStatus.REJECTED },
      });

      // 9. إرسال إشعارات
      await createNotification({
        userId: offer.teacher.userId,
        title: 'تم قبول عرضك للتدريس! 🎉',
        message: `تهانينا! قبل ولي الأمر عرضك للطلب موضوع: "${request.title}". الحجز معلق الآن بانتظار إتمام الدفع من ولي الأمر لتأكيده.`,
      }, tx);

      await createNotification({
        userId: parentUserId,
        title: 'تم قبول العرض بنجاح 📆',
        message: `لقد قبلت عرض المعلم (${offer.teacher.user.name}) للطلب موضوع: "${request.title}". يرجى رفع إيصال الدفع لتأكيد الحجز وبدء الجلسة.`,
      }, tx);

      // 10. إرسال إشعارات لطيفة للمعلمين الذين لم يتم اختيار عروضهم
      for (const rejectedOffer of rejectedOffers) {
        await createNotification({
          userId: rejectedOffer.teacher.userId,
          title: 'تحديث بخصوص عرضك 📝',
          message: `شكراً لجهودك وعرضك على الطلب "${request.title}". قام ولي الأمر باختيار عرض آخر هذه المرة. لا تحبط! هناك دائماً طلاب آخرون بحاجة لخبراتك. نتمنى لك التوفيق في المرة القادمة 🌟`,
        }, tx);
      }

      return booking;
    });

    revalidatePath('/dashboard/parent/requests');
    revalidatePath('/dashboard/parent/bookings');
    revalidatePath('/dashboard/teacher/bookings');
    revalidatePath('/dashboard/teacher/requests');

    return { success: true, data: { bookingId: result.id } };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء قبول العرض' };
  }
}
