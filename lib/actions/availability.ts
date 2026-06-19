'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { availabilityItemSchema } from '@/lib/validations/teacher';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const availabilityArraySchema = z.array(availabilityItemSchema);

export async function updateWeeklyAvailability(
  items: z.infer<typeof availabilityArraySchema>
): Promise<ActionResponse> {
  try {
    const { userId } = await requireAuth([UserType.TEACHER]);

    // Find the teacher profile associated with this user
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      return { success: false, error: 'الملف الشخصي للمعلم غير موجود' };
    }

    // Validate using Zod
    const validated = availabilityArraySchema.safeParse(items);
    if (!validated.success) {
      return { success: false, error: 'البيانات المرسلة غير صالحة' };
    }

    // Check time order for each item to satisfy DB constraints
    for (const item of validated.data) {
      if (item.startTime >= item.endTime) {
        return { success: false, error: 'وقت البدء يجب أن يكون قبل وقت الانتهاء' };
      }
    }

    // Run in a transaction to replace old availability
    await prisma.$transaction(async (tx) => {
      // Delete existing availability entries for this teacher
      await tx.teacherAvailability.deleteMany({
        where: { teacherId: teacher.id },
      });

      // Insert new entries
      if (validated.data.length > 0) {
        await tx.teacherAvailability.createMany({
          data: validated.data.map((item) => ({
            teacherId: teacher.id,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            isActive: true,
          })),
        });
      }
    });

    revalidatePath(`/teachers/${teacher.slug}`);
    revalidatePath('/dashboard/teacher/availability');

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث أوقات التوفر';
    return { success: false, error: msg };
  }
}
