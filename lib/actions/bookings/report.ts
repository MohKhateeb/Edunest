"use server";

import { BookingStatus, UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { withAuthAction } from "@/lib/action-wrapper";
import { createNotification } from "@/lib/notifications";
import { unitOfWork } from "@/lib/repositories/unit-of-work";
import { bookingRepository } from "@/lib/repositories/prisma/booking.repository";
import {
	canSubmitReport,
	getTransitionError,
	isValidTransition,
	revalidateBookingPaths,
} from "@/lib/utils/booking-state";
import { reportSchema } from "@/lib/validations/booking";

export const submitSessionReport = withAuthAction(
	[UserType.TEACHER],
	async ({ userId }, data: z.infer<typeof reportSchema>) => {
		const validated = reportSchema.safeParse(data);
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		const {
			bookingId,
			studentAttended,
			topicsCovered,
			studentPerformance,
			homeworkAssigned,
			teacherNotes,
		} = validated.data;

		const booking = await bookingRepository.findById(
			bookingId,
			{
				include: {
					teacherService: {
						include: { teacher: true },
					},
				},
			}
		);

		if (!booking || booking.teacherService.teacher.userId !== userId) {
			return { success: false, error: "الحجز غير موجود أو غير تابع لك" };
		}

		if (!isValidTransition(booking.status, BookingStatus.COMPLETED)) {
			return {
				success: false,
				error: getTransitionError(booking.status, BookingStatus.COMPLETED),
			};
		}

		if (!canSubmitReport(booking.startTime, booking.duration)) {
			return {
				success: false,
				error: "لا يمكن تقديم التقرير قبل انتهاء وقت الجلسة الفعلي",
			};
		}

		// Save report and mark booking COMPLETED in transaction
		await unitOfWork.runTransaction(async (tx) => {
			// 1. Create session report
			await tx.sessionReport.create({
				data: {
					bookingId,
					studentAttended,
					topicsCovered,
					studentPerformance,
					homeworkAssigned,
					teacherNotes,
				},
			});

			// 2. Mark booking completed
			await bookingRepository.update(
				bookingId,
				{
					status: BookingStatus.COMPLETED,
					completedAt: new Date(),
				},
				tx
			);

			// Increment teacher total sessions completed
			await tx.teacher.update({
				where: { id: booking.teacherService.teacherId },
				data: {
					totalSessions: { increment: 1 },
				},
			});

			// 3. Notify parent with report details
			await createNotification(
				{
					userId: booking.parentUserId,
					title: "تقرير الجلسة التعليمية جاهز",
					message: `قام المعلم برفع تقرير الحصة للطالب. يرجى مراجعة تفاصيل الجلسة.`,
				},
				tx,
			);
		});

		revalidateBookingPaths(revalidatePath);

		return { success: true };
	},
);
