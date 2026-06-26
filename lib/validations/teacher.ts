import { z } from "zod";

export const teacherProfileSchema = z.object({
	subjectIds: z.array(z.string()).min(1, "يجب اختيار مادة واحدة على الأقل"),
	subSpecialization: z.string().optional().nullable(),
	bio: z.string().optional().nullable(),
	gradeLevels: z
		.array(z.coerce.number().int().min(1).max(12))
		.min(1, "يرجى اختيار صف دراسي واحد على الأقل"),
	city: z.string().min(2, "المدينة مطلوبة"),
	area: z.string().optional().nullable(),
	education: z.string().optional().nullable(),
	yearsOfExperience: z.coerce.number().int().min(0, "سنوات الخبرة غير صالحة"),
	defaultHourlyRate: z.coerce
		.number()
		.min(5, "الحد الأدنى لسعر الساعة هو 5 شيكل"),
	profileImageUrl: z.string().optional().nullable(),
});

export const teacherServiceSchema = z.object({
	serviceTypeId: z.string().min(1, "نوع الخدمة مطلوب"),
	price: z.coerce.number().min(5, "الحد الأدنى للسعر هو 5 شيكل"),
	duration: z.coerce.number().int().min(5, "المدة يجب أن لا تقل عن 5 دقائق"),
	customDescription: z.string().optional().nullable(),
});

export const availabilityItemSchema = z.object({
	dayOfWeek: z.coerce.number().int().min(0).max(6),
	startTime: z
		.string()
		.regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, "تنسيق الوقت غير صالح (HH:MM)"),
	endTime: z
		.string()
		.regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, "تنسيق الوقت غير صالح (HH:MM)"),
});

export const teacherSlugSchema = z.object({
	slug: z
		.string()
		.min(3, "الرابط يجب أن يحتوي على 3 أحرف على الأقل")
		.max(50, "الرابط طويل جداً (الحد الأقصى 50 حرف)")
		.regex(
			/^[a-zA-Z0-9-]+$/,
			"الرابط يجب أن يحتوي فقط على أحرف إنجليزية، أرقام، أو شرطات (-) بدون مسافات",
		),
});
