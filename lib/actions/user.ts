'use server';

import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { registerSchema, studentSchema, updateProfileSchema, changePasswordSchema } from '@/lib/validations/user';
import bcrypt from 'bcryptjs';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { UserType } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '@/lib/require-auth';
import { revalidatePath } from 'next/cache';

export async function registerUser(
  data: z.infer<typeof registerSchema> & { subjectIds?: string[] }
): Promise<ActionResponse> {
  try {
    const validated = registerSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { name, email, password, phone, userType } = validated.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return { success: false, error: 'البريد الإلكتروني مسجل بالفعل' };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash,
          phone: phone || null,
          userType,
        },
      });

      if (userType === UserType.TEACHER) {
        const slug = await generateUniqueSlug(name);
        await tx.teacher.create({
          data: {
            userId: user.id,
            slug,
            subjects: data.subjectIds?.length ? {
              create: data.subjectIds.map(id => ({ subjectId: id }))
            } : undefined
          },
        });
      }
    });

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ أثناء إنشاء الحساب' };
  }
}

export async function addStudent(
  data: z.infer<typeof studentSchema>
): Promise<ActionResponse> {
  try {
    const { userId } = await requireAuth([UserType.PARENT]);

    const validated = studentSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await prisma.student.create({
      data: {
        parentUserId: userId,
        name: validated.data.name,
        grade: validated.data.grade,
        school: validated.data.school || null,
      },
    });

    revalidatePath('/dashboard/parent/students');

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ أثناء إضافة الطالب' };
  }
}

export async function updateStudent(
  studentId: string,
  data: z.infer<typeof studentSchema>
): Promise<ActionResponse> {
  try {
    const { userId } = await requireAuth([UserType.PARENT]);

    const validated = studentSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    // Check student ownership and bookings count
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!student) {
      return { success: false, error: 'الطالب غير موجود' };
    }

    if (student.parentUserId !== userId) {
      return { success: false, error: 'غير مصرح لك بتعديل بيانات هذا الطالب' };
    }

    if (student._count.bookings > 0) {
      return { success: false, error: 'لا يمكن تعديل بيانات الطالب لوجود جلسات مجدولة له' };
    }

    await prisma.student.update({
      where: { id: studentId },
      data: {
        name: validated.data.name,
        grade: validated.data.grade,
        school: validated.data.school || null,
      },
    });

    revalidatePath('/dashboard/parent/students');

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ أثناء تعديل بيانات الطالب' };
  }
}

export async function updateUserProfile(
  data: z.infer<typeof updateProfileSchema>
): Promise<ActionResponse> {
  try {
    const { userId } = await requireAuth([UserType.PARENT, UserType.TEACHER, UserType.ADMIN]);

    const validated = updateProfileSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { name, email, phone } = validated.data;
    const cleanEmail = email.toLowerCase().trim();

    // Check if email already exists for another user
    const existing = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        id: { not: userId },
      },
    });

    if (existing) {
      return { success: false, error: 'البريد الإلكتروني مستخدم بالفعل من قبل حساب آخر' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email: cleanEmail,
        phone: phone || null,
      },
    });

    revalidatePath('/dashboard');

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ أثناء تحديث بيانات الملف الشخصي' };
  }
}

export async function changeUserPassword(
  data: z.infer<typeof changePasswordSchema>
): Promise<ActionResponse> {
  try {
    const { userId } = await requireAuth([UserType.PARENT, UserType.TEACHER, UserType.ADMIN]);

    const validated = changePasswordSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { currentPassword, newPassword } = validated.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
    }

    // Hash and update
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ أثناء تغيير كلمة المرور' };
  }
}
