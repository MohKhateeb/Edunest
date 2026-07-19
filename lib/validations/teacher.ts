import { z } from "zod";
import { Currency } from "@prisma/client";

export const teacherProfileSchema = z.object({
	subjectIds: z.array(z.string()).min(1, "validation_teacher_subject_required"),
	subSpecialization: z.string().optional().nullable(),
	bio: z.string().optional().nullable(),
	gradeLevels: z
		.array(z.coerce.number().int().min(1).max(12))
		.min(1, "validation_teacher_grade_required"),
	cityId: z.string().min(1, "validation_teacher_city_required"),
	area: z.string().optional().nullable(),
	education: z.string().optional().nullable(),
	yearsOfExperience: z.coerce.number().int().min(0, "validation_teacher_years_of_experience_invalid"),
	defaultHourlyRate: z.coerce
		.number()
		.min(5, "validation_teacher_min_hourly_rate"),
	profileImageUrl: z.string().optional().nullable(),
});

export const teacherServiceSchema = z.object({
	serviceTypeId: z.string().min(1, "validation_teacher_service_type_required"),
	price: z.coerce.number().min(5, "validation_teacher_min_price"),
	duration: z.coerce.number().int().min(5, "validation_teacher_min_duration"),
	customDescription: z.string().optional().nullable(),
	currency: z.nativeEnum(Currency, { message: "validation_teacher_currency_invalid" }),
});

export const availabilityItemSchema = z.object({
	dayOfWeek: z.coerce.number().int().min(0).max(6),
	startTime: z
		.string()
		.regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, "validation_teacher_time_format_invalid"),
	endTime: z
		.string()
		.regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, "validation_teacher_time_format_invalid"),
});

export const teacherSlugSchema = z.object({
	slug: z
		.string()
		.min(3, "validation_teacher_slug_min_length")
		.max(50, "validation_teacher_slug_max_length")
		.regex(
			/^[a-zA-Z0-9-]+$/,
			"validation_teacher_slug_format_invalid",
		),
});

