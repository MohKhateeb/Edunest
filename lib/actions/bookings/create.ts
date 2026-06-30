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

export const createBooking = withAuthAction(
	[UserType.PARENT],
	async (
		{ userId: parentUserId },
		data: z.infer<typeof bookingSchema> & {
			paymentMethod: PaymentMethod;
			bankTransferProofUrl?: string;
		},
	) => {
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
				error: `يجب أن يكون موعد الحجز بعد ${minLeadHours} ساعات على الأقل من الآن`,
			};
		}

		// 2. Fetch parent, student, and teacher service details
		const student = await prisma.student.findUnique({
			where: { id: studentId, parentUserId, isActive: true },
		});
		if (!student) {
			return {
				success: false,
				error: "الطالب المحدد غير موجود أو غير تابع لك",
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
			return { success: false, error: "الخدمة المطلوبة غير متوفرة" };
		}
		if (!teacherService.teacher.isVerified) {
			return {
				success: false,
				error: "المعلم لم يتم توثيقه بعد ولا يمكن حجز جلسات معه حالياً",
			};
		}

		const teacherId = teacherService.teacher.id;

		// 3. Verify service-specific requirements
		if (teacherService.serviceType.name === "شرح مسألة سريعة") {
			if (!questionTitle || !questionDetails) {
				return {
					success: false,
					error: "حقول عنوان وتفاصيل السؤال إلزامية لخدمة شرح المسألة السريعة",
				};
			}
		}

		// 4. Calculate Financials using unified logic
		const parentUser = await prisma.user.findUnique({
			where: { id: parentUserId },
		});
		if (!parentUser) {
			return { success: false, error: "المستخدم غير موجود" };
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
						: "حدث خطأ أثناء حساب التكاليف المالية",
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
				error: availabilityCheck.reason || "الوقت المحدد غير متاح",
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
					throw new Error("المستخدم غير موجود");
				}
				if (lockedParent.hasUsedFreeTrial) {
					throw new Error("لقد قمت باستخدام جلستك التجريبية المجانية مسبقاً");
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
					throw new Error(
						"المعلم لديه حجز آخر متداخل في هذا الوقت. يرجى اختيار وقت آخر",
					);
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
					throw new Error(
						"الطالب لديه حجز آخر متداخل في هذا الوقت مع معلم آخر. يرجى اختيار وقت آخر",
					);
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
			title: "طلب حجز جديد",
			message: `لديك طلب حجز جديد من ولي الأمر لجلسة بتاريخ ${startTime.toLocaleString("ar-EG")}`,
			link: "/dashboard/teacher/requests",
		});

		revalidateBookingPaths(revalidatePath);
		revalidatePath(`/teachers/${teacherService.teacher.slug}`);

		return { success: true, data: { bookingId: newBooking.id } };
	},
);
