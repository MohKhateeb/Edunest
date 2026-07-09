import { VerificationLevel } from "@prisma/client";
import { z } from "zod";

export const verifyTeacherSchema = z.object({
	teacherId: z.string().min(1, "validation_teacher_id_required"),
	level: z.nativeEnum(VerificationLevel, { message: "validation_verification_level_invalid" }),
});

export const rejectTeacherSchema = z.object({
	teacherId: z.string().min(1, "validation_teacher_id_required"),
	reason: z.string().min(3, "validation_reject_reason_min_length"),
});

export const confirmPaymentSchema = z.object({
	bookingId: z.string().min(1, "validation_booking_id_required"),
});

export const updateSystemSettingsSchema = z.array(
	z.object({
		settingKey: z.string().min(1, "validation_setting_key_required"),
		settingValue: z.string(),
	}),
);

export const toggleUserActiveSchema = z.object({
	targetUserId: z.string().min(1, "validation_user_id_required"),
	isActive: z.boolean(),
});
