import { z } from "zod";

const sanitizeText = (val: string) => val.replace(/<[^>]*>?/gm, "");

export const tutoringRequestSchema = z.object({
	studentId: z.string().min(1, "validation_student_required"),
	subjectId: z.string().trim().min(1, "validation_subject_required"),
	serviceTypeId: z.string().min(1, "validation_service_type_required"),
	title: z
		.string()
		.trim()
		.min(3, "validation_request_title_min_length")
		.max(200)
		.transform(sanitizeText),
	details: z
		.string()
		.trim()
		.max(2000, "validation_request_details_too_long")
		.optional()
		.transform((val) => (val ? sanitizeText(val) : val)),
	imageUrl: z.string().url("validation_image_url_invalid").optional().or(z.literal("")),
});

export const offerSchema = z.object({
	requestId: z.string().min(1, "validation_request_id_required"),
	price: z.coerce
		.number()
		.min(5, "validation_offer_price_min")
		.max(10000),
	duration: z.coerce
		.number()
		.int()
		.min(5, "validation_offer_duration_min")
		.max(300, "validation_offer_duration_max"),
	notes: z
		.string()
		.trim()
		.max(1000)
		.optional()
		.transform((val) => (val ? sanitizeText(val) : val)),
});
