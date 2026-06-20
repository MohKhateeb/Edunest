import { z } from 'zod';
import { USER_TYPE } from '@/lib/enums';

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن لا يقل عن حرفين'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
  userType: z.enum([USER_TYPE.PARENT, USER_TYPE.TEACHER]),
});

export const studentSchema = z.object({
  name: z.string().min(2, 'اسم الطالب مطلوب'),
  grade: z.coerce.number().int().min(1, 'الصف الدراسي يجب أن يكون بين 1 و 12').max(12),
  school: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن لا يقل عن حرفين'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  phone: z.string().optional().or(z.literal('')),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'كلمة المرور الحالية يجب أن لا تقل عن 6 أحرف'),
  newPassword: z.string().min(6, 'كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف'),
  confirmPassword: z.string().min(6, 'تأكيد كلمة المرور يجب أن لا يقل عن 6 أحرف'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'كلمة المرور الجديدة وتأكيدها غير متطابقين',
  path: ['confirmPassword'],
});
