"use server";

import { getErrorT, getNotificationT } from "@/lib/i18n/get-server-translations";
import { BookingStatus, PaymentStatus, UserType } from "@prisma/client";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { withAuthAction } from "@/lib/action-wrapper";
import { createNotification } from "@/lib/notifications";
import { unitOfWork } from "@/lib/repositories/unit-of-work";
import { bookingRepository } from "@/lib/repositories/prisma/booking.repository";
import { getAuthorizedBooking } from "@/lib/services/booking-service";
import {
	getTransitionError,
	isBookingInPast,
	isValidTransition,
	revalidateBookingPaths,
} from "@/lib/utils/booking-state";

export const processPayment = withAuthAction(
	[UserType.PARENT],
	async ({ userId, userType }, bookingId: string) => {
		const booking = await getAuthorizedBooking(bookingId, userId, userType);

		if (!isValidTransition(booking.status, BookingStatus.CONFIRMED)) {
			return {
				success: false,
				error: await getTransitionError(booking.status, BookingStatus.CONFIRMED),
			};
		}

		if (booking.paymentStatus !== PaymentStatus.UNPAID) {
			const tError = await getErrorT();
		return { success: false, error: tError("booking_not_awaiting_payment") };
		}

		if (isBookingInPast(booking.startTime, booking.duration)) {
			return {
				success: false,
				error:
					await (async () => { const t = await getErrorT(); return t("booking_past_time_pay"); })(),
			};
		}

		await unitOfWork.runTransaction(async (tx) => {
			// 1. تحديث جدول Payment (إن وجد) أو إنشاؤه إذا لم يكن موجوداً
			if (booking.payment) {
				await tx.payment.update({
					where: { bookingId },
					data: {
						isPaid: true,
						paidAt: new Date(),
					},
				});
			} else {
				await tx.payment.create({
					data: {
						bookingId,
						amount: booking.price,
						method: "ONLINE_CARD",
						isPaid: true,
						paidAt: new Date(),
					},
				});
			}

			// 2. تحديث حالة الدفع في جدول الحجز نفسه وتحويله لـ CONFIRMED وتوليد الرابط
			await bookingRepository.update(
				bookingId,
				{
					paymentStatus: PaymentStatus.PAID,
					status: BookingStatus.CONFIRMED,
					confirmedAt: new Date(),
					meetingUrl:
						booking.meetingUrl ||
						`https://meet.jit.si/edunest-${crypto.randomUUID()}`,
				},
				tx
			);

			// 3. إرسال إشعار للمعلم بتأكيد الحجز الفوري
			const isImmediate = booking.startTime <= new Date(Date.now() + 5 * 60000);
			await createNotification(
				{
					userId: booking.teacherService.teacher.userId,
					title: isImmediate
						? await (async () => { const t = await getNotificationT(); return t("booking_instant_started_title"); })()
						: await (async () => { const t = await getNotificationT(); return t("booking_confirmed_title"); })(),
					message: isImmediate
						? await (async () => { const t = await getNotificationT(); return t("booking_instant_started_message"); })()
						: await (async () => { const t = await getNotificationT(); return t("booking_confirmed_message"); })(),
					link: "/dashboard/teacher/bookings",
				},
				tx,
			);
		});

		revalidateBookingPaths(revalidatePath);

		return { success: true };
	},
);
