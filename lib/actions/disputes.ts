"use server";

import { BookingStatus, DisputeStatus, UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/require-auth";
import type { ActionResponse } from "@/lib/types";
import { hoursUntil } from "@/lib/utils/time";
import { disputeRepository } from "@/lib/repositories/disputeRepository";

export async function getSecureDisputeDetails(id: string) {
	const { userId, userType } = await requireAuth([
		UserType.ADMIN,
		UserType.PARENT,
		UserType.TEACHER,
	]);

	const dispute = await disputeRepository.findByIdWithFullDetails(id);

	if (!dispute) return null;

	// Backend Authorization Check
	if (userType === "PARENT" && dispute.booking.parentUserId !== userId) {
		return null;
	}
	if (
		userType === "TEACHER" &&
		dispute.booking.teacherService.teacher.userId !== userId
	) {
		return null;
	}

	return dispute;
}

const createDisputeSchema = z.object({
	bookingId: z.string().min(1, "معرف الحجز مطلوب"),
	reason: z
		.string()
		.min(10, "سبب الاعتراض يجب أن يكون 10 أحرف على الأقل")
		.max(1000, "السبب طويل جداً"),
});

const sendMessageSchema = z.object({
	disputeId: z.string().min(1, "معرف النزاع مطلوب"),
	message: z
		.string()
		.min(1, "الرسالة لا يمكن أن تكون فارغة")
		.max(2000, "الرسالة طويلة جداً"),
});

const resolveDisputeSchema = z.object({
	disputeId: z.string().min(1, "معرف النزاع مطلوب"),
	decision: z.enum([
		"RESOLVED_IN_FAVOR_OF_PARENT",
		"RESOLVED_IN_FAVOR_OF_TEACHER",
	]),
	adminNotes: z.string().optional(),
});

export async function createDispute(
	data: z.infer<typeof createDisputeSchema>,
): Promise<ActionResponse> {
	try {
		const validated = createDisputeSchema.safeParse(data);
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		const { userId } = await requireAuth([UserType.PARENT]);
		const { bookingId, reason } = validated.data;

		// 1. Verify booking ownership and status
		const booking = await disputeRepository.findBookingWithDisputeAndTeacher(bookingId);

		if (!booking || booking.parentUserId !== userId) {
			return {
				success: false,
				error: "الحجز غير موجود أو لا تملك صلاحية الوصول إليه.",
			};
		}

		if (booking.status !== BookingStatus.COMPLETED) {
			return {
				success: false,
				error: "لا يمكن تقديم اعتراض إلا على الحجوزات المكتملة.",
			};
		}

		if (booking.payoutId) {
			return {
				success: false,
				error: "تم تسوية هذا الحجز مالياً مسبقاً ولا يمكن الاعتراض عليه الآن.",
			};
		}

		if (booking.dispute) {
			return { success: false, error: "يوجد اعتراض مسبق على هذا الحجز." };
		}

		// 2. Strict Date Validation: Only within 24 hours of completion
		if (!booking.completedAt) {
			return { success: false, error: "تاريخ اكتمال الجلسة غير متوفر." };
		}

		// hoursUntil returns (completedAt - now) in hours. It should be negative since completed in past.
		// So if it was completed 25 hours ago, hoursUntil is -25.
		// If it was completed 2 hours ago, hoursUntil is -2.
		// We want to allow if hoursUntil >= -24 (i.e. within the last 24h)
		if (hoursUntil(booking.completedAt) < -24) {
			return {
				success: false,
				error: "انتهت فترة السماح (24 ساعة) لتقديم اعتراض على هذه الجلسة.",
			};
		}

		// 3. Create Dispute and first message
		await disputeRepository.createWithInitialMessage({
			bookingId,
			parentUserId: userId,
			reason,
			teacherUserId: booking.teacherService.teacher.userId,
		});

		revalidatePath("/dashboard/parent/financials");
		revalidatePath("/dashboard/teacher/earnings");
		revalidatePath("/dashboard/admin/financials");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: "حدث خطأ أثناء تقديم الاعتراض" };
	}
}

export async function sendDisputeMessage(
	data: z.infer<typeof sendMessageSchema>,
): Promise<ActionResponse> {
	try {
		const validated = sendMessageSchema.safeParse(data);
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		const { userId, userType } = await requireAuth([
			UserType.PARENT,
			UserType.TEACHER,
			UserType.ADMIN,
		]);
		const { disputeId, message } = validated.data;

		const dispute = await disputeRepository.findByIdWithBookingAccess(disputeId);

		if (!dispute) {
			return { success: false, error: "النزاع غير موجود." };
		}

		if (dispute.status !== DisputeStatus.OPEN) {
			return {
				success: false,
				error: "المحادثة مغلقة للنزاعات التي تم البت فيها (للقراءة فقط).",
			};
		}

		// Verify access
		if (userType === UserType.PARENT && dispute.parentUserId !== userId) {
			return { success: false, error: "غير مصرح." };
		}
		if (
			userType === UserType.TEACHER &&
			dispute.booking.teacherService.teacher.userId !== userId
		) {
			return { success: false, error: "غير مصرح." };
		}

		// Verify Turn
		if (userType !== UserType.ADMIN) {
			if (dispute.allowedTurn === "NONE") {
				return {
					success: false,
					error: "المحادثة مغلقة من قبل الإدارة حالياً.",
				};
			}
			if (dispute.allowedTurn === "PARENT" && userType !== UserType.PARENT) {
				return {
					success: false,
					error: "عذراً، الإدارة تنتظر رد ولي الأمر الآن. لا يمكنك الإرسال.",
				};
			}
			if (dispute.allowedTurn === "TEACHER" && userType !== UserType.TEACHER) {
				return {
					success: false,
					error: "عذراً، الإدارة تنتظر رد المعلم الآن. لا يمكنك الإرسال.",
				};
			}
		}

		await disputeRepository.addMessage(disputeId, userId, message);

		revalidatePath(`/dashboard/admin/disputes/${disputeId}`);

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: "حدث خطأ أثناء إرسال الرسالة" };
	}
}

export async function changeDisputeTurn(
	disputeId: string,
	turn: "BOTH" | "PARENT" | "TEACHER" | "NONE",
): Promise<ActionResponse> {
	try {
		await requireAuth([UserType.ADMIN]);

		const dispute = await disputeRepository.findById(disputeId);

		if (!dispute) {
			return { success: false, error: "النزاع غير موجود." };
		}

		if (dispute.status !== "OPEN") {
			return {
				success: false,
				error: "لا يمكن تغيير دور المحادثة لنزاع مغلق.",
			};
		}

		await disputeRepository.updateTurn(disputeId, turn);

		revalidatePath(`/dashboard/disputes/${disputeId}`);

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: "حدث خطأ أثناء تغيير صلاحيات المحادثة" };
	}
}

export async function resolveDispute(
	data: z.infer<typeof resolveDisputeSchema>,
): Promise<ActionResponse> {
	try {
		const validated = resolveDisputeSchema.safeParse(data);
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		const { userId } = await requireAuth([UserType.ADMIN]);
		const { disputeId, decision, adminNotes } = validated.data;

		const dispute = await disputeRepository.findByIdForResolution(disputeId);

		if (!dispute) {
			return { success: false, error: "النزاع غير موجود." };
		}

		if (dispute.status !== DisputeStatus.OPEN) {
			return { success: false, error: "تم البت في هذا النزاع مسبقاً." };
		}

		await disputeRepository.resolveWithTransaction({
			disputeId,
			bookingId: dispute.bookingId,
			decision: decision as "RESOLVED_IN_FAVOR_OF_PARENT" | "RESOLVED_IN_FAVOR_OF_TEACHER",
			adminUserId: userId,
			adminNotes,
			bookingPrice: dispute.booking.price as any,
			parentUserId: dispute.parentUserId,
			teacherUserId: dispute.booking.teacherService.teacher.userId,
		});

		revalidatePath(`/dashboard/admin/disputes/${disputeId}`);
		revalidatePath("/dashboard/admin/financials");
		revalidatePath("/dashboard/parent/financials");
		revalidatePath("/dashboard/teacher/earnings");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: "حدث خطأ أثناء حسم النزاع" };
	}
}
