"use server";
import { getErrorT, getNotificationT } from "@/lib/i18n/get-server-translations";
import { UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireTeacherProfile } from "@/lib/actions/auth-helpers";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import type { ActionResponse } from "@/lib/types";
import { calculateEarnings } from "@/lib/utils/financial";
import { createPayoutSchema, payoutIdSchema } from "@/lib/validations/payout";

export async function createTeacherPayout(data: {
	teacherId: string;
	bookingIds: string[];
}): Promise<ActionResponse> {
	try {
		const validated = createPayoutSchema.safeParse(data);
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		await requireAuth([UserType.ADMIN]);
		const { teacherId, bookingIds } = data;

		await prisma.$transaction(async (tx) => {
			await tx.$executeRaw`SELECT id FROM "teachers" WHERE id = ${teacherId} FOR UPDATE`;

			// Fetch the selected bookings to verify they belong to the teacher and are eligible
			const bookings = await tx.booking.findMany({
				where: {
					id: { in: bookingIds },
					teacherService: { teacherId },
					status: "COMPLETED",
					payoutId: null,
					OR: [{ paymentStatus: "PAID" }, { isTrial: true }],
				},
			});

			if (bookings.length !== bookingIds.length) {
				throw new Error(
					await (async () => { const t = await getErrorT(); return t("payout_invalid_sessions"); })(),
				);
			}

			let totalAmount = 0;
			let commissionAmount = 0;
			let trialCompensation = 0;
			let minStartTime = bookings[0].startTime;
			let maxStartTime = bookings[0].startTime;

			for (const b of bookings) {
				if (b.startTime < minStartTime) minStartTime = b.startTime;
				if (b.startTime > maxStartTime) maxStartTime = b.startTime;

				const earnings = calculateEarnings(
					Number(b.price),
					Number(b.appliedCommissionRate),
					b.isTrial,
					Number(b.trialCostToPlatform),
				);

				totalAmount += earnings.totalAmount;
				commissionAmount += earnings.commissionAmount;
				trialCompensation += earnings.trialCompensation;
			}

			const netAmount =
				Math.round((totalAmount - commissionAmount) * 100) / 100;

			// Create the Payout record
			const payout = await tx.teacherPayout.create({
				data: {
					teacherId,
					totalAmount,
					commissionAmount,
					trialCompensation,
					netAmount,
					periodStart: minStartTime,
					periodEnd: maxStartTime,
					isPaid: false,
				},
			});

			// Link all included bookings to this payoutId
			await tx.booking.updateMany({
				where: {
					id: { in: bookingIds },
				},
				data: {
					payoutId: payout.id,
				},
			});
		});

		revalidatePath("/dashboard/admin/payouts");
		revalidatePath("/dashboard/teacher/earnings");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		const msg =
			err instanceof Error ? err.message : await (async () => { const t = await getErrorT(); return t("action_error_51"); })();
		return { success: false, error: msg };
	}
}

export async function markPayoutAsPaid(
	payoutId: string,
): Promise<ActionResponse> {
	try {
		const validated = payoutIdSchema.safeParse({ payoutId });
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		await requireAuth([UserType.ADMIN]);

		const payout = await prisma.teacherPayout.findUnique({
			where: { id: payoutId },
		});

		if (!payout) {
			return { success: false, error: await (async () => { const t = await getErrorT(); return t("action_error_45"); })() };
		}

		if (payout.isPaid) {
			return { success: false, error: await (async () => { const t = await getErrorT(); return t("action_error_46"); })() };
		}

		await prisma.teacherPayout.update({
			where: { id: payoutId },
			data: {
				isPaid: true,
				paidAt: new Date(),
			},
		});

		revalidatePath("/dashboard/admin/payouts");
		revalidatePath("/dashboard/teacher/earnings");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: await (async () => { const t = await getErrorT(); return t("action_error_47"); })() };
	}
}

export async function markParentRefundAsPaid(
	refundId: string,
): Promise<ActionResponse> {
	try {
		const validated = payoutIdSchema.safeParse({ payoutId: refundId });
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		await requireAuth([UserType.ADMIN]);

		const refund = await prisma.parentRefund.findUnique({
			where: { id: refundId },
		});

		if (!refund) {
			return { success: false, error: await (async () => { const t = await getErrorT(); return t("action_error_48"); })() };
		}

		if (refund.isPaid) {
			return { success: false, error: await (async () => { const t = await getErrorT(); return t("action_error_49"); })() };
		}

		await prisma.parentRefund.update({
			where: { id: refundId },
			data: {
				isPaid: true,
				paidAt: new Date(),
			},
		});

		revalidatePath("/dashboard/admin/payouts");
		revalidatePath("/dashboard/parent/financials");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: await (async () => { const t = await getErrorT(); return t("action_error_50"); })() };
	}
}
