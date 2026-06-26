"use server";

import { BookingStatus, PaymentStatus, UserType } from "@prisma/client";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { withAuthAction } from "@/lib/action-wrapper";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getAuthorizedBooking } from "@/lib/services/booking-service";
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

		if (!isValidTransition(booking.status, BookingStatus.CONFIRMED)) {
			return {
				success: false,
				error: getTransitionError(booking.status, BookingStatus.CONFIRMED),
			};
		}

		if (isBookingInPast(booking.startTime)) {
			return {
				success: false,
				error:
					"لقد مضى موعد الجلسة بالفعل، لا يمكن قبولها الآن. سيقوم النظام بإلغائها قريباً.",
			};
		}

		if (booking.paymentStatus === PaymentStatus.UNPAID && !booking.isTrial) {
			return {
				success: false,
				error:
					"لا يمكن تأكيد الجلسة قبل إتمام الدفع أو تحقق الإدارة من إيصال التحويل",
			};
		}

		await prisma.$transaction(async (tx) => {
			const meetingUrl =
				booking.meetingUrl ||
				`https://meet.jit.si/edunest-${crypto.randomUUID()}`;

			await tx.booking.update({
				where: { id: bookingId },
				data: {
					status: BookingStatus.CONFIRMED,
					confirmedAt: new Date(),
					meetingUrl,
				},
			});

			await createNotification(
				{
					userId: booking.parentUserId,
					title: "قبول الحجز",
					message: "لقد وافق المعلم على طلب حجز الجلسة بنجاح.",
				},
				tx,
			);
		});

		revalidateBookingPaths(revalidatePath);

		return { success: true };
	},
);
