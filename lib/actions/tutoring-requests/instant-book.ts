"use server";

import {
	BookingSource,
	BookingStatus,
	PaymentMethod,
	PaymentStatus,
	RequestStatus,
	UserType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireTeacherProfile } from "@/lib/actions/auth-helpers";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { getSettingNumber } from "@/lib/settings";
import type { ActionResponse } from "@/lib/types";

/**
 * دالة عبقرية: المعلم يلتقط الطلب الفوري ويتحول فوراً إلى حجز مؤكد (Live Radar V2)
 */
export async function claimLiveRequest(
	requestId: string,
): Promise<ActionResponse<{ bookingId: string }>> {
	try {
		const { userId } = await requireAuth([UserType.TEACHER]);
		const teacher = await requireTeacherProfile(userId);

		if (!teacher.isVerified) {
			return {
				success: false,
				error: "يجب توثيق حسابك أولاً لالتقاط الطلبات الفورية",
			};
		}

		// 1. استخدام Transaction مع Row-Level Lock لمنع الحجز المزدوج الكارثي
		const result = await prisma.$transaction(async (tx) => {
			// قفل صف الطلب حصرياً لمنع المعلمين الآخرين من اختطافه في نفس الثانية
			await tx.$executeRaw`SELECT id FROM "TutoringRequest" WHERE id = ${requestId} FOR UPDATE`;

			const request = await tx.tutoringRequest.findUnique({
				where: { id: requestId },
				include: { student: true, serviceType: true, parent: true },
			});

			if (!request || request.status !== RequestStatus.PENDING) {
				throw new Error("عذراً، لقد كان معلماً آخر أسرع منك والتقط هذا الطلب!");
			}

			// التحقق من مطابقة شروط التخصص والصف
			if (!teacher.subjects.some((s) => s.subjectId === request.subjectId)) {
				throw new Error("تخصصك لا يطابق التخصص المطلوب في هذا الطلب");
			}
			if (!teacher.gradeLevels.includes(request.student.grade)) {
				throw new Error(
					"المرحلة الدراسية للطالب لا تقع ضمن المراحل التي تدرسها",
				);
			}

			// تحديد السعر والمدة من الطلب (تم تحديدها مسبقاً من المنصة)
			const duration = request.duration || 30; // افتراضي 30 دقيقة
			const price = request.price || 50; // افتراضي 50 شيكل

			// التحقق من عدم تعارض وقت الجلسة الفورية مع حجوزات المعلم
			const now = new Date();
			const dayStart = new Date(now.getTime() - 24 * 3600 * 1000);
			const dayEnd = new Date(now.getTime() + 24 * 3600 * 1000);

			const activeBookings = await tx.booking.findMany({
				where: {
					teacherService: { teacherId: teacher.id },
					status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
					startTime: { gte: dayStart, lte: dayEnd },
				},
				select: { startTime: true, duration: true },
			});

			const requestedStartMs = now.getTime();
			const requestedEndMs = requestedStartMs + duration * 60_000;

			for (const b of activeBookings) {
				const otherStartMs = b.startTime.getTime();
				const otherEndMs = otherStartMs + b.duration * 60_000;

				if (
					Math.max(requestedStartMs, otherStartMs) <
					Math.min(requestedEndMs, otherEndMs)
				) {
					throw new Error(
						"لديك حجز آخر متداخل في هذا الوقت حالياً. يرجى إنهاء جلستك أولاً.",
					);
				}
			}

			// إنشاء خدمة معلم افتراضية إذا لم تكن موجودة لربط الحجز بها
			let teacherService = await tx.teacherService.findFirst({
				where: {
					teacherId: teacher.id,
					serviceTypeId: request.serviceTypeId,
					isActive: true,
				},
			});

			if (!teacherService) {
				teacherService = await tx.teacherService.create({
					data: {
						teacherId: teacher.id,
						serviceTypeId: request.serviceTypeId,
						price: price,
						duration: duration,
						customDescription: "خدمة فوري (Live Radar)",
						isActive: true,
					},
				});
			}

			const defaultComm = await getSettingNumber("DefaultCommissionRate", 15);
			const quickHelpComm = await getSettingNumber(
				"QuickHelpCommissionRate",
				20,
			);
			const commissionRate =
				request.serviceType.name === "شرح مسألة سريعة"
					? quickHelpComm
					: defaultComm;

			// إنشاء الحجز فوراً كـ PENDING بانتظار دفع ولي الأمر في الـ Lobby
			const booking = await tx.booking.create({
				data: {
					parentUserId: request.parentId,
					studentId: request.studentId,
					teacherServiceId: teacherService.id,
					startTime: now,
					duration: duration,
					price: price,
					appliedCommissionRate: commissionRate,
					status: BookingStatus.PENDING,
					paymentStatus: PaymentStatus.UNPAID,
					bookingSource: BookingSource.WEB,
					meetingUrl: null, // سيتم توليده بعد الدفع
					parentNotes: request.details,
					questionTitle: request.title,
					questionDetails: request.details,
					questionImageUrl: request.imageUrl,
				},
			});

			// إنشاء سجل الدفع
			await tx.payment.create({
				data: {
					bookingId: booking.id,
					amount: price,
					method: PaymentMethod.ONLINE_CARD,
					isPaid: false,
				},
			});

			// تغيير حالة الطلب ليختفي من الرادار للمعلمين الآخرين!
			await tx.tutoringRequest.update({
				where: { id: request.id },
				data: { status: RequestStatus.ACCEPTED },
			});

			// إشعار فوري لولي الأمر (بينما هو ينتظر في اللوبي)
			await createNotification(
				{
					userId: request.parentId,
					title: "⚡ تم العثور على معلم!",
					message: `تم التطابق مع المعلم ${teacher.user.name}. يرجى إتمام الدفع فوراً للدخول إلى الجلسة. المعلم بانتظارك الآن!`,
					link: `/dashboard/session/${booking.id}`,
				},
				tx,
			);

			return booking;
		});

		revalidatePath("/dashboard/parent/live");
		revalidatePath("/dashboard/teacher/live");

		return { success: true, data: { bookingId: result.id } };
	} catch (error: unknown) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "حدث خطأ أثناء التقاط الطلب",
		};
	}
}
