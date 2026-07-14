"use server";
import { getErrorT, getNotificationT, getValidationT } from "@/lib/i18n/get-server-translations";
import {
	BookingStatus,
	PaymentStatus,
	UserType,
	VerificationLevel,
	Currency,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { revalidatePath, updateTag } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { systemSettingRepository } from "@/lib/repositories/prisma/system-setting.repository";
import { teacherVerificationRepository } from "@/lib/repositories/prisma/teacher-verification.repository";
import { teacherRepository } from "@/lib/repositories/prisma/teacher.repository";
import { userRepository } from "@/lib/repositories/prisma/user.repository";
import { unitOfWork } from "@/lib/repositories/unit-of-work";
import { requireAuth } from "@/lib/require-auth";
import { BookingService, type BookingListParams } from "@/lib/services/domain/booking-service";
import { sanitizePrismaData } from "@/lib/utils";
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
    const tError = await getErrorT();
    const tNotif = await getNotificationT();
	try {
		const validated = verifyTeacherSchema.safeParse({ teacherId, level });
		if (!validated.success) {
			const t = await getValidationT();
			return { success: false, error: t(validated.error.issues[0].message) };
		}

		const { userId: adminUserId } = await requireAuth([UserType.ADMIN]);

		await unitOfWork.runTransaction(async (tx) => {
			// Update verification request status if it exists
			const existingVerification = await teacherVerificationRepository.findByTeacherId(teacherId, tx);
			if (existingVerification) {
				await teacherVerificationRepository.update(teacherId, {
					reviewedBy: adminUserId,
					reviewedAt: new Date(),
					rejectionReason: null,
				}, tx);
			}

			// Update teacher profile verification status
			const teacherProfile = await teacherRepository.update(teacherId, {
				isVerified: true,
				verificationLevel: level,
			}, tx);

			if (teacherProfile) {
				await createNotification(
					{
						userId: teacherProfile.userId,
						title: tError("action_error_8"),
						message: tNotif("admin_verification_approved", { level }),
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
		return { success: false, error: tError("action_error_1") };
	}
}

export async function rejectTeacher(
	teacherId: string,
	reason: string,
): Promise<ActionResponse> {
    const tError = await getErrorT();
    const tNotif = await getNotificationT();
	try {
		const validated = rejectTeacherSchema.safeParse({ teacherId, reason });
		if (!validated.success) {
			const t = await getValidationT();
			return { success: false, error: t(validated.error.issues[0].message) };
		}

		const { userId: adminUserId } = await requireAuth([UserType.ADMIN]);

		await unitOfWork.runTransaction(async (tx) => {
			const existingVerification = await teacherVerificationRepository.findByTeacherId(teacherId, tx);
			if (existingVerification) {
				await teacherVerificationRepository.update(teacherId, {
					reviewedBy: adminUserId,
					reviewedAt: new Date(),
					rejectionReason: reason,
				}, tx);
			}

			const teacherProfile = await teacherRepository.update(teacherId, {
				isVerified: false,
				verificationLevel: VerificationLevel.NONE,
			}, tx);

			if (teacherProfile) {
				await createNotification(
					{
						userId: teacherProfile.userId,
						title: tError("action_error_9"),
						message: tNotif("admin_verification_rejected", { reason }),
					},
					tx,
				);
			}
		});

		revalidatePath("/dashboard/admin/verification");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: tError("action_error_2") };
	}
}

export async function updateSystemSettings(
	settings: { settingKey: string; settingValue: string }[],
): Promise<ActionResponse> {
    const t = await getErrorT();
	try {
		const validated = updateSystemSettingsSchema.safeParse(settings);
		if (!validated.success) {
			const t = await getValidationT();
			return { success: false, error: t(validated.error.issues[0].message) };
		}

		const { userId: adminUserId } = await requireAuth([UserType.ADMIN]);

		const currencyChange = settings.find(s => s.settingKey === "DefaultCurrency");
		if (currencyChange) {
			const current = await systemSettingRepository.findByKey("DefaultCurrency");
			const currentCurrency = current?.settingValue;
			if (currentCurrency && currentCurrency !== currencyChange.settingValue) {
				const [bookingCount, serviceCount, paymentCount, payoutCount, refundCount, requestCount, escrowCount] = await Promise.all([
					prisma.booking.count({ where: { currency: currentCurrency as Currency } }),
					prisma.teacherService.count({ where: { currency: currentCurrency as Currency } }),
					prisma.payment.count({ where: { currency: currentCurrency as Currency } }),
					prisma.teacherPayout.count({ where: { currency: currentCurrency as Currency } }),
					prisma.parentRefund.count({ where: { currency: currentCurrency as Currency } }),
					prisma.tutoringRequest.count({ where: { currency: currentCurrency as Currency } }),
					prisma.adminEscrow.count({ where: { currency: currentCurrency as Currency } }),
				]);
				const hasAnyTransaction = [bookingCount, serviceCount, paymentCount, payoutCount, refundCount, requestCount, escrowCount].some(c => c > 0);
				if (hasAnyTransaction) {
					return { success: false, error: t("system_currency_change_blocked") };
				}
			}
		}

		await unitOfWork.runTransaction(async (tx) => {
			await Promise.all(
				settings.map((s) =>
					systemSettingRepository.update(
						s.settingKey,
						{
							settingValue: s.settingValue,
							updatedBy: adminUserId,
						},
						tx,
					),
				),
			);

			if (currencyChange) {
				await tx.currencyConfig.updateMany({ data: { isActiveForUser: false } });
				await tx.currencyConfig.upsert({
					where: { currency: currencyChange.settingValue as Currency },
					update: { isActiveForUser: true },
					create: { currency: currencyChange.settingValue as Currency, isActiveForUser: true, displaySymbol: currencyChange.settingValue, decimalPlaces: 2, sortOrder: 99 }
				});
			}
		});

		revalidatePath("/dashboard/admin/settings");
		updateTag("system-settings");
		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: t("action_error_3") };
	}
}

export async function toggleUserActive(
	targetUserId: string,
	isActive: boolean,
): Promise<ActionResponse> {
    const t = await getErrorT();
	try {
		const validated = toggleUserActiveSchema.safeParse({
			targetUserId,
			isActive,
		});
		if (!validated.success) {
			const t = await getValidationT();
			return { success: false, error: t(validated.error.issues[0].message) };
		}

		const { userId: adminUserId } = await requireAuth([UserType.ADMIN]);

		if (targetUserId === adminUserId) {
			return { success: false, error: t("action_error_4") };
		}

		await userRepository.update(targetUserId, { isActive });

		revalidatePath("/dashboard/admin/users");

		return { success: true };
	} catch (err: unknown) {
		console.error(err);
		return { success: false, error: t("action_error_5") };
	}
}

export async function updateHomepageLayout(
	layoutJson: string,
): Promise<ActionResponse> {
    const t = await getErrorT();
	try {
		const { userId: adminUserId } = await requireAuth([UserType.ADMIN]);

		// التحقق من صحة صيغة JSON
		try {
			JSON.parse(layoutJson);
		} catch {
			return {
				success: false,
				error: t("action_error_6"),
			};
		}

		await systemSettingRepository.upsert(
			"HomepageLayout",
			layoutJson,
			t("admin_homepage_layout_desc"),
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
			error: t("action_error_7"),
		};
	}
}

export async function loadMoreAdminBookings(params: BookingListParams) {
	const res = await BookingService.getAdminBookings(params);
	return sanitizePrismaData(res);
}

