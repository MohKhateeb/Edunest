'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, RequestStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { requireTeacherProfile } from '@/lib/actions/auth-helpers';


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

/**
 * فحص حالة طلب الفزعة للتحقق مما إذا كان المعلم قد التقطه
 * يقوم بإرجاع رقم الحجز في حال تم الالتقاط ليتم توجيه الولي للوبي
 */
export async function checkLiveRequestMatch(requestId: string): Promise<ActionResponse<{ isMatched: boolean; bookingId?: string }>> {
  try {
    const { userId: parentUserId } = await requireAuth([UserType.PARENT]);

    const request = await prisma.tutoringRequest.findUnique({
      where: { id: requestId },
      select: { status: true, title: true, parentId: true }
    });

    if (!request || request.parentId !== parentUserId) {
      return { success: false, error: 'الطلب غير موجود' };
    }

    if (request.status === RequestStatus.ACCEPTED) {
      // بما أن الطلب مقبول، نبحث عن الحجز الذي تم إنشاؤه للتو (نفس عنوان السؤال ولنفس الولي)
      const booking = await prisma.booking.findFirst({
        where: {
          parentUserId: parentUserId,
          questionTitle: request.title,
          status: 'PENDING' // الحجز الفوري يبدأ كـ PENDING بانتظار الدفع
        },
        orderBy: { createdAt: 'desc' }
      });

      if (booking) {
        return { success: true, data: { isMatched: true, bookingId: booking.id } };
      }
    }

    return { success: true, data: { isMatched: false } };

  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء الفحص' };
  }
}
