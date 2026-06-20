'use server';

import crypto from 'crypto';
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
import { ActionResponse } from '@/lib/types';
import { tutoringRequestSchema } from '@/lib/validations/tutoring-request';
import { checkTeacherAvailability } from '@/lib/utils/availability';
import { hoursUntil } from '@/lib/utils/time';
import { getSettingNumber } from '@/lib/settings';
import { createNotification } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * تغيير حالة توفر المعلم الفورية (متاح حالياً لتلقي الطلبات)
 */
export async function toggleTeacherAvailabilityStatus(isAvailable: boolean): Promise<ActionResponse<void>> {
  try {
    const { userId } = await requireAuth([UserType.TEACHER]);

    const teacher = await prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      return { success: false, error: 'لم يتم العثور على ملف المعلم' };
    }

    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { isAvailableNow: isAvailable },
    });

    revalidatePath('/dashboard/teacher/requests');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء تحديث الحالة' };
  }
}

/**
 * إنشاء طلب معلم عام من ولي الأمر
 */
export async function createTutoringRequest(
  data: z.infer<typeof tutoringRequestSchema>
): Promise<ActionResponse<{ requestId: string }>> {
  try {
    const { userId: parentUserId } = await requireAuth([UserType.PARENT]);

    const validated = tutoringRequestSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const {
      studentId,
      specialization,
      serviceTypeId,
      title,
      details,
      imageUrl,
      startTime,
      duration,
      price,
    } = validated.data;

    // 1. لا نطبق مهلة الحد الأدنى للطلب العام لأنه مخصص للطلبات الفورية (Uber-like)
    // نعين وقت البدء ليكون الآن (باعتباره طلباً عاجلاً) إذا كان الوقت المرسل قديماً
    const actualStartTime = startTime < new Date() ? new Date() : startTime;

    // 2. التحقق من الطالب وولي أمره
    const student = await prisma.student.findUnique({
      where: { id: studentId, parentUserId, isActive: true },
    });
    if (!student) {
      return { success: false, error: 'الطالب المحدد غير موجود أو غير تابع لك' };
    }

    // 3. التحقق من نوع الخدمة
    const serviceType = await prisma.serviceType.findUnique({
      where: { id: serviceTypeId, isActive: true },
    });
    if (!serviceType) {
      return { success: false, error: 'نوع الخدمة المطلوب غير متوفر' };
    }

    // 4. إنشاء الطلب العام
    const request = await prisma.tutoringRequest.create({
      data: {
        parentId: parentUserId,
        studentId,
        specialization,
        serviceTypeId,
        title,
        details,
        imageUrl,
        startTime: actualStartTime,
        duration,
        price,
        status: RequestStatus.PENDING,
      },
    });

    // 5. البحث عن المعلمين المتوافقين وإرسال إشعارات لهم
    // الشروط: متاح حالياً، نفس التخصص، يدرس نفس الصف الدراسي للطالب، وموثق
    const matchingTeachers = await prisma.teacher.findMany({
      where: {
        isVerified: true,
        isAvailableNow: true,
        specialization: specialization,
        gradeLevels: { has: student.grade },
        user: { isActive: true },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    // إرسال إشعار لكل معلم متطابق
    for (const t of matchingTeachers) {
      await createNotification({
        userId: t.userId,
        title: 'طلب تدريس جديد في مادتك 📢',
        message: `طلب جديد للطالب (${student.name} - الصف ${student.grade}) في مادة ${specialization} لموضوع: "${title}". تصفح الطلب وقدم عرضك الآن!`,
      });
    }

    revalidatePath('/dashboard/parent/requests');
    return { success: true, data: { requestId: request.id } };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء إنشاء الطلب' };
  }
}

/**
 * جلب جميع طلبات ولي الأمر مع العروض المقدمة لها
 */
export async function getTutoringRequestsForParent(): Promise<ActionResponse<any[]>> {
  try {
    const { userId: parentUserId } = await requireAuth([UserType.PARENT]);

    const requests = await prisma.tutoringRequest.findMany({
      where: { parentId: parentUserId },
      include: {
        student: {
          select: { name: true, grade: true },
        },
        serviceType: {
          select: { name: true, nameEnglish: true },
        },
        offers: {
          include: {
            teacher: {
              select: {
                id: true,
                averageRating: true,
                totalReviews: true,
                yearsOfExperience: true,
                profileImageUrl: true,
                user: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // تحويل أسعار الـ Decimal إلى أرقام عادية للتوافق مع مكونات الواجهة
    const serializedRequests = requests.map((req) => ({
      ...req,
      price: Number(req.price),
      offers: req.offers.map((off) => ({
        ...off,
        price: Number(off.price),
        teacher: {
          ...off.teacher,
          averageRating: Number(off.teacher.averageRating),
        },
      })),
    }));

    return { success: true, data: serializedRequests };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء جلب الطلبات' };
  }
}

/**
 * جلب الطلبات العامة المتاحة للمعلم الحالي لتقديم العروض عليها
 */
export async function getAvailableRequestsForTeacher(): Promise<ActionResponse<{ availableRequests: any[]; myOffers: any[] }>> {
  try {
    const { userId } = await requireAuth([UserType.TEACHER]);

    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!teacher) {
      return { success: false, error: 'لم يتم العثور على ملف المعلم' };
    }

    if (!teacher.isVerified) {
      return { success: false, error: 'يجب توثيق حسابك أولاً لتتمكن من تقديم عروض' };
    }

    // 1. جلب العروض التي قدمها المعلم مسبقاً لمراجعة حالتها
    const myOffers = await prisma.tutoringOffer.findMany({
      where: { teacherId: teacher.id },
      include: {
        request: {
          include: {
            student: { select: { name: true, grade: true } },
            serviceType: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const serializedMyOffers = myOffers.map((off) => ({
      ...off,
      price: Number(off.price),
      request: {
        ...off.request,
        price: Number(off.request.price),
      },
    }));

    // إذا كان المعلم غير متاح حالياً، فلن نعرض له أي طلبات جديدة
    if (!teacher.isAvailableNow) {
      return { success: true, data: { availableRequests: [], myOffers: serializedMyOffers } };
    }

    // 2. جلب جميع الطلبات المعلقة المتطابقة مع تخصص المعلم ومستواه الدراسي
    const pendingRequests = await prisma.tutoringRequest.findMany({
      where: {
        status: RequestStatus.PENDING,
        specialization: teacher.specialization,
        student: {
          grade: { in: teacher.gradeLevels },
        },
        // استثناء الطلبات التي قدم المعلم عرضاً عليها بالفعل
        offers: {
          none: { teacherId: teacher.id },
        },
      },
      include: {
        student: {
          select: { name: true, grade: true },
        },
        serviceType: {
          select: { name: true, nameEnglish: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. فلترة الطلبات بناءً على تعارض الوقت مع جدول الحجوزات الحالي وتوفر المعلم
    const availableRequests: any[] = [];

    for (const req of pendingRequests) {
      const isTimeAvailable = await checkTeacherAvailability(teacher.id, req.startTime, req.duration);
      if (isTimeAvailable.available) {
        availableRequests.push({
          ...req,
          price: Number(req.price),
        });
      }
    }

    return { success: true, data: { availableRequests, myOffers: serializedMyOffers } };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء جلب الطلبات المتاحة' };
  }
}

/**
 * تقديم عرض من المعلم على طلب عام
 */
export async function createTutoringOffer(
  requestId: string,
  price: number,
  notes?: string
): Promise<ActionResponse<void>> {
  try {
    const { userId } = await requireAuth([UserType.TEACHER]);
    
    // تعقيم وتنظيف الملاحظات لمنع ثغرات XSS
    const sanitizedNotes = notes ? notes.replace(/<[^>]*>?/gm, '').trim() : undefined;

    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: { user: { select: { name: true } } },
    });

    if (!teacher) {
      return { success: false, error: 'لم يتم العثور على ملف المعلم' };
    }

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
    if (request.specialization !== teacher.specialization) {
      return { success: false, error: 'تخصصك لا يطابق التخصص المطلوب في هذا الطلب' };
    }
    if (!teacher.gradeLevels.includes(request.student.grade)) {
      return { success: false, error: 'المرحلة الدراسية للطالب لا تقع ضمن المراحل التي تدرسها' };
    }

    // التحقق من توفر وقت الجلسة
    const availabilityCheck = await checkTeacherAvailability(teacher.id, request.startTime, request.duration);
    if (!availabilityCheck.available) {
      return { success: false, error: availabilityCheck.reason || 'هناك تعارض في وقتك مع هذا الطلب' };
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
        notes: sanitizedNotes,
        status: OfferStatus.PENDING,
      },
    });

    // إرسال إشعار لولي الأمر
    await createNotification({
      userId: request.parentId,
      title: 'عرض جديد على طلبك للتدريس 💰',
      message: `قدم المعلم (${teacher.user.name}) عرضاً بقيمة ${price} شيكل على طلبك موضوع: "${request.title}". تفقد العرض الآن!`,
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
      const dayStart = new Date(request.startTime.getTime() - 24 * 3600 * 1000);
      const dayEnd = new Date(request.startTime.getTime() + 24 * 3600 * 1000);

      const activeBookings = await tx.booking.findMany({
        where: {
          teacherService: { teacherId: offer.teacherId },
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          startTime: { gte: dayStart, lte: dayEnd },
        },
        select: { startTime: true, duration: true },
      });

      const requestedStartMs = request.startTime.getTime();
      const requestedEndMs = requestedStartMs + request.duration * 60_000;

      for (const b of activeBookings) {
        const otherStartMs = b.startTime.getTime();
        const otherEndMs = otherStartMs + b.duration * 60_000;

        const hasOverlap = Math.max(requestedStartMs, otherStartMs) < Math.min(requestedEndMs, otherEndMs);
        if (hasOverlap) {
          throw new Error('المعلم لديه حجز آخر متداخل في هذا الوقت حالياً. يرجى رفض العرض أو البحث عن موعد آخر');
        }
      }

      // 4. إيجاد أو إنشاء خدمة المعلم (TeacherService) لتوافق مع نظام الحجز العام
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
            duration: request.duration,
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
          startTime: request.startTime,
          duration: request.duration,
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
          method: PaymentMethod.BANK_TRANSFER, // الدفع الافتراضي بالتحويل اليدوي لحين الدفع
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

/**
 * إلغاء طلب تدريس عام معلق من ولي الأمر
 */
export async function cancelTutoringRequest(requestId: string): Promise<ActionResponse<void>> {
  try {
    const { userId: parentUserId } = await requireAuth([UserType.PARENT]);

    const request = await prisma.tutoringRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: 'الطلب غير موجود' };
    }

    if (request.parentId !== parentUserId) {
      return { success: false, error: 'غير مصرح لك بإلغاء هذا الطلب' };
    }

    if (request.status !== RequestStatus.PENDING) {
      return { success: false, error: 'لا يمكن إلغاء الطلبات المقبولة أو المنتهية بالفعل' };
    }

    await prisma.tutoringRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.CANCELLED },
    });

    revalidatePath('/dashboard/parent/requests');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء إلغاء الطلب' };
  }
}
