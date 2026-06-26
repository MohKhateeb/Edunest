import { z } from "zod";

export const bookingSchema = z.object({
	studentId: z.string().min(1, "الطالب مطلوب"),
	teacherServiceId: z.string().min(1, "الخدمة مطلوبة"),
	startTime: z.coerce.date({ message: "تاريخ وبدء الجلسة مطلوب" }),
	isTrial: z.boolean().default(false),
	questionTitle: z.string().optional(),
	questionDetails: z.string().optional(),
	questionImageUrl: z.string().optional(),
	parentNotes: z.string().optional(),
});

export const cancellationSchema = z.object({
	bookingId: z.string().min(1),
	reason: z.string().min(5, "سبب الإلغاء يجب أن لا يقل عن 5 أحرف"),
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
				message: "يرجى كتابة المواضيع التي تم تغطيتها",
				path: ["topicsCovered"],
			});
		}
	});
