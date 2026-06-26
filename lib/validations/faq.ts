import { FAQCategory } from "@prisma/client";
import { z } from "zod";

export const faqSchema = z.object({
	question: z.string().min(5, "السؤال يجب أن لا يقل عن 5 أحرف"),
	answer: z.string().min(5, "الإجابة يجب أن لا تقل عن 5 أحرف"),
	category: z.nativeEnum(FAQCategory, { message: "التصنيف غير صالح" }),
	isActive: z.boolean().default(true),
	order: z.number().int().default(0),
});

export const faqUpdateSchema = faqSchema.partial();

export const faqIdSchema = z.object({
	id: z.string().min(1, "معرّف السؤال مطلوب"),
});
