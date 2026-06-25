'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, RequestStatus } from '@prisma/client';
import { requireTeacherProfile } from '@/lib/actions/auth-helpers';
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
        subject: { select: { name: true } },
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
      specialization: req.subject?.name || 'غير محدد',
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

    const teacher = await requireTeacherProfile(userId);

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
            serviceType: { select: { name: true, nameEnglish: true } },
            subject: { select: { name: true } },
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
        subjectId: { in: teacher.subjects.map((s) => s.subjectId) },
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
        subject: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. فلترة الطلبات بناءً على تعارض الوقت (بشكل مجمّع لمنع N+1 Queries)
    const availableRequests: any[] = [];
    
    const now = new Date();
    const activeBookings = await prisma.booking.findMany({
      where: {
        teacherService: { teacherId: teacher.id },
        status: { in: ['PENDING', 'CONFIRMED'] },
        startTime: { gte: new Date(now.getTime() - 24 * 3600 * 1000) },
      },
    });

    for (const req of pendingRequests) {
      const reqStart = req.startTime.getTime();
      const reqEnd = reqStart + (req.duration || 30) * 60_000;
      
      const hasConflict = activeBookings.some((b) => {
         const bStart = b.startTime.getTime();
         const bEnd = bStart + b.duration * 60_000;
         return reqStart < bEnd && bStart < reqEnd;
      });

      if (!hasConflict) {
        availableRequests.push({
          ...req,
          specialization: req.subject?.name || 'غير محدد',
          price: Number(req.price),
        });
      }
    }

    return { success: true, data: { availableRequests, myOffers: serializedMyOffers } };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء جلب الطلبات المتاحة' };
  }
}
