'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, RequestStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { tutoringRequestSchema } from '@/lib/validations/tutoring-request';
import { createNotification } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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
