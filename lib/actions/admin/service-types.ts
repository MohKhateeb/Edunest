'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function updateServiceType(id: string, data: {
  name: string;
  nameEnglish: string | null;
  defaultDuration: number;
  commissionRate: number;
  fazaaPrice: number | null;
  fazaaDuration: number | null;
  isActive: boolean;
}): Promise<ActionResponse<void>> {
  try {
    // 1. Security Check: Admin Only
    await requireAuth([UserType.ADMIN]);

    // 2. Validate basic logic
    if (data.defaultDuration < 5) return { success: false, error: 'المدة يجب أن تكون 5 دقائق على الأقل' };
    if (data.commissionRate < 0 || data.commissionRate > 100) return { success: false, error: 'نسبة العمولة يجب أن تكون بين 0 و 100' };

    // 3. Update in Database
    await prisma.serviceType.update({
      where: { id },
      data: {
        name: data.name,
        nameEnglish: data.nameEnglish,
        defaultDuration: data.defaultDuration,
        commissionRate: data.commissionRate,
        fazaaPrice: data.fazaaPrice,
        fazaaDuration: data.fazaaDuration,
        isActive: data.isActive,
      }
    });

    // 4. Revalidate cache
    revalidatePath('/dashboard/admin/services');
    revalidatePath('/dashboard/parent/live');

    return { success: true };
  } catch (error: any) {
    console.error('Update ServiceType Error:', error);
    return { success: false, error: 'حدث خطأ أثناء تحديث الخدمة' };
  }
}

export async function toggleServiceTypeStatus(id: string, currentStatus: boolean): Promise<ActionResponse<void>> {
  try {
    await requireAuth([UserType.ADMIN]);

    await prisma.serviceType.update({
      where: { id },
      data: { isActive: !currentStatus }
    });

    revalidatePath('/dashboard/admin/services');
    revalidatePath('/dashboard/parent/live');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'حدث خطأ أثناء تحديث حالة الخدمة' };
  }
}
