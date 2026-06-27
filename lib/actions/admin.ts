"use server";

import {
	BookingStatus,
	PaymentStatus,
	UserType,
	VerificationLevel,
} from "@prisma/client";
import crypto from "crypto";
import { revalidatePath, updateTag } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import type { ActionResponse } from "@/lib/types";
import {
	confirmPaymentSchema,
	rejectTeacherSchema,
	toggleUserActiveSchema,
	updateSystemSettingsSchema,
	verifyTeacherSchema,
} from "@/lib/validations/admin";

export async function verifyTeacher(
	teacherId: string,
	level: VerificationLevel,
): Promise<ActionResponse> {
	try {
		const validated = verifyTeacherSchema.safeParse({ teacherId, level });
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		const { userId: adminUserId } = await requireAuth([UserType.ADMIN]);

		await prisma.$transaction(async (tx) => {
			// Update verification request status
			await tx.teacherVerification.update({
				where: { teacherId },
				data: {
					reviewedBy: adminUserId,
					reviewedAt: new Date(),
					rejectionReason: null,
				},
			});

			// Update teacher profile verification status
			await tx.teacher.update({
				where: { id: teacherId },
				data: {
					isVerified: true,
					verificationLevel: level,
				},
			});

			// Fetch teacher info to send notification
			const teacherProfile = await tx.teacher.findUnique({
				where: { id: teacherId },
				select: { userId: true, user: { select: { name: true } } },
			});

			if (teacherProfile) {
				await createNotification(
					{
						userId: teacherProfile.userId,
						title: "توثيق الحساب",
						message: `تهانينا! لقد تم توثيق حسابك بمستوى: ${level}`,
					},
					tx,
				);
			}
		});

		revalidatePath("/dashboard/admin/verification");
		revalidatePath("/dashboard/admin/teachers");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: "حدث خطأ أثناء توثيق المعلم" };
	}
}

export async function rejectTeacher(
	teacherId: string,
	reason: string,
): Promise<ActionResponse> {
	try {
		const validated = rejectTeacherSchema.safeParse({ teacherId, reason });
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		const { userId: adminUserId } = await requireAuth([UserType.ADMIN]);

		await prisma.$transaction(async (tx) => {
			await tx.teacherVerification.update({
				where: { teacherId },
				data: {
					reviewedBy: adminUserId,
					reviewedAt: new Date(),
					rejectionReason: reason,
				},
			});

			await tx.teacher.update({
				where: { id: teacherId },
				data: {
					isVerified: false,
					verificationLevel: VerificationLevel.NONE,
				},
			});

			const teacherProfile = await tx.teacher.findUnique({
				where: { id: teacherId },
				select: { userId: true },
			});

			if (teacherProfile) {
				await createNotification(
					{
						userId: teacherProfile.userId,
						title: "توثيق الحساب",
						message: `تم رفض طلب التوثيق للسبب التالي: ${reason}`,
					},
					tx,
				);
			}
		});

		revalidatePath("/dashboard/admin/verification");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: "حدث خطأ أثناء رفض توثيق المعلم" };
	}
}

export async function updateSystemSettings(
	settings: { settingKey: string; settingValue: string }[],
): Promise<ActionResponse> {
	try {
		const validated = updateSystemSettingsSchema.safeParse(settings);
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		const { userId: adminUserId } = await requireAuth([UserType.ADMIN]);

		await prisma.$transaction(async (tx) => {
			for (const s of settings) {
				await tx.systemSetting.update({
					where: { settingKey: s.settingKey },
					data: {
						settingValue: s.settingValue,
						updatedBy: adminUserId,
					},
				});
			}
		});

		revalidatePath("/dashboard/admin/settings");
		updateTag("system-settings");
		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: "حدث خطأ أثناء تحديث الإعدادات" };
	}
}

export async function toggleUserActive(
	targetUserId: string,
	isActive: boolean,
): Promise<ActionResponse> {
	try {
		const validated = toggleUserActiveSchema.safeParse({
			targetUserId,
			isActive,
		});
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		const { userId: adminUserId } = await requireAuth([UserType.ADMIN]);

		if (targetUserId === adminUserId) {
			return { success: false, error: "لا يمكنك حظر حسابك الشخصي" };
		}

		await prisma.user.update({
			where: { id: targetUserId },
			data: { isActive },
		});

		revalidatePath("/dashboard/admin/users");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: "حدث خطأ أثناء تعديل حالة المستخدم" };
	}
}

export async function updateHomepageLayout(
	layoutJson: string,
): Promise<ActionResponse> {
	try {
		const { userId: adminUserId } = await requireAuth([UserType.ADMIN]);

		// التحقق من صحة صيغة JSON
		try {
			JSON.parse(layoutJson);
		} catch {
			return {
				success: false,
				error: "تنسيق البيانات غير صالح (JSON غير صحيح)",
			};
		}

		await prisma.systemSetting.upsert({
			where: { settingKey: "HomepageLayout" },
			update: {
				settingValue: layoutJson,
				updatedBy: adminUserId,
			},
			create: {
				settingKey: "HomepageLayout",
				settingValue: layoutJson,
				description: "تخطيط ومحتوى الصفحة الرئيسية بتنسيق JSON الديناميكي",
				updatedBy: adminUserId,
			},
		});

		revalidatePath("/");
		revalidatePath("/dashboard/admin/settings/homepage");
		updateTag("system-settings");
		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return {
			success: false,
			error: "حدث خطأ أثناء تحديث تخطيط الصفحة الرئيسية",
		};
	}
}
