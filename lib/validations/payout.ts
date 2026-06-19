import { z } from 'zod';

export const draftPayoutSchema = z.object({
  teacherId: z.string().min(1, 'معرّف المعلم مطلوب'),
  periodStart: z.coerce.date({ message: 'تاريخ بدء الفترة مطلوب' }),
  periodEnd: z.coerce.date({ message: 'تاريخ نهاية الفترة مطلوب' }),
});

export const payoutIdSchema = z.object({
  payoutId: z.string().min(1, 'معرّف التسوية مطلوب'),
});
