"use server";

import {
	BookingSource,
	BookingStatus,
	type PaymentMethod,
	PaymentStatus,
	UserType,
} from "@prisma/client";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { withAuthAction } from "@/lib/action-wrapper";
import { createNotification } from "@/lib/notifications";
import { unitOfWork } from "@/lib/repositories/unit-of-work";
import { bookingRepository } from "@/lib/repositories/prisma/booking.repository";
import { prisma } from "@/lib/prisma";
import { getSettingNumber } from "@/lib/settings";
import { checkTeacherAvailability } from "@/lib/utils/availability";
import {
	calculateBookingFinancials,
	hasTimeOverlap,
} from "@/lib/utils/booking-logic";
import { revalidateBookingPaths } from "@/lib/utils/booking-state";
import { hoursUntil } from "@/lib/utils/time";
import { bookingSchema } from "@/lib/validations/booking";
import { getErrorT, getNotificationT } from "@/lib/i18n/get-server-translations";

export const createBooking = withAuthAction(
	[UserType.PARENT],
	async (
		{ userId: parentUserId },
		data: z.infer<typeof bookingSchema> & {
			paymentMethod: PaymentMethod;
			bankTransferProofUrl?: string;
		},
	) => {
		const tError = await getErrorT();
		const tNotif = await getNotificationT();

		const validated = bookingSchema.safeParse(data);
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		const {
			studentId,
			teacherServiceId,
			startTime,
			isTrial,
			questionTitle,
			questionDetails,
			questionImageUrl,
			parentNotes,
		} = validated.data;

		// 1. Check lead time restriction
		const minLeadHours = await getSettingNumber("MinBookingLeadHours", 2);
		if (hoursUntil(startTime) < minLeadHours) {
			return {
				success: false,
				error: tError('booking_min_lead_time', { minLeadHours }),
			};
		}

		// 2. Fetch parent, student, and teacher service details
		const student = await prisma.student.findUnique({
			where: { id: studentId, parentUserId, isActive: true },
		});
		if (!student) {
			return {
				success: false,
				error: tError('booking_student_not_found'),
			};
		}

		const teacherService = await prisma.teacherService.findUnique({
			where: { id: teacherServiceId, isActive: true },
			include: {
				serviceType: true,
				teacher: {
					select: { id: true, userId: true, slug: true, isVerified: true },
				},
			},
		});
		if (!teacherService) {
			return { success: false, error: tError('booking_service_not_found') };
		}
		if (!teacherService.teacher.isVerified) {
			return {
				success: false,
				error: tError('booking_teacher_not_verified'),
			};
		}

		const teacherId = teacherService.teacher.id;

		// 3. Verify service-specific requirements
		if (teacherService.serviceType.name === "شرح مسألة سريعة") {
			if (!questionTitle || !questionDetails) {
				return {
					success: false,
					error: tError('booking_question_fields_required'),
				};
			}
		}

		// 4. Calculate Financials using unified logic
		const parentUser = await prisma.user.findUnique({
			where: { id: parentUserId },
		});
		if (!parentUser) {
			return { success: false, error: tError('user_not_found') };
		}

		let financials;
		try {
			financials = await calculateBookingFinancials(
				isTrial,
				teacherService.serviceType.name,
				Number(teacherService.price),
				teacherService.duration,
				parentUser.hasUsedFreeTrial,
			);
		} catch (err: unknown) {
			return {
				success: false,
				error:
					err instanceof Error
						? err.message
						: tError('booking_financial_calc_error'),
			};
		}

		const { duration, price, appliedCommissionRate, trialCostToPlatform } =
			financials;

		// 5. Check Weekly Recurring Availability
		const availabilityCheck = await checkTeacherAvailability(
			teacherId,
			startTime,
			duration,
		);
		if (!availabilityCheck.available) {
			return {
				success: false,
				error: availabilityCheck.reason || tError('booking_time_unavailable'),
			};
		}

		// 6. Calculate range for overlap check
		const dayStart = new Date(startTime.getTime() - 24 * 3600 * 1000);
		const dayEnd = new Date(startTime.getTime() + 24 * 3600 * 1000);

		// Determine initial payment status
		let paymentStatus: PaymentStatus = PaymentStatus.UNPAID;
		if (isTrial) {
			paymentStatus = PaymentStatus.PAID; // Trials require no parent payment
		}

		// 7. Save booking inside a transaction (handling race conditions)
		const newBooking = await unitOfWork.runTransaction(async (tx) => {
			// Acquire exclusive row locks
			await tx.$executeRaw`SELECT id FROM "users" WHERE id = ${parentUserId} FOR UPDATE`;
			await tx.$executeRaw`SELECT id FROM "teachers" WHERE id = ${teacherId} FOR UPDATE`;

			// Verify trial usage inside transaction to prevent parallel booking bypass
			if (isTrial) {
				const lockedParent = await tx.user.findUnique({
					where: { id: parentUserId },
				});
				if (!lockedParent) {
					throw new Error(tError('user_not_found'));
				}
				if (lockedParent.hasUsedFreeTrial) {
					throw new Error(tError('booking_trial_already_used'));
				}

				// Mark parent as having used trial
				await tx.user.update({
					where: { id: parentUserId },
					data: { hasUsedFreeTrial: true },
				});
			}

			// Check overlapping bookings inside transaction (fully locked)
			const activeBookings = await bookingRepository.findActiveByTeacherId(
				teacherId,
				dayStart,
				dayEnd,
				tx
			);

			for (const b of activeBookings) {
				const hasOverlap = hasTimeOverlap(
					startTime,
					duration,
					b.startTime,
					b.duration,
				);
				if (hasOverlap) {
					throw new Error(tError('booking_teacher_has_overlap'));
				}
			}

			// Check overlapping bookings for the student
			const studentActiveBookings = await bookingRepository.findActiveByStudentId(
				studentId,
				dayStart,
				dayEnd,
				tx
			);

			for (const b of studentActiveBookings) {
				const hasOverlap = hasTimeOverlap(
					startTime,
					duration,
					b.startTime,
					b.duration,
				);
				if (hasOverlap) {
					throw new Error(tError('booking_student_has_overlap'));
				}
			}

			// Create Booking
			const booking = await bookingRepository.create({
				parentUserId,
				studentId,
				teacherServiceId,
				startTime,
				duration,
				price,
				appliedCommissionRate,
				isTrial,
				trialCostToPlatform,
				questionTitle,
				questionDetails,
				questionImageUrl,
				parentNotes,
				status: isTrial ? BookingStatus.CONFIRMED : BookingStatus.PENDING_APPROVAL,
				confirmedAt: isTrial ? new Date() : null,
				paymentStatus,
				bookingSource: BookingSource.WEB,
				meetingUrl: isTrial
					? `https://meet.jit.si/edunest-${crypto.randomUUID()}`
					: null,
			}, tx);

			// Create Payment if not trial
			if (!isTrial) {
				await tx.payment.create({
					data: {
						bookingId: booking.id,
						amount: price,
						method: data.paymentMethod,
						isPaid: paymentStatus === PaymentStatus.PAID,
					},
				});
			}

			return booking;
		});

		// Send notification to Tutor (outside transaction)
		await createNotification({
			userId: teacherService.teacher.userId,
			title: tNotif('new_booking_title'),
			message: tNotif('new_booking_message', { startTime: startTime.toLocaleString("ar-EG") }),
			link: "/dashboard/teacher/requests",
		});

		revalidateBookingPaths(revalidatePath);
		revalidatePath(`/teachers/${teacherService.teacher.slug}`);

		return { success: true, data: { bookingId: newBooking.id } };
	},
);
