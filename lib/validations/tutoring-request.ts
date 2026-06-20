import { z } from 'zod';

// دالة مساعدة لتنظيف النصوص من وسوم HTML الأساسية كإجراء أمني (Sanitization)
const sanitizeText = (val: string) => val.replace(/<[^>]*>?/gm, '');

export const tutoringRequestSchema = z.object({
  studentId: z.string().min(1, 'الطالب مطلوب'),
  specialization: z.string().trim().min(1, 'التخصص مطلوب').max(100),
  serviceTypeId: z.string().min(1, 'نوع الخدمة مطلوب'),
  title: z.string().trim().min(3, 'عنوان الطلب يجب أن لا يقل عن 3 أحرف').max(200).transform(sanitizeText),
  details: z.string().trim().max(2000, 'التفاصيل طويلة جداً').optional().transform(val => val ? sanitizeText(val) : val),
  imageUrl: z.string().url('رابط الصورة غير صالح').optional().or(z.literal('')),
  startTime: z.coerce.date({ message: 'تاريخ وبدء الجلسة مطلوب' }),
  duration: z.coerce.number().int().min(5, 'المدة يجب أن لا تقل عن 5 دقائق').max(300, 'المدة تتجاوز الحد الأقصى'),
  price: z.coerce.number().min(5, 'الميزانية المقترحة يجب أن لا تقل عن 5 شواكل').max(10000),
});
