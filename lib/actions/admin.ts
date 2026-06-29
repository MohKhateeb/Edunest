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
import { systemSettingRepository } from "@/lib/repositories/prisma/system-setting.repository";
import { teacherVerificationRepository } from "@/lib/repositories/prisma/teacher-verification.repository";
import { teacherRepository } from "@/lib/repositories/prisma/teacher.repository";
import { userRepository } from "@/lib/repositories/prisma/user.repository";
import { unitOfWork } from "@/lib/repositories/unit-of-work";
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

		await unitOfWork.runTransaction(async (tx) => {
			// Update verification request status
			await teacherVerificationRepository.update(teacherId, {
				reviewedBy: adminUserId,
				reviewedAt: new Date(),
				rejectionReason: null,
			}, tx);

			// Update teacher profile verification status
			const teacherProfile = await teacherRepository.update(teacherId, {
				isVerified: true,
				verificationLevel: level,
			}, tx);

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

		await unitOfWork.runTransaction(async (tx) => {
			await teacherVerificationRepository.update(teacherId, {
				reviewedBy: adminUserId,
				reviewedAt: new Date(),
				rejectionReason: reason,
			}, tx);

			const teacherProfile = await teacherRepository.update(teacherId, {
				isVerified: false,
				verificationLevel: VerificationLevel.NONE,
			}, tx);

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

		await unitOfWork.runTransaction(async (tx) => {
			for (const s of settings) {
				await systemSettingRepository.update(s.settingKey, {
					settingValue: s.settingValue,
					updatedBy: adminUserId,
				}, tx);
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

		await userRepository.update(targetUserId, { isActive });

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

		await systemSettingRepository.upsert(
			"HomepageLayout",
			layoutJson,
			"تخطيط ومحتوى الصفحة الرئيسية بتنسيق JSON الديناميكي",
			adminUserId
		);

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
