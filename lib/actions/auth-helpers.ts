'use server';

import { prisma } from '@/lib/prisma';
import { Teacher } from '@prisma/client';

export async function requireTeacherProfile(userId: string): Promise<Teacher & { user: { name: string | null, email: string, phone: string | null } }> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true, phone: true } } }
  });

  if (!teacher) {
    throw new Error('الملف الشخصي للمعلم غير موجود.');
  }

  return teacher;
}
