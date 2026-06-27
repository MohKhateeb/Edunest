"use server";

import { EscrowResolution, PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function resolveEscrow(
	escrowId: string,
	resolution: EscrowResolution,
	notes?: string,
) {
	const user = await requireAuth(["ADMIN"]);

	if (user.userType !== "ADMIN") {
		throw new Error("Unauthorized");
	}

	if (resolution === EscrowResolution.PENDING) {
		throw new Error("Invalid resolution state");
	}

	const escrow = await prisma.adminEscrow.findUnique({
		where: { id: escrowId },
		include: { booking: true },
	});

	if (!escrow) {
		throw new Error("Escrow not found");
	}

	if (escrow.status !== EscrowResolution.PENDING) {
		throw new Error("Escrow already resolved");
	}

	await prisma.$transaction(async (tx) => {
		// Update Escrow
		await tx.adminEscrow.update({
			where: { id: escrowId },
			data: {
				status: resolution,
				resolvedAt: new Date(),
				resolvedBy: user.userId,
				notes,
			},
		});

		// Apply Resolution
		if (resolution === EscrowResolution.REFUNDED_TO_PARENT) {
			// This refunds to parent's wallet
			await tx.parentRefund.create({
				data: {
					bookingId: escrow.bookingId,
					amount: escrow.amount,
					isPaid: false,
				},
			});
			// Booking was already cancelled by cron, payment status was set to REFUNDED.
		} else if (resolution === EscrowResolution.PAID_TO_TEACHER) {
			// Actually we don't have a direct 'pay to teacher for cancelled booking' flow.
			// The teacher gets paid via Payouts. If the booking is cancelled, they wouldn't normally get paid.
			// We can create a manual credit or just change booking status to COMPLETED and let Payout system handle it.
			// For simplicity and auditability, we change booking back to COMPLETED so it gets cleared.
			await tx.booking.update({
				where: { id: escrow.bookingId },
				data: {
					status: "COMPLETED",
					paymentStatus: PaymentStatus.PAID,
					cancellationReason: null, // clear cancellation
				},
			});
			// Note: Escrow didn't store paymentId directly, let's update Payment
			await tx.payment.updateMany({
				where: { bookingId: escrow.bookingId },
				data: { isPaid: true },
			});
		} else if (resolution === EscrowResolution.PLATFORM_PROFIT) {
			// No action needed for parent or teacher. The platform keeps the money.
			// Booking remains Cancelled, PaymentStatus is considered 'Platform Profit' or we leave it.
		}
	});

	revalidatePath("/dashboard/admin/escrow");
	return { success: true };
}
