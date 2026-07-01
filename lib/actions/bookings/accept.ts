"use server";

import { BookingStatus, PaymentStatus, UserType } from "@prisma/client";
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
		const booking = await getAuthorizedBooking(bookingId, userId, userType);

		const targetStatus = booking.isTrial
			? BookingStatus.CONFIRMED
			: BookingStatus.AWAITING_PAYMENT;

		if (!isValidTransition(booking.status, targetStatus)) {
			return {
				success: false,
				error: getTransitionError(booking.status, targetStatus),
			};
		}

		if (isBookingInPast(booking.startTime, booking.duration)) {
			return {
				success: false,
				error:
					"لقد مضى موعد الجلسة بالفعل، لا يمكن قبولها الآن. سيقوم النظام بإلغائها قريباً.",
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
					"لا يمكن تأكيد الجلسة قبل إتمام الدفع أو تحقق الإدارة من إيصال التحويل",
			};
		}

		await unitOfWork.runTransaction(async (tx) => {
			const meetingUrl =
				booking.meetingUrl ||
				`https://meet.jit.si/edunest-${crypto.randomUUID()}`;

			const holdMinutes = await getSettingNumber("PAYMENT_HOLD_MINUTES", 180);

			const updateData: any = {
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
							? "تمت الموافقة على طلبك"
							: "قبول الحجز",
					message:
						targetStatus === BookingStatus.AWAITING_PAYMENT
							? `وافق المعلم على طلبك، يرجى إتمام الدفع خلال ${holdMinutes} دقيقة لتأكيد الحجز`
							: "لقد وافق المعلم على طلب حجز الجلسة وتم تأكيدها.",
				},
				tx,
			);
		});

		revalidateBookingPaths(revalidatePath);

		return { success: true };
	},
);
