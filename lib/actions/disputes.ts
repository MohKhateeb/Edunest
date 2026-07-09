"use server";
import { getErrorT, getNotificationT, getValidationT } from "@/lib/i18n/get-server-translations";
import { BookingStatus, DisputeStatus, UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/require-auth";
import type { ActionResponse } from "@/lib/types";
import { hoursUntil } from "@/lib/utils/time";
import { disputeRepository } from "@/lib/repositories/disputeRepository";
import { authorizeDisputeAccess, authorizeDisputeTurn } from "@/lib/auth/authorization";

export async function getSecureDisputeDetails(id: string) {
	const { userId, userType } = await requireAuth([
		UserType.ADMIN,
		UserType.PARENT,
		UserType.TEACHER,
	]);

	const dispute = await disputeRepository.findByIdWithFullDetails(id);

	if (!dispute) return null;

	// Backend Authorization Check
	const auth = authorizeDisputeAccess(dispute, userId, userType);
	if (!auth.authorized) return null;

	return dispute;
}

const createDisputeSchema = z.object({
	bookingId: z.string().min(1, "validation_dispute_booking_id_required"),
	reason: z
		.string()
		.min(10, "validation_dispute_reason_min_length")
		.max(1000, "validation_dispute_reason_max_length"),
});

const sendMessageSchema = z.object({
	disputeId: z.string().min(1, "validation_dispute_id_required"),
	message: z
		.string()
		.min(1, "validation_dispute_message_required")
		.max(2000, "validation_dispute_message_max_length"),
});

const resolveDisputeSchema = z.object({
	disputeId: z.string().min(1, "validation_dispute_id_required"),
	decision: z.enum([
		"RESOLVED_IN_FAVOR_OF_PARENT",
		"RESOLVED_IN_FAVOR_OF_TEACHER",
	]),
	adminNotes: z.string().optional(),
});

export async function createDispute(
	data: z.infer<typeof createDisputeSchema>,
): Promise<ActionResponse> {
    const t = await getErrorT();
	try {
		const validated = createDisputeSchema.safeParse(data);
		if (!validated.success) {
			const tVal = await getValidationT();
			return { success: false, error: tVal(validated.error.issues[0].message) };
		}

		const { userId } = await requireAuth([UserType.PARENT]);
		const { bookingId, reason } = validated.data;

		// 1. Verify booking ownership and status
		const booking = await disputeRepository.findBookingWithDisputeAndTeacher(bookingId);

		if (!booking || booking.parentUserId !== userId) {
			return {
				success: false,
				error: t("action_error_21"),
			};
		}

		if (booking.status !== BookingStatus.COMPLETED) {
			return {
				success: false,
				error: t("action_error_22"),
			};
		}

		if (booking.payoutId) {
			return {
				success: false,
				error: t("action_error_23"),
			};
		}

		if (booking.dispute) {
			return { success: false, error: t("action_error_24") };
		}

		// 2. Strict Date Validation: Only within 24 hours of completion
		if (!booking.completedAt) {
			return { success: false, error: t("action_error_25") };
		}

		// hoursUntil returns (completedAt - now) in hours. It should be negative since completed in past.
		// So if it was completed 25 hours ago, hoursUntil is -25.
		// If it was completed 2 hours ago, hoursUntil is -2.
		// We want to allow if hoursUntil >= -24 (i.e. within the last 24h)
		if (hoursUntil(booking.completedAt) < -24) {
			return {
				success: false,
				error: t("action_error_26"),
			};
		}

		// 3. Create Dispute and first message
		await disputeRepository.createWithInitialMessage({
			bookingId,
			parentUserId: userId,
			reason,
			teacherUserId: booking.teacherService.teacher.userId,
		});

		revalidatePath("/dashboard/parent/financials");
		revalidatePath("/dashboard/teacher/earnings");
		revalidatePath("/dashboard/admin/financials");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: t("action_error_27") };
	}
}

export async function sendDisputeMessage(
	data: z.infer<typeof sendMessageSchema>,
): Promise<ActionResponse> {
    const t = await getErrorT();
	try {
		const validated = sendMessageSchema.safeParse(data);
		if (!validated.success) {
			const tVal = await getValidationT();
			return { success: false, error: tVal(validated.error.issues[0].message) };
		}

		const { userId, userType } = await requireAuth([
			UserType.PARENT,
			UserType.TEACHER,
			UserType.ADMIN,
		]);
		const { disputeId, message } = validated.data;

		const dispute = await disputeRepository.findByIdWithBookingAccess(disputeId);

		if (!dispute) {
			return { success: false, error: t("action_error_28") };
		}

		if (dispute.status !== DisputeStatus.OPEN) {
			return {
				success: false,
				error: t("action_error_29"),
			};
		}

		// Verify access
		const accessAuth = authorizeDisputeAccess(dispute, userId, userType);
		if (!accessAuth.authorized) { return { success: false, error: t(accessAuth.error) };
		}

		// Verify Turn
		const turnAuth = authorizeDisputeTurn(dispute, userType);
		if (!turnAuth.authorized) { return { success: false, error: t(turnAuth.error) };
		}

		await disputeRepository.addMessage(disputeId, userId, message);

		revalidatePath(`/dashboard/admin/disputes/${disputeId}`);

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: t("action_error_30") };
	}
}

export async function changeDisputeTurn(
	disputeId: string,
	turn: "BOTH" | "PARENT" | "TEACHER" | "NONE",
): Promise<ActionResponse> {
    const t = await getErrorT();
	try {
		await requireAuth([UserType.ADMIN]);

		const dispute = await disputeRepository.findById(disputeId);

		if (!dispute) {
			return { success: false, error: t("action_error_31") };
		}

		if (dispute.status !== "OPEN") {
			return {
				success: false,
				error: t("action_error_32"),
			};
		}

		await disputeRepository.updateTurn(disputeId, turn);

		revalidatePath(`/dashboard/disputes/${disputeId}`);

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: t("action_error_33") };
	}
}

export async function resolveDispute(
	data: z.infer<typeof resolveDisputeSchema>,
): Promise<ActionResponse> {
    const t = await getErrorT();
	try {
		const validated = resolveDisputeSchema.safeParse(data);
		if (!validated.success) {
			const tVal = await getValidationT();
			return { success: false, error: tVal(validated.error.issues[0].message) };
		}

		const { userId } = await requireAuth([UserType.ADMIN]);
		const { disputeId, decision, adminNotes } = validated.data;

		const dispute = await disputeRepository.findByIdForResolution(disputeId);

		if (!dispute) {
			return { success: false, error: t("action_error_34") };
		}

		if (dispute.status !== DisputeStatus.OPEN) {
			return { success: false, error: t("action_error_35") };
		}

		await disputeRepository.resolveWithTransaction({
			disputeId,
			bookingId: dispute.bookingId,
			decision: decision as "RESOLVED_IN_FAVOR_OF_PARENT" | "RESOLVED_IN_FAVOR_OF_TEACHER",
			adminUserId: userId,
			adminNotes,
			bookingPrice: dispute.booking.price as any,
			parentUserId: dispute.parentUserId,
			teacherUserId: dispute.booking.teacherService.teacher.userId,
		});

		revalidatePath(`/dashboard/admin/disputes/${disputeId}`);
		revalidatePath("/dashboard/admin/financials");
		revalidatePath("/dashboard/parent/financials");
		revalidatePath("/dashboard/teacher/earnings");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: t("action_error_36") };
	}
}
