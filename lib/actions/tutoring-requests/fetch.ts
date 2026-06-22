'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, RequestStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { checkConflictingBookings } from '@/lib/utils/availability';

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
      // For on-demand public requests, we bypass the weekly schedule check because the teacher is online now.
      // We only verify they do not have overlapping actual bookings.
      const conflictCheck = await checkConflictingBookings(teacher.id, req.startTime, req.duration);
      if (!conflictCheck.conflict) {
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
