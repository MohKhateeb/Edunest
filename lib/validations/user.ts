import { Currency, UserType } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().email("validation_email_invalid"),
	password: z.string().min(6, "validation_password_min_length"),
});

export const registerSchema = z.object({
	name: z.string().min(2, "validation_name_min_length"),
	email: z.string().email("validation_email_invalid"),
	phone: z.string().optional().or(z.literal("")),
	password: z.string().min(6, "validation_password_min_length"),
	userType: z.enum([UserType.PARENT, UserType.TEACHER]),
});

export const studentSchema = z.object({
	name: z.string().min(2, "validation_student_name_required"),
	grade: z.coerce
		.number()
		.int()
		.min(1, "validation_student_grade_range")
		.max(12),
	school: z.string().optional(),
});

export const updateProfileSchema = z.object({
	name: z.string().min(2, "validation_name_min_length"),
	email: z.string().email("validation_email_invalid"),
	phone: z.string().optional().or(z.literal("")),
	preferredCurrency: z.nativeEnum(Currency, { message: "validation_preferred_currency_invalid" }).optional(),
});

export const changePasswordSchema = z
	.object({
		currentPassword: z
			.string()
			.min(6, "validation_current_password_min_length"),
		newPassword: z
			.string()
			.min(6, "validation_new_password_min_length"),
		confirmPassword: z
			.string()
			.min(6, "validation_confirm_password_min_length"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "validation_password_mismatch",
		path: ["confirmPassword"],
	});
