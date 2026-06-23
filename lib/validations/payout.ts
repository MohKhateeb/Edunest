import { z } from 'zod';

export const draftPayoutSchema = z.object({
  teacherId: z.string().min(1, 'معرّف المعلم مطلوب'),
  periodStart: z.coerce.date({ message: 'تاريخ بدء الفترة مطلوب' }),
  periodEnd: z.coerce.date({ message: 'تاريخ نهاية الفترة مطلوب' }),
});

export const createPayoutSchema = z.object({
  teacherId: z.string().min(1, 'معرّف المعلم مطلوب'),
  bookingIds: z.array(z.string()).min(1, 'يجب تحديد جلسة واحدة على الأقل للتسوية'),
});

export const payoutIdSchema = z.object({
  payoutId: z.string().min(1, 'معرّف التسوية مطلوب'),
});
