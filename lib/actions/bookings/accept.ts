"use server";

import { getErrorT, getNotificationT } from "@/lib/i18n/get-server-translations";
import { Prisma, BookingStatus, PaymentStatus, UserType } from "@prisma/client";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { withAuthAction } from "@/lib/action-wrapper";
import { createNotification } from "@/lib/notifications";
import { bookingRepository } from "@/lib/repositories/prisma/booking.repository";
import { unitOfWork } from "@/lib/repositories/unit-of-work";
import { getAuthorizedBooking } from "@/lib/services/booking-service";
import { getSettingNumber } from "@/lib/settings";
import {
	getTransitionError,
	isBookingInPast,
	isValidTransition,
	revalidateBookingPaths,
} from "@/lib/utils/booking-state";

export const acceptBooking = withAuthAction(
	[UserType.TEACHER],
	async ({ userId, userType }, bookingId: string) => {
        const t = await getErrorT();
		const booking = await getAuthorizedBooking(bookingId, userId, userType);

		const targetStatus = booking.isTrial
			? BookingStatus.CONFIRMED
			: BookingStatus.AWAITING_PAYMENT;

		if (!isValidTransition(booking.status, targetStatus)) {
			return {
				success: false,
				error: await getTransitionError(booking.status, targetStatus),
			};
		}

		if (isBookingInPast(booking.startTime, booking.duration)) {
			return {
				success: false,
				error:
					t("booking_past_time_accept"),
			};
		}

		if (
			booking.paymentStatus === PaymentStatus.UNPAID &&
			targetStatus === BookingStatus.CONFIRMED &&
			!booking.isTrial
		) {
			return {
				success: false,
				error:
					t("booking_cannot_confirm_unpaid"),
			};
		}

		await unitOfWork.runTransaction(async (tx) => {
            const t = await getNotificationT();
			const meetingUrl =
				booking.meetingUrl ||
				`https://meet.jit.si/edunest-${crypto.randomUUID()}`;

			const holdMinutes = await getSettingNumber("PAYMENT_HOLD_MINUTES", 180);

			const updateData: Prisma.BookingUpdateInput = {
				status: targetStatus,
				meetingUrl,
			};

			if (targetStatus === BookingStatus.AWAITING_PAYMENT) {
				// Set payment deadline based on policy
				const deadline = new Date();
				deadline.setMinutes(deadline.getMinutes() + holdMinutes);
				updateData.paymentDeadline = deadline;
			} else if (targetStatus === BookingStatus.CONFIRMED) {
				updateData.confirmedAt = new Date();
			}

			await bookingRepository.update(bookingId, updateData, tx);

			await createNotification(
				{
					userId: booking.parentUserId,
					title:
						targetStatus === BookingStatus.AWAITING_PAYMENT
							? t("booking_approved_title")
							: t("booking_accepted_title"),
					message:
						targetStatus === BookingStatus.AWAITING_PAYMENT
							? t("booking_accepted_pay_message", { holdMinutes })
							: t("booking_approved_message"),
				},
				tx,
			);
		});

		revalidateBookingPaths(revalidatePath);

		return { success: true };
	},
);
