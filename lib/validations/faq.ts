import { FAQCategory } from "@prisma/client";
import { z } from "zod";

export const faqSchema = z.object({
	question: z.string().min(5, "validation_question_min_length"),
	answer: z.string().min(5, "validation_answer_min_length"),
	category: z.nativeEnum(FAQCategory, { message: "validation_category_invalid" }),
	isActive: z.boolean().default(true),
	order: z.number().int().default(0),
});

export const faqUpdateSchema = faqSchema.partial();

export const faqIdSchema = z.object({
	id: z.string().min(1, "validation_faq_id_required"),
});
