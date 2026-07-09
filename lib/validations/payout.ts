import { z } from "zod";

export const draftPayoutSchema = z.object({
	teacherId: z.string().min(1, "validation_teacher_id_required"),
	periodStart: z.coerce.date({ message: "validation_period_start_required" }),
	periodEnd: z.coerce.date({ message: "validation_period_end_required" }),
});

export const createPayoutSchema = z.object({
	teacherId: z.string().min(1, "validation_teacher_id_required"),
	bookingIds: z
		.array(z.string())
		.min(1, "validation_at_least_one_session_required"),
});

export const payoutIdSchema = z.object({
	payoutId: z.string().min(1, "validation_payout_id_required"),
});
