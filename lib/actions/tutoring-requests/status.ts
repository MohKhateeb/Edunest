'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, RequestStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { revalidatePath } from 'next/cache';

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
