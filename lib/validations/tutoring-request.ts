import { z } from "zod";

// دالة مساعدة لتنظيف النصوص من وسوم HTML الأساسية كإجراء أمني (Sanitization)
const sanitizeText = (val: string) => val.replace(/<[^>]*>?/gm, "");

export const tutoringRequestSchema = z.object({
	studentId: z.string().min(1, "الطالب مطلوب"),
	subjectId: z.string().trim().min(1, "التخصص مطلوب"),
	serviceTypeId: z.string().min(1, "نوع الخدمة مطلوب"),
	title: z
		.string()
		.trim()
		.min(3, "عنوان الطلب يجب أن لا يقل عن 3 أحرف")
		.max(200)
		.transform(sanitizeText),
	details: z
		.string()
		.trim()
		.max(2000, "التفاصيل طويلة جداً")
		.optional()
		.transform((val) => (val ? sanitizeText(val) : val)),
	imageUrl: z.string().url("رابط الصورة غير صالح").optional().or(z.literal("")),
});

export const offerSchema = z.object({
	requestId: z.string().min(1, "معرف الطلب مطلوب"),
	price: z.coerce
		.number()
		.min(5, "السعر المعروض يجب أن لا يقل عن 5 شواكل")
		.max(10000),
	duration: z.coerce
		.number()
		.int()
		.min(5, "المدة يجب أن لا تقل عن 5 دقائق")
		.max(300, "المدة تتجاوز الحد الأقصى"),
	notes: z
		.string()
		.trim()
		.max(1000)
		.optional()
		.transform((val) => (val ? sanitizeText(val) : val)),
});
