import { VerificationLevel } from "@prisma/client";
import { z } from "zod";

export const verifyTeacherSchema = z.object({
	teacherId: z.string().min(1, "معرّف المعلم مطلوب"),
	level: z.nativeEnum(VerificationLevel, { message: "مستوى التوثيق غير صالح" }),
});

export const rejectTeacherSchema = z.object({
	teacherId: z.string().min(1, "معرّف المعلم مطلوب"),
	reason: z.string().min(3, "سبب الرفض يجب أن لا يقل عن 3 أحرف"),
});

export const confirmPaymentSchema = z.object({
	bookingId: z.string().min(1, "معرّف الحجز مطلوب"),
});

export const updateSystemSettingsSchema = z.array(
	z.object({
		settingKey: z.string().min(1, "مفتاح الإعداد مطلوب"),
		settingValue: z.string(),
	}),
);

export const toggleUserActiveSchema = z.object({
	targetUserId: z.string().min(1, "معرّف المستخدم مطلوب"),
	isActive: z.boolean(),
});
