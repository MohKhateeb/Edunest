import { z } from "zod";

export const bookingSchema = z.object({
	studentId: z.string().min(1, "validation_student_required"),
	teacherServiceId: z.string().min(1, "validation_service_required"),
	startTime: z.coerce.date({ message: "validation_start_time_required" }),
	isTrial: z.boolean().default(false),
	questionTitle: z.string().optional(),
	questionDetails: z.string().optional(),
	questionImageUrl: z.string().optional(),
	parentNotes: z.string().optional(),
});

export const cancellationSchema = z.object({
	bookingId: z.string().min(1),
	reason: z.string().min(5, "validation_cancel_reason_min_length"),
});

export const reportSchema = z
	.object({
		bookingId: z.string().min(1),
		studentAttended: z.boolean(),
		topicsCovered: z.string(),
		studentPerformance: z.coerce
			.number()
			.int()
			.min(1)
			.max(5)
			.optional()
			.nullable(),
		homeworkAssigned: z.string().optional(),
		teacherNotes: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.studentAttended && data.topicsCovered.trim().length < 3) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "validation_topics_covered_required",
				path: ["topicsCovered"],
			});
		}
	});
