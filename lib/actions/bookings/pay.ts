"use server";

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

		if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.AWAITING_PAYMENT) {
			return { success: false, error: "لا يمكن الدفع لحجز في هذه الحالة" };
		}

		if (booking.paymentStatus !== PaymentStatus.UNPAID) {
			return { success: false, error: "هذا الحجز ليس بحالة انتظار الدفع" };
		}

		if (isBookingInPast(booking.startTime, booking.duration)) {
			return {
				success: false,
				error:
					"لقد مضى موعد الجلسة بالفعل، لا يمكن الدفع الآن. سيقوم النظام بإلغائها قريباً.",
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
						? "الجلسة الفورية بدأت الآن! 🚨"
						: "حجز جديد مؤكد! 🎉",
					message: isImmediate
						? "لقد وافقت على الطلب وقام ولي الأمر بالدفع. الجلسة بدأت فوراً، ادخل الآن وتوجه لصفحة الحجوزات لتجد الرابط!"
						: "قام ولي الأمر بدفع قيمة الحجز وتم تأكيده تلقائياً. يمكنك الآن الدخول وتجهيز الجلسة في موعدها.",
					link: "/dashboard/teacher/bookings",
				},
				tx,
			);
		});

		revalidateBookingPaths(revalidatePath);

		return { success: true };
	},
);
