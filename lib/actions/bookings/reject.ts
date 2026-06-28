"use server";

import { BookingStatus, PaymentStatus, UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { withAuthAction } from "@/lib/action-wrapper";
import { createNotification } from "@/lib/notifications";
import { unitOfWork } from "@/lib/repositories/unit-of-work";
import { bookingRepository } from "@/lib/repositories/prisma/booking.repository";
import { getAuthorizedBooking } from "@/lib/services/booking-service";
import {
	getTransitionError,
	isValidTransition,
	revalidateBookingPaths,
} from "@/lib/utils/booking-state";

export const rejectBooking = withAuthAction(
	[UserType.TEACHER],
	async ({ userId, userType }, bookingId: string) => {
		const booking = await getAuthorizedBooking(bookingId, userId, userType);

		if (!isValidTransition(booking.status, BookingStatus.REJECTED)) {
			return {
				success: false,
				error: getTransitionError(booking.status, BookingStatus.REJECTED),
			};
		}

		await unitOfWork.runTransaction(async (tx) => {
			await bookingRepository.updateStatus(bookingId, BookingStatus.REJECTED, tx);

			// If it was paid, queue for manual admin refund or handle appropriately
			if (booking.paymentStatus === PaymentStatus.PAID && !booking.isTrial) {
				await bookingRepository.update(
					bookingId,
					{ paymentStatus: PaymentStatus.REFUNDED },
					tx
				);

				// Toggle payment status
				await tx.payment.update({
					where: { bookingId },
					data: { isPaid: false },
				});
			}

			await createNotification(
				{
					userId: booking.parentUserId,
					title: "رفض الحجز",
					message: "نعتذر، لقد قام المعلم برفض طلب الحجز الخاص بك.",
				},
				tx,
			);
		});

		revalidateBookingPaths(revalidatePath);

		return { success: true };
	},
);
